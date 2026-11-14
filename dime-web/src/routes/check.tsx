import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LANGUAGES } from "@/config/languages";
import { getKeys } from "@/lib/keys";
import { translateText } from "@/lib/translate";
import { LiveSession } from "@/lib/live";
import { startMic } from "@/lib/audio";
import { testSignaling } from "@/lib/room";
import { DEMO_TOTAL_MS, demoAt } from "@/lib/demoScript";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Preflight check — Dime" },
      {
        name: "description",
        content:
          "Check the demo, typed translation, live captions, connection and microphone before a session.",
      },
      { property: "og:title", content: "Preflight check — Dime" },
      {
        property: "og:description",
        content: "Check the demo, typed translation, live captions, connection and microphone.",
      },
    ],
  }),
  component: Check,
});

type R = { s: "pass" | "fail" | "untested" | "running"; note: string };
const U: R = { s: "untested", note: "" };

function Badge({ name, r, next }: { name: string; r: R; next: string }) {
  const cls =
    r.s === "pass"
      ? "bg-primary text-primary-foreground"
      : r.s === "fail"
        ? "bg-clarify text-clarify-foreground"
        : "bg-card";
  const label =
    r.s === "pass"
      ? "Passed"
      : r.s === "fail"
        ? "Failed"
        : r.s === "running"
          ? "Running…"
          : "Not tested";
  return (
    <li className="rounded-3xl bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg font-semibold">{name}</span>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${cls}`}>{label}</span>
      </div>
      {r.note && <p className="mt-1 text-base">{r.note}</p>}
      {r.s !== "pass" && <p className="mt-1 text-sm text-muted-foreground">Next: {next}</p>}
    </li>
  );
}

function Check() {
  const [demo, setDemo] = useState<R>(U);
  const [config, setConfig] = useState<R>(U);
  const [typed, setTyped] = useState<R>(U);
  const [liveSetup, setLiveSetup] = useState<R>(U);
  const [live, setLive] = useState<R>(U);
  const [peer, setPeer] = useState<R>(U);
  const [mic, setMic] = useState<R>(U);

  const runDemo = () => {
    try {
      let steps = new Set<number>();
      for (let t = 0; t <= DEMO_TOTAL_MS; t += 250) steps.add(demoAt(t).step);
      const last = demoAt(DEMO_TOTAL_MS);
      if (steps.size === 6 && last.messages.length === 4 && last.messages.every((m) => m.final))
        setDemo({
          s: "pass",
          note: `All 6 steps play in ${(DEMO_TOTAL_MS / 1000).toFixed(0)} s with no provider calls.`,
        });
      else setDemo({ s: "fail", note: "Script incomplete." });
      steps = new Set();
    } catch {
      setDemo({ s: "fail", note: "Script error." });
    }
  };
  const runConfig = () => {
    const keys = Object.keys(LANGUAGES.en.ui);
    const ok =
      keys.every((k) => (LANGUAGES.es.ui as unknown as Record<string, string>)[k]) &&
      LANGUAGES.en.locale === "en-US" &&
      LANGUAGES.es.locale === "es-ES";
    setConfig(
      ok
        ? { s: "pass", note: "English and Spanish strings complete." }
        : { s: "fail", note: "Missing strings." },
    );
  };
  const runTyped = async () => {
    const k = getKeys().translate;
    if (!k) return setTyped({ s: "untested", note: "No Translation key on this device." });
    setTyped({ s: "running", note: "" });
    try {
      const out = await translateText("Sunday at two is available for $85", "en", "es", k);
      setTyped({ s: "pass", note: `“${out}”` });
    } catch (e) {
      setTyped({ s: "fail", note: (e as Error).message });
    }
  };
  const runLiveSetup = () =>
    new Promise<void>((resolve) => {
      const k = getKeys().gemini;
      if (!k) {
        setLiveSetup({ s: "untested", note: "No Gemini key on this device." });
        return resolve();
      }
      setLiveSetup({ s: "running", note: "" });
      const s = new LiveSession(k, "es", {
        onReady: () => {
          s.close();
          setLiveSetup({
            s: "pass",
            note: "Model setup acknowledged. Not yet live-ready — run Test live mic.",
          });
          resolve();
        },
        onText: () => {},
        onTurnComplete: () => {},
        onFail: (r) => {
          setLiveSetup({ s: "fail", note: `Live setup failed: ${r}` });
          resolve();
        },
      });
      s.open();
    });
  const runPeer = async () => {
    setPeer({ s: "running", note: "" });
    const ok = await testSignaling();
    setPeer(
      ok
        ? {
            s: "pass",
            note: "Signaling works. Phone-to-phone (ICE) still needs the two-device check.",
          }
        : { s: "fail", note: "Could not reach PeerJS signaling." },
    );
  };
  const runAll = async () => {
    runDemo();
    runConfig();
    await Promise.all([runTyped(), runLiveSetup(), runPeer()]);
  };

  const testMic = async () => {
    setMic({ s: "running", note: "Speak now for 3 seconds…" });
    try {
      const h = await startMic(() => {});
      let peak = 0;
      const i = setInterval(() => {
        peak = Math.max(peak, h.level());
      }, 50);
      await new Promise((r) => setTimeout(r, 3000));
      clearInterval(i);
      h.stop();
      setMic(
        peak > 0.02
          ? {
              s: "pass",
              note: `Permission granted, signal detected (peak ${(peak * 100).toFixed(0)}%). Tracks released.`,
            }
          : { s: "fail", note: "Permission granted but no signal detected." },
      );
    } catch (e) {
      setMic({
        s: "fail",
        note:
          (e as Error).message === "denied" ? "Permission denied." : "Mic unsupported or failed.",
      });
    }
  };
  const testLive = async () => {
    const k = getKeys().gemini;
    if (!k) return setLive({ s: "untested", note: "No Gemini key on this device." });
    setLive({ s: "running", note: "Say in English: “Sunday at two is available for $85.” (6 s)" });
    let translated = "";
    const s = new LiveSession(k, "es", {
      onReady: () => {},
      onTurnComplete: () => {},
      onText: (u) => {
        translated = u.translated;
      },
      onFail: (r) => setLive({ s: "fail", note: `Live failed: ${r}` }),
    });
    s.open();
    try {
      const h = await startMic((pcm) => s.send(pcm));
      await new Promise((r) => setTimeout(r, 6000));
      h.stop();
      s.endAudio();
      await new Promise((r) => setTimeout(r, 3000));
      s.close();
      setLive(
        translated
          ? { s: "pass", note: `Translated: “${translated}”` }
          : { s: "fail", note: "No translated text received." },
      );
    } catch {
      s.close();
      setLive({ s: "fail", note: "Microphone unavailable." });
    }
  };

  return (
    <main className="safe-pad mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-bold">Preflight check</h1>
      <button
        onClick={runAll}
        className="tap w-full rounded-full bg-primary py-4 text-xl font-semibold text-primary-foreground"
      >
        Run all
      </button>
      <ul className="space-y-3">
        <Badge name="Demo" r={demo} next="Open /demo and press Play." />
        <Badge name="Language config" r={config} next="Fix languages config." />
        <Badge name="Typed translation" r={typed} next="Add a Translation key in Host setup." />
        <Badge
          name="Live setup"
          r={liveSetup}
          next="Add a Gemini key with Live Translate access."
        />
        <Badge
          name="Live captions"
          r={live}
          next="Tap Test live mic and speak the sample phrase."
        />
        <Badge name="Connection service" r={peer} next="Check internet; then try two phones." />
        <Badge name="Microphone" r={mic} next="Tap Test mic and allow access." />
      </ul>
      <div className="flex flex-wrap gap-2">
        <button onClick={testMic} className="tap rounded-full bg-card px-5 text-lg">
          Test mic
        </button>
        <button onClick={testLive} className="tap rounded-full bg-card px-5 text-lg">
          Test live mic
        </button>
      </div>
      <section className="rounded-3xl bg-card p-4 text-base">
        <h2 className="font-semibold">Two-device check</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>On phone A, open the published app, add keys in Host setup, tap Start.</li>
          <li>On phone B, scan the QR with the camera and tap Join.</li>
          <li>Type in both directions; then hold to talk on each phone.</li>
          <li>
            If it can't connect, put both phones on the same hotspot. Otherwise use the scripted
            demo.
          </li>
        </ol>
      </section>
      <div className="flex gap-4">
        <Link to="/" className="tap inline-flex items-center underline">
          Home
        </Link>
        <Link to="/setup" className="tap inline-flex items-center underline">
          Host setup
        </Link>
        <Link to="/debug" className="tap inline-flex items-center underline">
          Diagnostics
        </Link>
      </div>
    </main>
  );
}
