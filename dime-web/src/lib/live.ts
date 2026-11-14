import { SPEECH_TAIL_MS } from "./speechTiming";
/** Gemini Live Translate session over the documented browser WebSocket protocol. Host-only. */
export const LIVE_MODEL = "gemini-3.5-live-translate-preview";
const WS =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

export type LiveFail = "setup-timeout" | "denied" | "quota" | "unsupported" | "closed" | "network";

export interface LiveCallbacks {
  onReady(): void;
  onText(u: { original: string; translated: string }): void;
  onTurnComplete(): void;
  onFail(reason: LiveFail): void;
}

function b64(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

// The only supported voice pair is English ↔ Spanish; speech locales are not target codes.
export function buildSetup(target: string, speechLocale = target === "en" ? "es-US" : "en-US") {
  return {
    setup: {
      model: `models/${LIVE_MODEL}`,
      inputAudioTranscription: { languageCodes: [speechLocale] },
      outputAudioTranscription: {},
      realtimeInputConfig: {
        automaticActivityDetection: { disabled: false, silenceDurationMs: SPEECH_TAIL_MS },
      },
      generationConfig: {
        responseModalities: ["AUDIO"],
        translationConfig: { targetLanguageCode: target, echoTargetLanguage: false },
      },
    },
  };
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private ready = false;
  private queue: ArrayBuffer[] = [];
  private original = "";
  private translated = "";
  private done = false;
  private ending = false;
  private endTimer: ReturnType<typeof setTimeout> | null = null;
  private audioEnded = false;
  private setupTimer: ReturnType<typeof setTimeout> | null = null;
  static MAX_QUEUE = 100; // ~10 s buffered while setup completes

  constructor(
    private key: string,
    private target: string,
    private cb: LiveCallbacks,
    private setupTimeoutMs = 8000,
  ) {}

  open() {
    try {
      this.ws = new WebSocket(`${WS}?key=${encodeURIComponent(this.key)}`);
    } catch {
      return this.fail("network");
    }
    this.setupTimer = setTimeout(() => this.fail("setup-timeout"), this.setupTimeoutMs);
    this.ws.onopen = () => this.ws?.send(JSON.stringify(buildSetup(this.target)));
    this.ws.onmessage = async (ev) => {
      const raw = typeof ev.data === "string" ? ev.data : await (ev.data as Blob).text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let m: any;
      try {
        m = JSON.parse(raw);
      } catch {
        return;
      }
      if (m.setupComplete) {
        this.ready = true;
        if (this.setupTimer) clearTimeout(this.setupTimer);
        this.cb.onReady();
        for (const q of this.queue) this.sendNow(q);
        this.queue = [];
        return;
      }
      const sc = m.serverContent;
      if (!sc) return;
      let changed = false;
      if (sc.inputTranscription?.text) {
        this.original += sc.inputTranscription.text;
        changed = true;
      }
      if (sc.outputTranscription?.text) {
        this.translated += sc.outputTranscription.text;
        changed = true;
      }
      if (changed)
        this.cb.onText({ original: this.original.trim(), translated: this.translated.trim() });
      if (sc.turnComplete) this.cb.onTurnComplete();
    };
    this.ws.onerror = () => {};
    this.ws.onclose = (ev) => {
      if (this.done) return;
      const r = (ev.reason || "").toLowerCase();
      if (ev.code === 1008 || /api key|permission|denied|unauth/.test(r)) this.fail("denied");
      else if (/quota|resource|exhaust|rate/.test(r)) this.fail("quota");
      else if (/model|not found|unsupported/.test(r)) this.fail("unsupported");
      else this.fail(this.ready ? "closed" : "network");
    };
  }

  /** Returns false if the startup buffer is full (caller should report). */
  send(pcm: ArrayBuffer): boolean {
    if (this.done || this.audioEnded) return false;
    if (this.ready) {
      this.sendNow(pcm);
      return true;
    }
    if (this.queue.length >= LiveSession.MAX_QUEUE) return false;
    this.queue.push(pcm);
    return true;
  }
  private sendNow(pcm: ArrayBuffer) {
    this.ws?.send(
      JSON.stringify({
        realtimeInput: { audio: { data: b64(pcm), mimeType: "audio/pcm;rate=16000" } },
      }),
    );
  }
  endAudio() {
    if (this.ending || this.done) return;
    this.ending = true;
    // MicHandle.stop keeps a short tail; end the stream only after that tail is delivered.
    this.endTimer = setTimeout(() => {
      if (this.ready && this.ws?.readyState === WebSocket.OPEN) {
        this.audioEnded = true;
        this.ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      }
    }, SPEECH_TAIL_MS + 100);
  }
  get isReady() {
    return this.ready;
  }
  private fail(r: LiveFail) {
    if (this.done) return;
    this.close();
    this.cb.onFail(r);
  }
  close() {
    this.done = true;
    if (this.endTimer) clearTimeout(this.endTimer);
    if (this.setupTimer) clearTimeout(this.setupTimer);
    try {
      this.ws?.close();
    } catch {
      /* */
    }
    this.ws = null;
    this.queue = [];
  }
}
