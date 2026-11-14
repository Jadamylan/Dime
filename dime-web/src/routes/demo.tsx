import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Check } from "lucide-react";
import { Conversation } from "@/components/dime/Conversation";
import { Invite } from "@/components/dime/Invite";
import { Wordmark } from "@/components/dime/Wordmark";
import { ui } from "@/config/languages";
import { DEMO_TOTAL_MS, demoAt, type DemoFrame } from "@/lib/demoScript";
import { PUBLIC_URL } from "@/config/publicUrl";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Scripted demo — Dime" },
      {
        name: "description",
        content:
          "A scripted, offline-capable stage demo of Dime: a Spanish speaker books a salon appointment with an English speaker.",
      },
      { property: "og:title", content: "Scripted demo — Dime" },
      {
        property: "og:description",
        content:
          "A scripted stage demo of Dime booking a salon appointment across English and Spanish.",
      },
    ],
  }),
  component: Demo,
});

/**
 * The demo QR always opens the canonical public demo, never a preview address.
 */
function useDemoUrl() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(`${PUBLIC_URL}/demo`);
  }, []);
  return url;
}

function Phone({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section aria-label={label} className="flex w-full max-w-[380px] flex-col gap-2">
      <div className="text-center text-sm font-semibold uppercase tracking-wide">{label}</div>
      <div className="flex h-[560px] max-h-[70dvh] flex-col overflow-hidden rounded-[2.5rem] border-[6px] border-foreground bg-background p-4 sm:h-[680px]">
        {children}
      </div>
    </section>
  );
}

function Side({ f, role }: { f: DemoFrame; role: "host" | "guest" }) {
  const demoUrl = useDemoUrl();
  const my = role === "host" ? "es" : "en";
  const other = role === "host" ? "en" : "es";
  if (f.stage === "outro")
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center" lang={my}>
        <Wordmark lang={my} size="sm" />
        <div className="rounded-3xl bg-primary px-6 py-5 text-primary-foreground">
          <p className="text-base font-medium">
            {my === "es" ? "Cita confirmada" : "Appointment confirmed"}
          </p>
          <p className="text-2xl font-bold">
            {my === "es" ? "Domingo · 2:00 p. m. · $85" : "Sunday · 2 p.m. · $85"}
          </p>
        </div>
      </div>
    );
  if (f.stage !== "talk") {
    if (role === "host")
      return f.stage === "joined" ? (
        <Conversation
          demo
          compact
          myRole="host"
          myLang="es"
          otherLang="en"
          messages={[]}
          turn={null}
          typedReady
          liveReady
          notice={ui("es").joined}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Invite demo pair={{ host: "es", guest: "en" }} url={demoUrl} />
        </div>
      );
    const t = ui("en");
    if (f.stage === "invite")
      return (
        <div className="flex flex-1 items-center justify-center text-center text-lg text-muted-foreground">
          Scanning the host's QR…
        </div>
      );
    if (f.stage === "joined")
      return (
        <Conversation
          demo
          compact
          myRole="guest"
          myLang="en"
          otherLang="es"
          messages={[]}
          turn={null}
          typedReady
          liveReady
          notice={t.joined}
        />
      );
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h2 className="text-3xl font-bold">{t.joinTitle}</h2>
        <div
          className={`w-full rounded-full py-4 text-xl font-semibold ${f.stage === "joinTap" ? "bg-foreground text-background" : "bg-primary text-primary-foreground"}`}
        >
          {t.join}
        </div>
      </div>
    );
  }
  return (
    <Conversation
      demo
      compact
      myRole={role}
      myLang={my}
      otherLang={other}
      messages={f.messages}
      turn={f.turn}
      typedReady
      liveReady
    />
  );
}

