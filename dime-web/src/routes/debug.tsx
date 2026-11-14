import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useRoom } from "@/lib/useRoom";

export const Route = createFileRoute("/debug")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Diagnostics — Dime" },
      { name: "description", content: "Safe connection and mode diagnostics for Dime." },
      { property: "og:title", content: "Diagnostics — Dime" },
      { property: "og:description", content: "Safe connection and mode diagnostics for Dime." },
    ],
  }),
  component: Debug,
});

function Debug() {
  const r = useRoom();
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, []);
  const rows: [string, string][] = [
    ["Role", r.role ?? "none"],
    ["Phase", r.phase],
    ["Error", r.error ?? "—"],
    ["Signaling", r.signaling],
    ["Join stage", r.stage],
    ["ICE state", r.diag.ice],
    ["Last OK step", r.diag.lastOk],
    ["Last error", r.diag.lastError],
    ["Pair", r.pair ? `${r.pair.host} → ${r.pair.guest}` : "—"],
    ["Typed ready", String(r.typedReady)],
    ["Live ready", String(r.liveReady)],
    ["Messages", String(r.messages.length)],
    ["Turn", r.turn ? `${r.turn.speaker} · ${r.turn.state}` : "—"],
    ["Turn elapsed", r.turn && now ? `${((now - r.turn.startedAt) / 1000).toFixed(1)} s` : "—"],
    ["First caption", r.turn?.firstCaptionMs != null ? `${r.turn.firstCaptionMs} ms` : "—"],
    [
      "Room expires in",
      r.expiresAt && now ? `${Math.max(0, Math.round((r.expiresAt - now) / 60000))} min` : "—",
    ],
  ];
  return (
    <main className="safe-pad mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-bold">Diagnostics</h1>
      <p className="text-sm text-muted-foreground">
        Shows this tab's state only. No keys, raw data or transcripts. Open in the same tab as a
        conversation (it stays open only while hosting navigates here via setup).
      </p>
      <dl className="divide-y rounded-3xl bg-card">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3">
            <dt className="font-medium">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <section className="rounded-3xl bg-card p-4">
        <h2 className="mb-2 font-semibold">Handshake log</h2>
        <ol className="space-y-1 font-mono text-xs">
          {r.diag.events.length ? r.diag.events.map((e, i) => <li key={i}>{e}</li>) : <li>—</li>}
        </ol>
      </section>
      <Link to="/check" className="tap inline-flex items-center underline">
        Preflight check
      </Link>
    </main>
  );
}
