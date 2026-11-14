import type { Msg, Turn } from "./room";

export interface DemoLine {
  from: "host" | "guest";
  original: string;
  translated: string;
}
export const DEMO_LINES: DemoLine[] = [
  {
    from: "host",
    original: "Hola, ¿tienen una cita disponible el sábado a las dos?",
    translated: "Hi, do you have an appointment available Saturday at two?",
  },
  {
    from: "guest",
    original: "Sunday at two is available for $85.",
    translated: "Hay una cita disponible el domingo a las dos por 85 dólares.",
  },
  {
    from: "host",
    original: "Perfecto. Confirmo el domingo a las dos por 85 dólares.",
    translated: "Perfect. I confirm Sunday at two for $85.",
  },
  {
    from: "guest",
    original: "Great, Sunday at 2 p.m. for $85. See you then.",
    translated: "Perfecto, el domingo a las dos de la tarde por 85 dólares. Nos vemos entonces.",
  },
];

export const INTRO_MS = 7000;
const SPEAK_MS = 4500;
const XLATE_MS = 1200;
const HOLD_MS = 3300;
export const LINE_MS = SPEAK_MS + XLATE_MS + HOLD_MS;
export const OUTRO_MS = 6000;
export const DEMO_TOTAL_MS = INTRO_MS + DEMO_LINES.length * LINE_MS + OUTRO_MS;

export type DemoStage = "invite" | "scanned" | "joinTap" | "joined" | "talk" | "outro";

function words(s: string, frac: number) {
  const w = s.split(" ");
  return w.slice(0, Math.max(0, Math.ceil(w.length * Math.min(1, frac)))).join(" ");
}

export interface DemoFrame {
  stage: DemoStage;
  messages: Msg[];
  turn: Turn | null;
  step: number; // 1..6
}

/** Pure function of elapsed time: deterministic, no network, no audio. */
export function demoAt(ms: number): DemoFrame {
  const t = Math.max(0, Math.min(ms, DEMO_TOTAL_MS));
  if (t < INTRO_MS) {
    const stage: DemoStage =
      t < 2500 ? "invite" : t < 4000 ? "scanned" : t < 5000 ? "joinTap" : "joined";
    return { stage, messages: [], turn: null, step: 1 };
  }
  const rel = t - INTRO_MS;
  const idx = Math.floor(rel / LINE_MS);
  const messages: Msg[] = [];
  let turn: Turn | null = null;
  DEMO_LINES.forEach((l, i) => {
    const id = `demo-line-${i}`.padEnd(16, "x");
    const base = { id, kind: "voice" as const, from: l.from, ts: i, status: "delivered" as const };
    if (i < idx)
      messages.push({ ...base, original: l.original, translated: l.translated, final: true });
    else if (i === idx) {
      const lt = rel - i * LINE_MS;
      const speakFrac = lt / SPEAK_MS;
      const xFrac = (lt - 700) / (SPEAK_MS + XLATE_MS - 700);
      const final = lt >= SPEAK_MS + XLATE_MS;
      const state: Turn["state"] =
        lt < SPEAK_MS ? (lt < 400 ? "listening" : "listening") : final ? "final" : "translating";
      const translated = final ? l.translated : words(l.translated, xFrac);
      messages.push({
        ...base,
        status: final ? "delivered" : "pending",
        original: words(l.original, speakFrac) || "…",
        translated,
        final,
      });
      turn = {
        id,
        speaker: l.from,
        state: translated && !final && lt < SPEAK_MS ? "translating" : state,
        startedAt: 0,
        firstCaptionMs: null,
      };
      if (lt < SPEAK_MS && !translated) turn.state = "listening";
    }
  });
  if (idx >= DEMO_LINES.length) return { stage: "outro", messages, turn: null, step: 6 };
  return { stage: "talk", messages, turn, step: idx + 2 };
}
