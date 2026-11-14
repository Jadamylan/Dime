import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ui, validPair, DEFAULT_GUEST, DEFAULT_HOST } from "@/config/languages";
import { Invite } from "@/components/dime/Invite";
import { Conversation } from "@/components/dime/Conversation";
import {
  clearJoinedNotice,
  hasActiveHost,
  leave,
  openHost,
  sendText,
  startTalking,
  stopTalking,
} from "@/lib/room";
import { nav as navFlags, useRoom } from "@/lib/useRoom";
import { canCreateInvitation } from "@/config/publicUrl";
import { PublishedInvitationNotice } from "@/components/dime/PublishedInvitationNotice";

export const Route = createFileRoute("/host")({
  validateSearch: (s: Record<string, unknown>) => ({
    h: String(s["h"] ?? DEFAULT_HOST),
    g: String(s["g"] ?? DEFAULT_GUEST),
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Host a conversation — Dime" },
      { name: "description", content: "Show this QR code to start a translated conversation." },
      { property: "og:title", content: "Host a conversation — Dime" },
      {
        property: "og:description",
        content: "Show this QR code to start a translated conversation.",
      },
    ],
  }),
  component: HostPage,
});

function HostPage() {
  const { h, g } = Route.useSearch();
  const pair = validPair(h, g);
  const room = useRoom();
  const navigate = useNavigate();
  const [invitationAllowed, setInvitationAllowed] = useState(false);

  useEffect(() => {
    const allowed = canCreateInvitation(window.location.hostname);
    setInvitationAllowed(allowed);
    if (allowed && pair && !hasActiveHost()) void openHost(pair);
    return () => {
      if (navFlags.keepHostAlive) navFlags.keepHostAlive = false;
      else leave();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (room.justJoined) {
      const id = setTimeout(clearJoinedNotice, 6000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [room.justJoined]);

  if (!invitationAllowed) {
    return <main className="safe-pad mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center"><PublishedInvitationNotice /></main>;
  }

  if (!pair) {
    return (
      <main className="safe-pad mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl">
          {ui("en").sameLang} / {ui("es").sameLang}
        </p>
        <Link
          to="/"
          className="tap inline-flex items-center rounded-full bg-primary px-6 text-lg font-semibold text-primary-foreground"
        >
          Dime
        </Link>
      </main>
    );
  }
  const t = ui(pair.host);
  const cancel = () => {
    leave();
    void navigate({ to: "/" });
  };
  const roomPair = room.pair ?? pair;

  if (room.phase === "error" || room.phase === "ended") {
    const msg =
      room.error === "expired" ? t.errExpired : room.error === "signal" ? t.errSignal : t.ended;
    return (
      <main className="safe-pad mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 text-center">
        <p className="text-2xl font-semibold">{msg}</p>
        <button
          className="tap rounded-full bg-primary px-6 text-lg font-semibold text-primary-foreground"
          onClick={() => {
            leave();
            void openHost(pair);
          }}
        >
          {t.start}
        </button>
        <Link to="/" className="tap inline-flex items-center underline">
          {t.cancel}
        </Link>
      </main>
    );
  }

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
          myRole="host"
          myLang={roomPair.host}
          otherLang={roomPair.guest}
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
          onEnd={cancel}
          onAddKeys={() => {
            navFlags.keepHostAlive = true;
            void navigate({ to: "/setup" });
          }}
        />
      </main>
    );
  }

  return (
    <main className="safe-pad mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4">
      <Invite pair={pair} url={room.phase === "waiting" ? room.joinUrl : ""} onCancel={cancel} />
      {!room.typedReady && (
        <button
          className="tap text-base underline"
          onClick={() => {
            navFlags.keepHostAlive = true;
            void navigate({ to: "/setup" });
          }}
        >
          {t.addKeys}
        </button>
      )}
    </main>
  );
}
