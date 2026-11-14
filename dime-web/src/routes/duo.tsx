import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Wordmark } from "@/components/dime/Wordmark";

export const Route = createFileRoute("/duo")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Duo concept — Dime" },
      {
        name: "description",
        content: "Dime Duo: a foldable on the table with an English side and a Spanish side.",
      },
      { property: "og:title", content: "Duo concept — Dime" },
      {
        property: "og:description",
        content: "Dime Duo: a foldable on the table with an English side and a Spanish side.",
      },
    ],
  }),
  component: Duo,
});

type Pose = "closed" | "book" | "open";

function Table({ pose }: { pose: Pose }) {
  // Simple line illustration: two people facing a foldable on a table.
  return (
    <svg
      viewBox="0 0 360 200"
      className="w-full max-w-md text-foreground"
      role="img"
      aria-label={`Two people at a table facing a foldable phone, ${pose} pose`}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="20" y1="160" x2="340" y2="160" />
        <circle cx="45" cy="70" r="18" />
        <path d="M20 160 C20 115 70 105 75 130 L95 150" />
        <circle cx="315" cy="70" r="18" />
        <path d="M340 160 C340 115 290 105 285 130 L265 150" />
        {pose === "closed" && <rect x="160" y="148" width="40" height="10" rx="3" />}
        {pose === "book" && (
          <>
            <path d="M180 158 L150 112" />
            <path d="M180 158 L210 112" />
            <line x1="150" y1="112" x2="146" y2="118" />
          </>
        )}
        {pose === "open" && <rect x="130" y="150" width="100" height="8" rx="3" />}
      </g>
      <text x="45" y="190" textAnchor="middle" className="fill-current text-[13px]">
        English
      </text>
      <text x="315" y="190" textAnchor="middle" className="fill-current text-[13px]">
        Español
      </text>
    </svg>
  );
}

function Panel({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    <div lang={lang} className="flex-1 rounded-3xl bg-card p-5">
      {children}
    </div>
  );
}

function Duo() {
  const [pose, setPose] = useState<Pose>("book");
  return (
    <main className="safe-pad mx-auto flex min-h-dvh max-w-4xl flex-col items-center gap-6">
      <span className="rounded-full bg-clarify px-4 py-2 font-bold text-clarify-foreground">
        Duo concept
      </span>
      <Wordmark />
      <Table pose={pose} />
      <div role="tablist" aria-label="Pose" className="flex flex-wrap justify-center gap-2">
        {(
          [
            ["closed", "Closed"],
            ["book", "Book pose"],
            ["open", "Fully open"],
          ] as [Pose, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={pose === k}
            onClick={() => setPose(k)}
            className={`tap rounded-full px-5 text-lg font-medium ${pose === k ? "bg-primary text-primary-foreground" : "bg-card"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <section role="tabpanel" className="w-full">
        {pose === "closed" && (
          <div className="mx-auto max-w-sm rounded-[2rem] border-4 border-foreground p-6 text-center">
            <p className="text-sm text-muted-foreground">Cover screen · language setup</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl bg-card py-3 text-xl font-semibold">English</div>
              <div className="rounded-2xl bg-card py-3 text-xl font-semibold">Español</div>
              <div className="rounded-full bg-primary py-3 text-xl font-semibold text-primary-foreground">
                Start
              </div>
            </div>
          </div>
        )}
        {pose === "book" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-10">
            <Panel lang="en">
              <p className="text-sm text-muted-foreground">Faces the English speaker</p>
              <p className="mt-3 text-2xl font-semibold">Sunday at two is available for $85.</p>
            </Panel>
            <Panel lang="es">
              <p className="text-sm text-muted-foreground">Mira hacia quien habla español</p>
              <p className="mt-3 text-2xl font-semibold">
                Hay una cita disponible el domingo a las dos por 85 dólares.
              </p>
            </Panel>
          </div>
        )}
        {pose === "open" && (
          <div className="rounded-3xl bg-card p-6">
            <h2 className="text-2xl font-bold">We’re on the same page.</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-12">
              <li lang="en" className="text-lg">
                Sunday, 2 p.m. · $85
              </li>
              <li lang="es" className="text-lg">
                Domingo, 2 de la tarde · 85 dólares
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                lang="en"
                className="tap rounded-full bg-primary px-6 text-lg font-semibold text-primary-foreground"
              >
                I understand
              </button>
              <button
                lang="es"
                className="tap rounded-full bg-primary px-6 text-lg font-semibold text-primary-foreground"
              >
                Entiendo
              </button>
            </div>
          </div>
        )}
      </section>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        A concept for one foldable shared across a table. The working app runs today on two phones
        with a QR code.
      </p>
      <div className="flex gap-4">
        <Link to="/" className="tap inline-flex items-center underline">
          Home
        </Link>
        <Link to="/demo" className="tap inline-flex items-center underline">
          Watch demo
        </Link>
      </div>
    </main>
  );
}
