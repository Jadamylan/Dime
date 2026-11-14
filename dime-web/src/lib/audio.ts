/** Mic capture -> 16 kHz mono PCM16 chunks (~100 ms). Call startMic from a user gesture. */
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
  if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === "undefined")
    throw new MicError("unsupported");
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const resumed = ctx.resume().catch(() => {});
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
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
  let lvl = 0;
  node.port.onmessage = (ev) => {
    const buf = ev.data as ArrayBuffer;
    const s = new Int16Array(buf);
    let peak = 0;
    for (let i = 0; i < s.length; i += 8) peak = Math.max(peak, Math.abs(s[i] ?? 0));
    lvl = peak / 32768;
    onChunk(buf);
  };
  src.connect(node);
  // Not connected to destination: never play the speaker's own mic locally.
  let stopped = false;
  return {
    level: () => lvl,
    stop() {
      if (stopped) return;
      stopped = true;
      node.port.onmessage = null;
      try {
        src.disconnect();
        node.disconnect();
      } catch {
        /* */
      }
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}
