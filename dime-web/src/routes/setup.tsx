import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { clearKeys, getKeys, isRemembered, setKeys } from "@/lib/keys";
import { hasActiveHost, roomStore } from "@/lib/room";
import { nav as navFlags } from "@/lib/useRoom";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Host setup — Dime" },
      {
        name: "description",
        content: "Enter your own restricted Google test keys on the host phone.",
      },
      { property: "og:title", content: "Host setup — Dime" },
      {
        property: "og:description",
        content: "Enter your own restricted Google test keys on the host phone.",
      },
    ],
  }),
  component: Setup,
});

function Setup() {
  const [tr, setTr] = useState("");
  const [gm, setGm] = useState("");
  const [remember, setRemember] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const k = getKeys();
    setTr(k.translate);
    setGm(k.gemini);
    setRemember(isRemembered());
    setActive(hasActiveHost());
  }, []);
  const back = () => {
    if (active) {
      const p = roomStore.get().pair!;
      navFlags.keepHostAlive = false;
      void navigate({ to: "/host", search: { h: p.host, g: p.guest } });
    }
  };
  return (
    <main className="safe-pad mx-auto flex min-h-dvh max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold">Host setup</h1>
      <p className="text-base text-muted-foreground">
        Keys stay on this phone and go only to Google. Use a dedicated, restricted test key with a
        small quota. Typed text and live audio are sent to Google — use sample conversation data.
      </p>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const ok = setKeys({ translate: tr, gemini: gm }, remember);
          setMsg(
            ok
              ? "Saved." +
                  (remember ? " Remembered on this device." : " Kept in memory for this tab.")
              : "Saved in memory. This browser blocks storage, so keys will not be remembered.",
          );
        }}
      >
        <label className="block">
          <span className="mb-1 block text-base font-medium">
            Google Cloud Translation (Basic v2) key
          </span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={tr}
            onChange={(e) => setTr(e.target.value)}
            className="tap w-full rounded-2xl bg-card px-4 text-lg"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-base font-medium">Gemini API key (live captions)</span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={gm}
            onChange={(e) => setGm(e.target.value)}
            className="tap w-full rounded-2xl bg-card px-4 text-lg"
          />
        </label>
        <label className="flex items-center gap-3 text-base">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-6"
          />
          Remember on this device
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="tap rounded-full bg-primary px-6 text-lg font-semibold text-primary-foreground"
          >
            Save keys
          </button>
          <button
            type="button"
            onClick={() => {
              clearKeys();
              setTr("");
              setGm("");
              setRemember(false);
              setMsg("Keys cleared.");
            }}
            className="tap rounded-full bg-card px-6 text-lg"
          >
            Clear keys
          </button>
        </div>
        {msg && (
          <p role="status" className="text-base">
            {msg}
          </p>
        )}
      </form>
      {active ? (
        <button
          onClick={back}
          className="tap w-full rounded-full bg-foreground py-4 text-lg font-semibold text-background"
        >
          Return to conversation
        </button>
      ) : (
        <div className="flex gap-4">
          <Link to="/" className="tap inline-flex items-center underline">
            Home
          </Link>
          <Link to="/check" className="tap inline-flex items-center underline">
            Preflight check
          </Link>
        </div>
      )}
    </main>
  );
}
