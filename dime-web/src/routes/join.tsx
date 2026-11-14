import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fill, ui, LANGUAGES, type LangCode } from "@/config/languages";
import { Conversation } from "@/components/dime/Conversation";
import { Wordmark } from "@/components/dime/Wordmark";
import {
  clearJoinedNotice,
  joinRoom,
  leave,
  parseJoinHash,
  sendText,
  startTalking,
  stopTalking,
} from "@/lib/room";
import { useRoom } from "@/lib/useRoom";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Join a conversation — Dime" },
      { name: "description", content: "Join a translated conversation from a Dime QR code." },
      { property: "og:title", content: "Join a conversation — Dime" },
      {
        property: "og:description",
        content: "Join a translated conversation from a Dime QR code.",
      },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const [info, setInfo] = useState<ReturnType<typeof parseJoinHash> | "bad" | null>(null);
  const room = useRoom();
  useEffect(() => {
    setInfo(parseJoinHash(window.location.search || window.location.hash) ?? "bad");
    return () => leave();
  }, []);
  useEffect(() => {
    if (room.justJoined) {
      const id = setTimeout(clearJoinedNotice, 6000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [room.justJoined]);

  if (info === null) return <main className="min-h-dvh" />;
  if (info === "bad") {
    return (
      <main className="safe-pad mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 text-center">
        <Wordmark size="sm" />
        <p className="text-xl" lang="en">
          {ui("en").errToken}
        </p>
        <p className="text-xl" lang="es">
          {ui("es").errToken}
        </p>
        <Link to="/" className="tap inline-flex items-center underline">
          Dime
        </Link>
      </main>
    );
  }
  const pair = room.pair ?? info.pair;
  const g: LangCode = pair.guest;
  const t = ui(g);

  if (room.phase === "connected" || room.phase === "reconnecting") {
    return (
      <main className="conversation-page mx-auto flex max-w-xl flex-col">
        {room.phase === "reconnecting" && (
          <p
            role="status"
            className="mb-2 rounded-2xl bg-clarify px-4 py-2 text-clarify-foreground"
          >
            {t.reconnecting}
          </p>
        )}
        <Conversation
          myRole="guest"
          myLang={pair.guest}
          otherLang={pair.host}
          messages={room.messages}
          turn={room.turn}
          typedReady={room.typedReady}
          liveReady={room.liveReady}
          notice={room.justJoined ? t.joined : null}
          liveNote={room.liveNote}
          error={room.error}
          onSend={(id, text, kind) => sendText(id, text, kind)}
          onTalkStart={startTalking}
          onTalkStop={stopTalking}
          onEnd={() => {
            leave();
            window.location.assign("/");
          }}
        />
      </main>
    );
  }

  const err =
    room.phase === "error"
      ? ((
          {
            token: t.errToken,
            full: t.errFull,
            expired: t.errExpired,
            timeout: t.errTimeout,
            signal: t.errSignal,
            roomgone: t.errRoomGone,
            channel: t.errChannel,
            noack: t.errNoAck,
          } as Record<string, string>
        )[room.error ?? "timeout"] ?? t.errTimeout)
      : null;
  const busy = room.phase === "opening";
  return (
    <main
      className="safe-pad mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 text-center"
      lang={LANGUAGES[g].locale}
      dir={LANGUAGES[g].dir}
    >
      <Wordmark size="sm" lang={g} />
      <div className="space-y-3">
        <h1 className="text-4xl font-bold">{t.joinTitle}</h1>
        <p className="text-xl">{fill(t.joinBody, g, pair)}</p>
      </div>
      {err && (
        <p
          role="alert"
          className="rounded-2xl bg-clarify px-4 py-3 text-lg font-medium text-clarify-foreground"
        >
          {err}
        </p>
      )}
      {err && (
        <details className="w-full text-left text-sm text-muted-foreground">
          <summary>Details</summary>
          <p>ICE: {room.diag.ice} · last OK: {room.diag.lastOk}</p>
          <ol className="font-mono text-xs">
            {room.diag.events.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ol>
        </details>
      )}
      {room.phase === "ended" && <p className="text-lg">{t.ended}</p>}
      <button
        disabled={busy}
        onClick={() => void joinRoom(info)}
        className="tap w-full rounded-full bg-primary py-5 text-2xl font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy
          ? room.stage === "connecting"
            ? t.stageConnecting
            : room.stage === "waitingHost"
              ? t.stageWaiting
              : t.stageInvite
          : err ? t.retry : t.join}
      </button>
    </main>
  );
}
