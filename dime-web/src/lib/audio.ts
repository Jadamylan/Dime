import { SPEECH_READY_MS, SPEECH_TAIL_MS } from "./speechTiming";
import { stopSpeaking } from "./tts";
/** Mic capture -> 16 kHz mono PCM16 chunks (50 ms). Call startMic from a user gesture. */
export interface MicHandle {
  stop(): void;
  level(): number;
}
export class MicError extends Error {
  constructor(public code: "denied" | "unsupported" | "failed") {
    super(code);
  }
}

export async function startMic(onChunk: (pcm: ArrayBuffer) => void): Promise<MicHandle> {
  stopSpeaking();
  if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === "undefined")
    throw new MicError("unsupported");
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const resumed = ctx.resume();
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
  } catch (e) {
    void ctx.close();
    throw new MicError((e as Error).name === "NotAllowedError" ? "denied" : "failed");
  }
  try {
    await resumed;
    await ctx.audioWorklet.addModule("/pcm-worklet.js");
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
    throw new MicError("failed");
  }
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "pcm-worklet");
  const mute = ctx.createGain();
  mute.gain.value = 0;
  let lvl = 0;
  let captured = false;
  const readyAt = performance.now();
  node.port.onmessage = (ev) => {
    const buf = ev.data as ArrayBuffer;
    const s = new DataView(buf);
    let peak = 0;
    for (let i = 0; i < s.byteLength; i += 2) peak = Math.max(peak, Math.abs(s.getInt16(i, true)));
    lvl = peak / 32768;
    captured ||= peak > 0;
    onChunk(buf);
  };
  src.connect(node);
  // A silent output keeps the worklet scheduled on Safari without audible monitoring.
  node.connect(mute);
  mute.connect(ctx.destination);
  const dispose = () => {
    node.port.onmessage = null;
    src.disconnect();
    node.disconnect();
    mute.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };
  try {
    await new Promise<void>((resolve, reject) => {
      const poll = () => {
        if (captured && performance.now() - readyAt >= SPEECH_READY_MS) return resolve();
        if (performance.now() - readyAt > 4000) return reject(new MicError("failed"));
        setTimeout(poll, 25);
      };
      poll();
    });
  } catch (e) {
    dispose();
    throw e;
  }
  let stopped = false;
  return {
    level: () => lvl,
    stop() {
      if (stopped) return;
      stopped = true;
      // Keep the final word and flush the last sub-chunk before closing the stream.
      setTimeout(() => {
        node.port.postMessage({ flush: true });
        setTimeout(dispose, 25);
      }, SPEECH_TAIL_MS);
    },
  };
}
