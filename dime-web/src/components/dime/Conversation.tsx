import { useEffect, useRef, useState } from "react";
import { Check, HelpCircle, Mic, Repeat, Volume2, X, AlertCircle, Loader2 } from "lucide-react";
import { LANGUAGES, ui, type LangCode } from "@/config/languages";
import type { Msg, Role, Turn } from "@/lib/room";
import { speak, stopSpeaking, ttsSupported } from "@/lib/tts";
import { randomId } from "@/lib/ids";

export interface ConversationProps {
  myRole: Role;
  myLang: LangCode;
  otherLang: LangCode;
  messages: Msg[];
  turn: Turn | null;
  typedReady: boolean;
  liveReady: boolean;
  notice?: string | null;
  liveNote?: string | null;
  error?: string | null;
  demo?: boolean;
  compact?: boolean;
  draftSeed?: string;
  onSend?: (id: string, text: string, kind: "text" | "preset") => string | null;
  onTalkStart?: () => Promise<boolean>;
  onTalkStop?: () => void;
  onEnd?: () => void;
  onAddKeys?: () => void;
}

function TurnBadge({ turn, myRole, lang }: { turn: Turn | null; myRole: Role; lang: LangCode }) {
  const t = ui(lang);
  if (!turn) return null;
  const steps: { k: Turn["state"]; label: string; icon: React.ReactNode }[] = [
    { k: "listening", label: t.listening, icon: <Mic className="size-5" aria-hidden /> },
    { k: "translating", label: t.translating, icon: <Loader2 className="size-5" aria-hidden /> },
    { k: "final", label: t.translatedState, icon: <Check className="size-5" aria-hidden /> },
  ];
  if (turn.state === "unavailable")
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-clarify px-4 py-3 text-base font-medium text-clarify-foreground">
        <AlertCircle className="size-5" aria-hidden />
        {turn.reason ?? t.liveUnavailable}
      </div>
    );
  if (turn.state === "connecting")
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-base font-medium">
        <Loader2 className="size-5 pulse-soft" aria-hidden />
        {t.connecting}
        {turn.speaker !== myRole && ` · ${t.otherSpeaking}`}
      </div>
    );
  const idx = steps.findIndex((s) => s.k === turn.state);
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label={t.liveCaptions}>
      {steps.map((s, i) => (
        <li
          key={s.k}
          className={`flex flex-1 items-center justify-center gap-1 rounded-2xl px-2 py-2 text-sm whitespace-nowrap font-semibold ${i === idx ? "bg-primary text-primary-foreground" : i < idx ? "bg-card" : "bg-card text-muted-foreground"}`}
          aria-current={i === idx ? "step" : undefined}
        >
          <span className={i === idx && s.k === "listening" ? "pulse-soft" : ""}>{s.icon}</span>
          {s.label}
        </li>
      ))}
    </ol>
  );
}

