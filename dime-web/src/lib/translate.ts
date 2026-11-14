export class TranslateError extends Error {
  constructor(
    public code: "nokey" | "auth" | "quota" | "timeout" | "network" | "bad",
    msg: string,
  ) {
    super(msg);
  }
}

export function decodeEntities(s: string): string {
  if (!/[&]/.test(s)) return s;
  if (typeof DOMParser === "undefined") return s;
  const doc = new DOMParser().parseFromString(
    `<!doctype html><body>${s.replace(/</g, "&lt;")}`,
    "text/html",
  );
  return doc.body.textContent ?? s;
}

export async function translateText(
  text: string,
  source: string,
  target: string,
  key: string,
  opts: { timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<string> {
  if (!key) throw new TranslateError("nokey", "No translation key");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 10000);
  let res: Response;
  try {
    res = await (opts.fetchImpl ?? fetch)(
      "https://translation.googleapis.com/language/translate/v2",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ q: text, source, target, format: "text" }),
        signal: ctrl.signal,
        referrerPolicy: "no-referrer",
      },
    );
  } catch (e) {
    throw new TranslateError(
      (e as Error).name === "AbortError" ? "timeout" : "network",
      "Translation request failed",
    );
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401 || res.status === 403)
    throw new TranslateError("auth", `Key rejected (${res.status})`);
  if (res.status === 429) throw new TranslateError("quota", "Quota exceeded");
  if (!res.ok) throw new TranslateError("bad", `Provider error (${res.status})`);
  const j = await res.json().catch(() => null);
  const out = j?.data?.translations?.[0]?.translatedText;
  if (typeof out !== "string") throw new TranslateError("bad", "Unexpected response");
  return decodeEntities(out);
}
