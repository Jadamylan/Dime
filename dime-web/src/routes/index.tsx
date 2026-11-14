import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DEFAULT_GUEST, DEFAULT_HOST, ui, validPair, type LangCode } from "@/config/languages";
import { Wordmark } from "@/components/dime/Wordmark";
import { LangSelect } from "@/components/dime/LangSelect";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dime — Tell me in your language" },
      {
        name: "description",
        content: "Two phones, one QR code, translated conversation in English and Spanish.",
      },
      { property: "og:title", content: "Dime — Tell me in your language" },
      {
        property: "og:description",
        content: "Two phones, one QR code, translated conversation in English and Spanish.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [host, setHost] = useState<LangCode>(DEFAULT_HOST);
  const [guest, setGuest] = useState<LangCode>(DEFAULT_GUEST);
  const nav = useNavigate();
  const t = ui(host);
  const ok = validPair(host, guest);
  return (
    <main className="safe-pad mx-auto flex min-h-dvh max-w-md flex-col justify-between gap-8">
      <div className="flex flex-1 flex-col justify-center gap-10">
        <Wordmark lang={host} />
        <div className="space-y-4">
          <LangSelect id="host-lang" label={t.iSpeak} value={host} onChange={setHost} />
          <LangSelect id="guest-lang" label={t.theySpeak} value={guest} onChange={setGuest} />
          {!ok && (
            <p role="alert" className="text-base font-medium text-destructive">
              {t.sameLang}
            </p>
          )}
          <button
            disabled={!ok}
            onClick={() => ok && nav({ to: "/host", search: { h: host, g: guest } })}
            className="tap w-full rounded-full bg-primary py-5 text-2xl font-semibold text-primary-foreground disabled:opacity-40"
          >
            {t.start}
          </button>
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
