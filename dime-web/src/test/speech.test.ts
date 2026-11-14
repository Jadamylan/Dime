import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { buildSetup, LiveSession } from "@/lib/live";
import { PCM_CHUNK_MS, PCM_RATE, SPEECH_LIMIT_MS, SPEECH_TAIL_MS } from "@/lib/speechTiming";

describe("speech capture rules", () => {
  it("limits the default tap turn to 60 seconds", () => {
    expect(SPEECH_LIMIT_MS).toBe(60_000);
  });
  it("retains 650ms of ending audio", () => {
    expect(SPEECH_TAIL_MS).toBe(650);
  });
  it("uses the speaker locale independently of the translation code", () => {
    expect(buildSetup("en").setup.inputAudioTranscription.languageCodes).toEqual(["es-US"]);
    expect(buildSetup("es").setup.inputAudioTranscription.languageCodes).toEqual(["en-US"]);
    expect(buildSetup("en").setup.generationConfig.translationConfig.targetLanguageCode).toBe("en");
    expect(buildSetup("es").setup.generationConfig.translationConfig.targetLanguageCode).toBe("es");
  });
  it("keeps automatic detection enabled with 650ms ending silence", () => {
    expect(buildSetup("en").setup.realtimeInputConfig.automaticActivityDetection).toEqual({
      disabled: false,
      silenceDurationMs: 650,
    });
  });
  it.each([16000, 44100, 48000])("resamples %iHz to 50ms little-endian PCM16 chunks", (rate) => {
    const chunks: ArrayBuffer[] = [];
    let processor: { process(inputs: Float32Array[][]): boolean } | undefined;
    const sandbox = {
      sampleRate: rate,
      AudioWorkletProcessor: class {
        port = { onmessage: null, postMessage: (b: ArrayBuffer) => chunks.push(b) };
      },
      registerProcessor: (_name: string, C: new () => typeof processor) => {
        processor = new C();
      },
    };
    vm.runInNewContext(readFileSync("public/pcm-worklet.js", "utf8"), sandbox);
    const input = new Float32Array(rate / 10).fill(0.5);
    processor?.process([[input]]);
    expect(PCM_RATE).toBe(16000);
    expect(PCM_CHUNK_MS).toBe(50);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0]?.byteLength).toBe(1600);
    const data = new DataView(chunks[0] ?? new ArrayBuffer(0));
    expect(data.getInt16(0, true)).toBe(16383);
    expect(data.getUint8(0)).toBe(255);
    expect(data.getUint8(1)).toBe(63);
  });
  it("ends the stream once, after the microphone tail", () => {
    vi.useFakeTimers();
    const sent: string[] = [];
    class Socket {
      static OPEN = 1;
      readyState = 1;
      onopen: (() => void) | null = null;
      onmessage: ((event: { data: string }) => void) | null = null;
      send(s: string) {
        sent.push(s);
      }
      close() {}
    }
    const sockets: Socket[] = [];
    vi.stubGlobal(
      "WebSocket",
      class extends Socket {
        constructor() {
          super();
          sockets.push(this);
        }
      },
    );
    const session = new LiveSession("test", "en", {
      onReady() {},
      onText() {},
      onTurnComplete() {},
      onFail() {},
    });
    session.open();
    sockets[0]?.onmessage?.({ data: JSON.stringify({ setupComplete: {} }) });
    session.endAudio();
    session.endAudio();
    vi.advanceTimersByTime(650);
    expect(sent).toHaveLength(0);
    session.send(new ArrayBuffer(1600));
    vi.advanceTimersByTime(100);
    expect(
      sent.map((s) => JSON.parse(s)).filter((m) => m.realtimeInput.audioStreamEnd),
    ).toHaveLength(1);
    expect(session.send(new ArrayBuffer(1600))).toBe(false);
    session.close();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
