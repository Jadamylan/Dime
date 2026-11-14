// Dime demo offline cache. Only caches URLs explicitly sent by the /demo page.
// Never caches API responses, room URLs, keys or conversations.
const CACHE = "dime-demo-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith("dime-demo-")) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "cache-demo") return;
  const port = e.ports[0];
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      const urls = e.data.urls.filter((u) => new URL(u, self.location.origin).origin === self.location.origin);
      let n = 0;
      for (const u of urls) {
        const res = await fetch(u, { cache: "reload", credentials: "same-origin" });
        if (!res.ok) throw new Error("fetch " + res.status);
        await cache.put(u, res);
        n++;
      }
      port.postMessage({ ok: true, n });
    } catch (err) {
      port.postMessage({ ok: false, error: String(err) });
    }
  })());
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    if (url.pathname !== "/demo") return;
    e.respondWith(fetch(req).catch(async () => (await caches.match("/demo")) || Response.error()));
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: false });
    return hit || fetch(req);
  })());
});
