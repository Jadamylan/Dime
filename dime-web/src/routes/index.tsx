import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { canCreateInvitation } from "@/config/publicUrl";
import { PublishedInvitationNotice } from "@/components/dime/PublishedInvitationNotice";
import {
  DEFAULT_GUEST,
  DEFAULT_HOST,
  pairHasLiveVoice,
  ui,
  validPair, type LangCode } from "@/config/languages";
import { Wordmark } from "@/components/dime/Wordmark";
import { LangSelect } from "@/components/dime/LangSelect";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Dime — Tell me in your language" },
      {
        name: "description",
        content: "Two phones, one QR code, translated conversation in 10 languages.",
      },
      { property: "og:title", content: "Dime — Tell me in your language" },
      {
        property: "og:description",
        content: "Two phones, one QR code, translated conversation in 10 languages.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [host, setHost] = useState<LangCode>(DEFAULT_HOST);
  const [guest, setGuest] = useState<LangCode>(DEFAULT_GUEST);
  const [invitationAllowed, setInvitationAllowed] = useState(false);
  useEffect(() => setInvitationAllowed(canCreateInvitation(window.location.hostname)), []);
  const nav = useNavigate();
  const t = ui(host);
  const ok = validPair(host, guest);
  return (
    <main className="safe-pad mx-auto flex min-h-dvh max-w-md flex-col justify-between gap-8">
      <div className="flex flex-1 flex-col justify-center gap-10">
        <div className="space-y-4">
          <Wordmark lang={host} />
          <p className="text-center text-lg">{t.useCase}</p>
        </div>
        <div className="space-y-4">
          <LangSelect id="host-lang" label={t.iSpeak} value={host} onChange={setHost} />
          <LangSelect id="guest-lang" label={t.theySpeak} value={guest} onChange={setGuest} />
          {ok && !pairHasLiveVoice(ok) && (
            <p className="text-base text-muted-foreground">{t.voiceNote}</p>
          )}
          {!ok && (
            <p role="alert" className="text-base font-medium text-destructive">
              {t.sameLang}
            </p>
          )}
          {invitationAllowed ? <button
            disabled={!ok}
            onClick={() => ok && nav({ to: "/host", search: { h: host, g: guest } })}
            className="tap w-full rounded-full bg-primary py-5 text-2xl font-semibold text-primary-foreground disabled:opacity-40"
          >
            {t.start}
          </button> : <PublishedInvitationNotice />}
        </div>
      </div>
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-base">
        <Link to="/demo" className="tap inline-flex items-center underline">
          {t.watchDemo}
        </Link>
        <Link to="/duo" className="tap inline-flex items-center underline">
          {t.duo}
        </Link>
        <Link to="/setup" className="tap inline-flex items-center underline">
          {t.hostSetup}
        </Link>
        <Link to="/check" className="tap inline-flex items-center underline">
          {t.check}
        </Link>
      </nav>
    </main>
  );
}
