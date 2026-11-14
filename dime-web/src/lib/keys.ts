/** Host API keys: in memory by default; localStorage only when the user opts in. */
type Keys = { translate: string; gemini: string };
const STORE = "dime.keys.v1";
let mem: Keys = { translate: "", gemini: "" };
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORE);
    if (raw) {
      const p = JSON.parse(raw);
      mem = { translate: String(p.translate || ""), gemini: String(p.gemini || "") };
    }
  } catch {
    /* storage blocked: memory only */
  }
}
export function getKeys(): Keys {
  load();
  return mem;
}
export function isRemembered(): boolean {
  try {
    return !!window.localStorage.getItem(STORE);
  } catch {
    return false;
  }
}
/** Returns false if persistence was requested but storage is blocked. */
export function setKeys(k: Keys, remember: boolean): boolean {
  load();
  mem = { translate: k.translate.trim(), gemini: k.gemini.trim() };
  let ok = true;
  try {
    if (remember) window.localStorage.setItem(STORE, JSON.stringify(mem));
    else window.localStorage.removeItem(STORE);
  } catch {
    ok = !remember;
  }
  subs.forEach((f) => f());
  return ok;
}
export function clearKeys() {
  mem = { translate: "", gemini: "" };
  try {
    window.localStorage.removeItem(STORE);
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
}
export function onKeys(f: () => void) {
  subs.add(f);
  return () => subs.delete(f);
}