function Demo() {
  const [ms, setMs] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [offline, setOffline] = useState<"idle" | "saving" | "ready" | "failed">("idle");
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (last.current != null)
        setMs((m) => Math.min(DEMO_TOTAL_MS, m + (now - last.current!) * speed));
      last.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);
  useEffect(() => {
    if (ms >= DEMO_TOTAL_MS) setPlaying(false);
  }, [ms]);

  const f = demoAt(ms);

  const saveOffline = async () => {
    setOffline("saving");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sw = reg.active ?? navigator.serviceWorker.controller;
      if (!sw) throw new Error("no sw");
      const urls = new Set<string>(["/demo", "/pcm-worklet.js"]);
      for (const e of performance.getEntriesByType("resource")) {
        const u = new URL(e.name);
        if (
          u.origin === location.origin &&
          !u.pathname.startsWith("/@") &&
          !u.pathname.includes("/api/")
        )
          urls.add(u.pathname + u.search);
      }
      document
        .querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
          "script[src],link[rel=stylesheet],link[rel=modulepreload]",
        )
        .forEach((el) => {
          const src = (el as HTMLScriptElement).src || (el as HTMLLinkElement).href;
          const u = new URL(src, location.href);
          if (u.origin === location.origin) urls.add(u.pathname + u.search);
        });
      const res = await new Promise<{ ok: boolean }>((resolve) => {
        const ch = new MessageChannel();
        ch.port1.onmessage = (ev) => resolve(ev.data);
        sw.postMessage({ type: "cache-demo", urls: [...urls] }, [ch.port2]);
        setTimeout(() => resolve({ ok: false }), 30000);
      });
      if (!res.ok) throw new Error("cache");
      // Verify every URL is actually in the cache.
      const cache = await caches.open("dime-demo-v1");
      for (const u of urls) if (!(await cache.match(u))) throw new Error("missing");
      setOffline("ready");
    } catch {
      setOffline("failed");
    }
  };

  return (
    <main className="safe-pad mx-auto flex min-h-dvh max-w-5xl flex-col gap-4 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="rounded-full bg-clarify px-4 py-2 text-base font-bold text-clarify-foreground"
          role="status"
        >
          Demo: scripted
        </span>
        <span className="text-sm text-muted-foreground">Step {f.step} / 6</span>
      </div>
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-center">
        <Phone label="Host phone · Español">
          <Side f={f} role="host" />
        </Phone>
        <Phone label="Guest phone · English">
          <Side f={f} role="guest" />
        </Phone>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => {
            if (ms >= DEMO_TOTAL_MS) setMs(0);
            setPlaying((p) => !p);
          }}
          className="tap flex items-center gap-1 rounded-full bg-primary px-5 text-lg font-semibold text-primary-foreground"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="size-5" aria-hidden />
          ) : (
            <Play className="size-5" aria-hidden />
          )}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => {
            setMs(0);
            setPlaying(true);
          }}
          className="tap flex items-center gap-1 rounded-full bg-card px-5 text-lg"
        >
          <RotateCcw className="size-5" aria-hidden />
          Restart
        </button>
        <div role="group" aria-label="Speed" className="flex gap-1">
          {[0.75, 1, 1.5].map((s) => (
            <button
              key={s}
              aria-pressed={speed === s}
              onClick={() => setSpeed(s)}
              className={`tap rounded-full px-4 text-base font-medium ${speed === s ? "bg-foreground text-background" : "bg-card"}`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      {f.stage === "outro" && (
        <p className="text-center">
          <Link to="/duo" className="tap inline-flex items-center text-lg underline">
            See the Duo concept
          </Link>
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t pt-4 text-base">
        <Link
          to="/"
          className="tap inline-flex items-center rounded-full bg-foreground px-5 font-semibold text-background"
        >
          Try Dime
        </Link>
        <button
          onClick={saveOffline}
          disabled={offline === "saving"}
          className="tap flex items-center gap-1 rounded-full bg-card px-5"
        >
          {offline === "ready" && <Check className="size-5" aria-hidden />}
          {offline === "idle"
            ? "Save demo offline"
            : offline === "saving"
              ? "Saving…"
              : offline === "ready"
                ? "Ready offline"
                : "Offline save failed — retry"}
        </button>
        <Link to="/duo" className="tap inline-flex items-center underline">
          Duo concept
        </Link>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Try Dime creates a real invite; hosting needs your own keys. The Demo QR does not join
        anything.
      </p>
    </main>
  );
}