export function Conversation(p: ConversationProps) {
  const t = ui(p.myLang);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [hear, setHear] = useState(false);
  const [talking, setTalking] = useState(false);
  const [openOrig, setOpenOrig] = useState<Set<string>>(new Set());
  const spoken = useRef<Set<string>>(new Set());
  const scroller = useRef<HTMLDivElement>(null);
  const pendingDraft = useRef<Map<string, string>>(new Map());
  const [announce, setAnnounce] = useState("");

  const incoming = p.messages.filter((m) => m.from !== p.myRole && m.final && m.translated);
  const latestIn = incoming[incoming.length - 1];

  useEffect(() => {
    if (p.draftSeed !== undefined) setDraft(p.draftSeed);
  }, [p.draftSeed]);

  // Announce completed captions; speak finals once when "Hear translation" is on.
  useEffect(() => {
    if (!latestIn) return;
    setAnnounce(latestIn.translated);
    if (hear && !talking && !spoken.current.has(latestIn.id)) {
      spoken.current.add(latestIn.id);
      speak(latestIn.translated, p.myLang);
    }
  }, [latestIn?.id, latestIn?.translated, hear, talking, p.myLang]);

  // Restore draft if a send fails.
  useEffect(() => {
    for (const m of p.messages) {
      if (m.status === "failed" && pendingDraft.current.has(m.id) && !draft) {
        setDraft(pendingDraft.current.get(m.id)!);
      }
      if (m.status !== "pending") pendingDraft.current.delete(m.id);
    }
  }, [p.messages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = scroller.current;
    if (el)
      el.scrollTo({
        top: el.scrollHeight,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
  }, [p.messages.length, p.messages[p.messages.length - 1]?.translated]);

  const errText = (code: string | null) =>
    code === "toolong"
      ? t.errTooLong
      : code === "rate"
        ? t.errRate
        : code === "mic"
          ? t.errMic
          : code === "timeout"
            ? t.errTimeout
            : code;

  const submit = (text: string, kind: "text" | "preset") => {
    if (!p.onSend) return;
    const id = randomId(16);
    if (kind === "text") pendingDraft.current.set(id, text);
    const e = p.onSend(id, text, kind);
    if (e) {
      setErr(errText(e));
      return;
    }
    setErr(null);
    if (kind === "text") setDraft("");
  };

  const begin = async () => {
    if (talking || !p.onTalkStart) return;
    stopSpeaking();
    setTalking(true);
    const ok = await p.onTalkStart();
    if (!ok) setTalking(false);
  };
  const end = () => {
    if (!talking) return;
    setTalking(false);
    p.onTalkStop?.();
  };

  const otherTurn =
    p.turn && p.turn.speaker !== p.myRole && !["final", "unavailable"].includes(p.turn.state);
  const live = p.liveReady && !p.demo;
  const disabledInput = !p.typedReady || p.demo;

  return (
    <div className={`flex h-full min-h-0 flex-col ${p.compact ? "gap-2" : "gap-3"}`}>
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            {p.myRole === "host" ? t.host : t.guest} ·{" "}
            <span lang={p.myLang}>{LANGUAGES[p.myLang].endonym}</span>
          </div>
          <div className="truncate text-sm text-muted-foreground">
            {p.turn && !["final", "unavailable"].includes(p.turn.state)
              ? t.liveCaptions
              : t.typedMode}
          </div>
        </div>
        {p.onEnd && (
          <button
            onClick={p.onEnd}
            className="tap flex items-center gap-1 rounded-full bg-card px-4 text-base font-medium"
            aria-label={t.end}
          >
            <X className="size-5" aria-hidden />
            {t.end}
          </button>
        )}
      </header>

      {p.notice && (
        <div
          role="status"
          className="rounded-2xl bg-primary px-4 py-3 text-lg font-semibold text-primary-foreground"
        >
          {p.notice}
        </div>
      )}
      {!p.typedReady && !p.demo && (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-clarify px-4 py-3 text-base font-medium text-clarify-foreground">
          <span>{p.myRole === "host" ? t.needKeysHost : t.needKeysGuest}</span>
          {p.onAddKeys && (
            <button
              onClick={p.onAddKeys}
              className="tap rounded-full bg-foreground px-4 text-background"
            >
              {t.addKeys}
            </button>
          )}
        </div>
      )}
      <TurnBadge turn={p.turn} myRole={p.myRole} lang={p.myLang} />
      {p.liveNote && !p.demo && <p className="text-sm text-muted-foreground">{p.liveNote}</p>}

      <div
        ref={scroller}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
        aria-label="Conversation"
      >
        {p.messages.map((m) => {
          const mine = m.from === p.myRole;
          const preset = m.kind === "preset";
          if (mine) {
            return (
              <div
                key={m.id}
                className={`ml-6 rounded-3xl px-4 py-3 ${preset ? "bg-clarify text-clarify-foreground" : "bg-card"}`}
              >
                <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {preset && <HelpCircle className="size-4" aria-hidden />}
                  {preset ? t.sayAgainLabel : t.original}
                  {m.kind === "voice" && " · 🎙"}
                </div>
                <p lang={p.myLang} className={`${p.compact ? "text-lg" : "text-xl"} leading-snug`}>
                  {m.original || "…"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  {m.status === "pending" && m.kind !== "voice" && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="size-4" aria-hidden />
                      {t.pending}
                    </span>
                  )}
                  {m.status === "delivered" && m.final && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Check className="size-4" aria-hidden />
                      {t.delivered}
                    </span>
                  )}
                  {m.status === "failed" && (
                    <>
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="size-4" aria-hidden />
                        {t.failed}
                      </span>
                      {p.onSend && (
                        <button
                          className="tap rounded-full bg-foreground px-4 text-background"
                          onClick={() =>
                            p.onSend!(m.id, m.original, m.kind === "preset" ? "preset" : "text")
                          }
                        >
                          {t.retry}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          }
          const shown = m.translated;
          return (
            <div
              key={m.id}
              className={`mr-6 rounded-3xl px-4 py-3 ${preset ? "bg-clarify text-clarify-foreground" : m.final ? "bg-background ring-2 ring-foreground" : "bg-background ring-2 ring-primary"}`}
            >
              <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {preset && <HelpCircle className="size-4" aria-hidden />}
                {preset ? t.sayAgainLabel : t.translated}
                {!m.final && ` · ${t.translating}`}
              </div>
              <p
                lang={p.myLang}
                className={`${p.compact ? "text-xl" : "text-2xl"} font-semibold leading-snug`}
              >
                {shown || (m.status === "failed" ? t.failed : "…")}
              </p>
              {m.original && !p.compact && (
                <button
                  className="tap mt-1 text-sm text-muted-foreground underline"
                  aria-expanded={openOrig.has(m.id)}
                  onClick={() =>
                    setOpenOrig((s) => {
                      const n = new Set(s);
                      if (n.has(m.id)) n.delete(m.id);
                      else n.add(m.id);
                      return n;
                    })
                  }
                >
                  {t.showOriginal}
                </button>
              )}
              {openOrig.has(m.id) && (
                <p lang={p.otherLang} className="text-base text-muted-foreground">
                  {t.original}: {m.original}
                </p>
              )}
              {m.final && shown && ttsSupported() && !p.demo && (
                <button
                  className="tap mt-1 flex items-center gap-1 text-sm font-medium"
                  onClick={() => speak(shown, p.myLang)}
                  aria-label={`${t.play}: ${shown}`}
                >
                  <Volume2 className="size-4" aria-hidden />
                  {t.play}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="sr-only" aria-live="polite" lang={p.myLang}>
        {announce}
      </div>

      {!p.demo && (
        <div className="space-y-2 border-t pt-3">
          {err && (
            <p role="alert" className="text-base font-medium text-destructive">
              {err}
            </p>
          )}
          {p.error && (
            <p role="alert" className="text-base font-medium text-destructive">
              {errText(p.error)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!latestIn || !ttsSupported()}
              onClick={() => latestIn && speak(latestIn.translated, p.myLang)}
              className="tap flex items-center gap-1 rounded-full bg-card px-4 text-base font-medium disabled:opacity-40"
            >
              <Repeat className="size-5" aria-hidden />
              {t.repeat}
            </button>
            <button
              disabled={disabledInput}
              onClick={() => submit(t.sayAgain, "preset")}
              className="tap flex items-center gap-1 rounded-full bg-clarify px-4 text-base font-medium text-clarify-foreground disabled:opacity-40"
              aria-label={`${t.sayAgainLabel}: ${t.sayAgain}`}
            >
              <HelpCircle className="size-5" aria-hidden />
              {t.sayAgain}
            </button>
            {ttsSupported() && (
              <button
                aria-pressed={hear}
                onClick={() => {
                  setHear((h) => !h);
                  if (hear) stopSpeaking();
                }}
                className={`tap flex items-center gap-1 rounded-full px-4 text-base font-medium ${hear ? "bg-primary text-primary-foreground" : "bg-card"}`}
              >
                <Volume2 className="size-5" aria-hidden />
                {t.hearTranslation}
              </button>
            )}
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft, "text");
            }}
          >
            <label className="sr-only" htmlFor={`draft-${p.myRole}`}>
              {t.typePlaceholder}
            </label>
            <textarea
              id={`draft-${p.myRole}`}
              lang={p.myLang}
              rows={1}
              maxLength={500}
              value={draft}
              disabled={disabledInput}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(draft, "text");
                }
              }}
              placeholder={t.typePlaceholder}
              className="tap min-w-0 flex-1 resize-none rounded-2xl bg-card px-4 py-3 text-lg disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={disabledInput || !draft.trim()}
              className="tap rounded-2xl bg-primary px-5 text-lg font-semibold text-primary-foreground disabled:opacity-40"
            >
              {t.send}
            </button>
          </form>
          {live && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!!otherTurn}
                aria-label={t.holdToTalk}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  void begin();
                }}
                onPointerUp={end}
                onPointerCancel={end}
                onKeyDown={(e) => {
                  if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                    e.preventDefault();
                    void begin();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    end();
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`flex min-h-16 flex-1 touch-none select-none items-center justify-center gap-2 rounded-3xl text-lg font-semibold disabled:opacity-40 ${talking ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}
              >
                <Mic className="size-6" aria-hidden />
                {otherTurn ? t.otherSpeaking : talking ? t.listening : t.holdToTalk}
              </button>
              <button
                type="button"
                disabled={!!otherTurn}
                aria-pressed={talking}
                onClick={() => (talking ? end() : void begin())}
                className="tap rounded-3xl bg-card px-4 text-base font-medium disabled:opacity-40"
              >
                {talking ? t.stop : t.tapToTalk}
              </button>
            </div>
          )}
          {!p.liveReady && p.typedReady && (
            <p className="text-sm text-muted-foreground">{t.liveUnavailable}</p>
          )}
        </div>
      )}
    </div>
  );
}
