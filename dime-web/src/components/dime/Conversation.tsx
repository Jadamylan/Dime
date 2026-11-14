import { useEffect, useRef, useState } from "react";
import {
  Check,
  HelpCircle,
  Mic,
  Repeat,
  Volume2,
  X,
  AlertCircle,
  Loader2,
  Pencil,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES, ui, type LangCode } from "@/config/languages";
import type { Msg, Role, Turn } from "@/lib/room";
import { speak, stopSpeaking, ttsSupported } from "@/lib/tts";
import { randomId } from "@/lib/ids";
import { SPEECH_LIMIT_MS, SPEECH_TAIL_MS } from "@/lib/speechTiming";

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

export function Conversation(p: ConversationProps) {
  const t = ui(p.myLang);
  const [draft, setDraft] = useState("");
  const [writing, setWriting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hear, setHear] = useState(false);
  const [starting, setStarting] = useState(false);
  const [talking, setTalking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [announce, setAnnounce] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const spoken = useRef(new Set<string>());
  const announced = useRef(new Set<string>());
  const pending = useRef(new Map<string, string>());
  const active = useRef(false);
  const cancelled = useRef(false);
  const tail = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestIn = p.messages.filter((m) => m.from !== p.myRole && m.final && m.translated).at(-1);
  const otherTurn =
    !!p.turn && p.turn.speaker !== p.myRole && !["final", "unavailable"].includes(p.turn.state);
  const voiceActive =
    starting ||
    talking ||
    finishing ||
    (!!p.turn && !["final", "unavailable"].includes(p.turn.state));
  const unavailable = p.turn?.state === "unavailable" || !p.liveReady;
  const disabledInput = !p.typedReady || !!p.demo;
  const audio = ttsSupported() && !p.demo;
  const lastMessage = p.messages.at(-1);

  useEffect(() => {
    if (p.draftSeed !== undefined) {
      setDraft(p.draftSeed);
      setWriting(true);
    }
  }, [p.draftSeed]);
  useEffect(() => {
    for (const m of p.messages) {
      const saved = pending.current.get(m.id);
      if (m.status === "failed" && saved !== undefined && !draft) {
        setDraft(saved);
        setWriting(true);
      }
      if (m.status !== "pending") pending.current.delete(m.id);
      if (m.final && m.status === "delivered" && !announced.current.has(m.id)) {
        announced.current.add(m.id);
        setAnnounce(
          `${m.from === p.myRole ? t.you : t.them}: ${m.from === p.myRole ? m.original : m.translated}`,
        );
      }
    }
  }, [p.messages, draft, p.myRole, t.you, t.them]);
  useEffect(() => {
    if (voiceActive) stopSpeaking();
    if (latestIn && hear && !voiceActive && !spoken.current.has(latestIn.id)) {
      spoken.current.add(latestIn.id);
      speak(latestIn.translated, p.myLang);
    }
  }, [latestIn, hear, voiceActive, p.myLang]);
  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [p.messages.length, lastMessage?.translated, lastMessage?.final]);
  useEffect(() => {
    if (writing) composer.current?.focus();
  }, [writing]);
  useEffect(() => {
    if (p.demo) return;
    const viewport = window.visualViewport;
    const update = () => {
      const page = shell.current?.closest<HTMLElement>(".conversation-page");
      if (!page) return;
      page.style.setProperty(
        "--conversation-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      page.style.setProperty("--conversation-offset", `${viewport?.offsetTop ?? 0}px`);
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
    };
  }, [p.demo]);
  useEffect(() => {
    if (p.turn && ["final", "unavailable"].includes(p.turn.state)) {
      active.current = false;
      setTalking(false);
      setFinishing(false);
    }
  }, [p.turn]);
  useEffect(
    () => () => {
      if (tail.current) clearTimeout(tail.current);
    },
    [],
  );

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
    if (!p.onSend || disabledInput || !text.trim()) return;
    const id = randomId(16);
    if (kind === "text") pending.current.set(id, text);
    const e = p.onSend(id, text, kind);
    setErr(errText(e));
    if (!e && kind === "text") {
      setDraft("");
      setWriting(false);
    }
  };
  const begin = async () => {
    if (active.current || starting || otherTurn || !p.onTalkStart || !p.liveReady) return;
    cancelled.current = false;
    stopSpeaking();
    setStarting(true);
    try {
      const ok = await p.onTalkStart();
      if (cancelled.current) {
        if (ok) p.onTalkStop?.();
        return;
      }
      active.current = ok;
      setTalking(ok);
      if (!ok) setErr(t.liveUnavailable);
    } catch {
      setErr(t.errMic);
    } finally {
      setStarting(false);
    }
  };
  const end = (cancel = false) => {
    cancelled.current = true;
    if (!active.current) return;
    active.current = false;
    setTalking(false);
    setFinishing(true);
    // Delay the existing stop callback so guest audio also retains its final word.
    tail.current = setTimeout(() => p.onTalkStop?.(), cancel ? 0 : SPEECH_TAIL_MS);
  };
  useEffect(() => {
    if (!talking) return;
    const timer = setTimeout(() => end(), SPEECH_LIMIT_MS);
    return () => clearTimeout(timer);
  }, [talking]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = finishing
    ? "translating"
    : starting || (talking && p.turn?.state === "connecting")
      ? "connecting"
      : talking
        ? "listening"
        : p.turn?.state;
  const status =
    state === "connecting"
      ? t.connecting
      : state === "listening"
        ? t.listening
        : state === "translating"
          ? t.translating
          : state === "final"
            ? t.translatedState
            : state === "unavailable"
              ? t.liveUnavailable
              : t.ready;
  const statusStyle =
    state === "listening" || state === "final"
      ? "bg-primary text-primary-foreground"
      : state === "translating" || state === "unavailable"
        ? "bg-clarify text-clarify-foreground"
        : "bg-card text-card-foreground";
  const Icon =
    state === "listening"
      ? Mic
      : state === "final"
        ? Check
        : state === "connecting" || state === "translating"
          ? Loader2
          : state === "unavailable"
            ? AlertCircle
            : Check;

  return (
    <div ref={shell} className={`conversation-shell ${p.demo ? "conversation-demo" : ""}`}>
      <header className="min-w-0 space-y-1">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">
              {p.myRole === "host" ? t.host : t.guest} ·{" "}
              <span lang={p.myLang}>{LANGUAGES[p.myLang].endonym}</span>
            </h1>
            <p className="text-xs leading-snug text-muted-foreground">
              {voiceActive || p.demo
                ? t.voiceMode
                : unavailable && p.turn?.state === "unavailable"
                  ? t.liveUnavailable
                  : t.typedMode}
            </p>
          </div>
          {p.onEnd && (
            <Button variant="ghost" className="tap px-2" onClick={p.onEnd}>
              <X aria-hidden />
              {t.end}
            </Button>
          )}
        </div>
        <div
          className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-1 text-xs font-semibold ${statusStyle}`}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span>
            {status}
            {otherTurn && ` · ${t.otherSpeaking}`}
            {p.notice && !otherTurn && ` · ${p.notice}`}
          </span>
          {(talking || starting) && (
            <Button
              variant="ghost"
              className="tap ml-auto px-1"
              onClick={() => end(true)}
              aria-label={t.cancel}
            >
              <X aria-hidden />
            </Button>
          )}
        </div>
        {!p.typedReady && !p.demo && (
          <div className="flex min-w-0 items-center gap-1 text-xs">
            <span className="truncate">{p.myRole === "host" ? t.needKeysHost : t.needKeysGuest}</span>
            {p.onAddKeys && (
              <Button variant="link" className="h-8 shrink-0 px-1 text-xs" onClick={p.onAddKeys}>
                {t.addKeys}
              </Button>
            )}
          </div>
        )}
      </header>
      <div
        ref={scroller}
        className="conversation-messages"
        aria-label={p.myLang === "es" ? "Conversación" : "Conversation"}
      >
        {p.messages.map((m) => {
          const mine = m.from === p.myRole;
          const lang = mine ? p.myLang : p.otherLang;
          const shown = mine ? m.original : m.translated;
          return (
            <article
              key={m.id}
              aria-label={`${mine ? t.you : t.them} · ${LANGUAGES[lang].endonym}`}
              className={`conversation-bubble ${mine ? "ml-auto bg-primary text-primary-foreground" : "mr-auto border border-foreground bg-card text-card-foreground"}`}
            >
              <div className="mb-1 flex items-center gap-1 text-xs font-semibold">
                {m.kind === "voice" ? (
                  <Mic className="size-3 shrink-0" aria-hidden />
                ) : (
                  <Pencil className="size-3 shrink-0" aria-hidden />
                )}
                {mine ? t.you : t.them} · <span lang={lang}>{LANGUAGES[lang].endonym}</span>
              </div>
              <p lang={p.myLang} dir={LANGUAGES[p.myLang].dir} className="conversation-translation">
                {shown || (m.status === "failed" ? t.failed : "…")}
              </p>
              {!mine && m.original && (
                <p
                  lang={p.otherLang}
                  dir={LANGUAGES[p.otherLang].dir}
                  className="conversation-original mt-1"
                >
                  <span className="font-semibold">{t.original}: </span>
                  {m.original}
                </p>
              )}
              {mine && m.translated && (
                <p
                  lang={p.otherLang}
                  dir={LANGUAGES[p.otherLang].dir}
                  className="conversation-original mt-1"
                >
                  <span className="font-semibold">{t.translated}: </span>
                  {m.translated}
                </p>
              )}
              <p className="mt-1 flex items-center gap-1 text-xs">
                {m.status === "failed" ? (
                  <AlertCircle className="size-3" aria-hidden />
                ) : m.final ? (
                  <Check className="size-3" aria-hidden />
                ) : (
                  <Loader2 className="size-3" aria-hidden />
                )}
                {m.status === "failed"
                  ? t.failed
                  : !m.final
                    ? t.translating
                    : m.status === "pending"
                      ? t.pending
                      : t.delivered}
              </p>
              {!p.demo && m.status === "failed" && mine && (
                <Button
                  variant="ghost"
                  className="tap"
                  onClick={() =>
                    p.onSend?.(m.id, m.original, m.kind === "preset" ? "preset" : "text")
                  }
                >
                  {t.retry}
                </Button>
              )}
              {!p.demo && m.final && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {audio && m.translated && (
                    <Button
                      variant="ghost"
                      className="tap px-1 text-xs"
                      disabled={voiceActive}
                      onClick={() => speak(m.translated, mine ? p.otherLang : p.myLang)}
                      aria-label={t.repeat}
                      title={t.repeat}
                    >
                      <Repeat aria-hidden />
                    </Button>
                  )}
                  {mine && m.kind === "voice" && (
                    <>
                      <Button
                        variant="ghost"
                        className="tap px-1 text-xs"
                        aria-label={t.sayNewTurn}
                        title={t.sayNewTurn}
                        disabled={!p.liveReady || voiceActive}
                        onClick={() => void begin()}
                      >
                        <Mic aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        className="tap px-1 text-xs"
                        aria-label={t.correctText}
                        title={t.correctText}
                        disabled={disabledInput}
                        onClick={() => {
                          setDraft(m.original);
                          setWriting(true);
                          composer.current?.focus();
                        }}
                      >
                        <Pencil aria-hidden />
                      </Button>
                    </>
                  )}
                  {!mine && (
                    <Button
                      variant="ghost"
                      className="tap px-1 text-xs"
                      aria-label={t.sayNewTurn}
                      title={t.sayNewTurn}
                      disabled={disabledInput}
                      onClick={() => submit(t.sayAgain, "preset")}
                    >
                      <HelpCircle aria-hidden />
                    </Button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="sr-only" aria-live="polite" lang={p.myLang}>
        {announce}
      </div>
      {!p.demo && (
        <footer className="conversation-dock">
          {(err || p.error) && (
            <p role="alert" className="text-xs text-destructive">
              {err || errText(p.error ?? null)}
            </p>
          )}
          {p.liveNote && (
            <details className="text-xs text-muted-foreground">
              <summary className="truncate">{t.liveUnavailable}</summary>
              {p.liveNote}
            </details>
          )}
          <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-1">
            <Button
              variant="secondary"
              className="dock-control"
              disabled={!latestIn || !audio || voiceActive}
              onClick={() => latestIn && speak(latestIn.translated, p.myLang)}
            >
              <Repeat aria-hidden />
              <span>{t.repeat}</span>
            </Button>
            <Button
              variant="secondary"
              className="dock-control bg-clarify text-clarify-foreground"
              disabled={disabledInput}
              onClick={() => submit(t.sayAgain, "preset")}
            >
              <HelpCircle aria-hidden />
              <span>{t.sayAgain}</span>
            </Button>
            <Button
              variant="secondary"
              className={`dock-control ${hear ? "bg-primary text-primary-foreground" : ""}`}
              disabled={!audio}
              aria-pressed={hear}
              onClick={() => {
                setHear(!hear);
                if (hear) stopSpeaking();
              }}
            >
              <Volume2 aria-hidden />
              <span>{t.hearTranslation}</span>
            </Button>
          </div>
          {writing ? (
            <form
              className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                submit(draft, "text");
              }}
            >
              <label className="sr-only" htmlFor={`draft-${p.myRole}`}>
                {t.typePlaceholder}
              </label>
              <textarea
                ref={composer}
                id={`draft-${p.myRole}`}
                lang={p.myLang}
                dir={LANGUAGES[p.myLang].dir}
                rows={1}
                maxLength={500}
                value={draft}
                disabled={disabledInput}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t.typePlaceholder}
                className="tap min-w-0 resize-none rounded-lg bg-card px-3 py-2 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submit(draft, "text");
                  }
                }}
              />
              <Button type="submit" className="tap px-3" disabled={disabledInput || !draft.trim()}>
                <Send aria-hidden />
                <span>{t.send}</span>
              </Button>
            </form>
          ) : (
            <Button
              variant="secondary"
              className="tap w-full justify-start px-3"
              disabled={disabledInput}
              onClick={() => setWriting(true)}
            >
              <Pencil aria-hidden />
              {t.writeMessage}
            </Button>
          )}
          {p.liveReady && (
            <Button
              className="tap min-h-12 w-full whitespace-normal text-base font-semibold"
              disabled={otherTurn || starting || finishing}
              aria-pressed={talking}
              onClick={() => (talking ? end() : void begin())}
            >
              <Mic aria-hidden />
              {otherTurn
                ? t.otherSpeaking
                : starting
                  ? t.connecting
                  : finishing
                    ? t.translating
                    : talking
                      ? t.finishTalking
                      : t.tapToTalk}
            </Button>
          )}
          {!p.liveReady && <p className="text-xs text-muted-foreground">{t.liveUnavailable}</p>}
        </footer>
      )}
    </div>
  );
}
