/** URL-safe random ID from `bytes` random bytes (default 16 = 128 bits). */
export function randomId(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  let s = "";
  for (const b of a) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export const ID_RE = /^[A-Za-z0-9_-]{16,64}$/;
