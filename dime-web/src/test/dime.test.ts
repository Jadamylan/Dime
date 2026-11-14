import { describe, expect, it, vi } from "vitest";
import { validPair, fill, ui } from "@/config/languages";
import { parseJoinHash, MAX_TEXT, RATE_PER_MIN, ROOM_TTL_MS } from "@/lib/room";
import { translateText } from "@/lib/translate";
import { randomId } from "@/lib/ids";
import { buildSetup } from "@/lib/live";
import { DEMO_TOTAL_MS, demoAt } from "@/lib/demoScript";

describe("languages", () => {
  it("rejects same language and unknown codes", () => {
    expect(validPair("es", "es")).toBeNull();
    expect(validPair("es", "xx")).toBeNull();
    expect(validPair("es", "en")).toEqual({ host: "es", guest: "en" });
  });
  it("localizes the invitation slots", () => {
    expect(fill(ui("en").inviteBody, "en", { host: "es", guest: "en" })).toBe(
      "I speak Spanish. Scan to talk with me in English.",
    );
    expect(fill(ui("es").inviteBody, "es", { host: "en", guest: "es" })).toBe(
      "Hablo inglés. Escanea para hablar conmigo en español.",
    );
  });
});

describe("room rules", () => {
  it("limits", () => {
    expect(MAX_TEXT).toBe(500);
    expect(RATE_PER_MIN).toBe(20);
    expect(ROOM_TTL_MS).toBe(30 * 60 * 1000);
  });
  it("ids carry 128 bits", () => {
    expect(randomId(16)).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });
  it("rejects tampered join links", () => {
    const r = "dime-" + randomId(),
      t = randomId();
    expect(parseJoinHash(`#r=${r}&t=${t}&h=es&g=en`)).not.toBeNull();
    expect(parseJoinHash(`#r=${r}&t=${t}&h=es&g=es`)).toBeNull();
    expect(parseJoinHash(`#r=${r}&t=short&h=es&g=en`)).toBeNull();
    expect(parseJoinHash(`#r=${r}&t=${t}&h=es&g=zz`)).toBeNull();
  });
});

describe("translate", () => {
  it("posts with header key and decodes entities", async () => {
    const f = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: { translations: [{ translatedText: "85 d&oacute;lares &lt;b&gt;" }] },
          }),
        ),
    );
    const out = await translateText("hi", "en", "es", "K", {
      fetchImpl: f as unknown as typeof fetch,
    });
    expect(out).toBe("85 dólares <b>");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://translation.googleapis.com/language/translate/v2");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("K");
    expect(JSON.parse(init.body as string)).toEqual({
      q: "hi",
      source: "en",
      target: "es",
      format: "text",
    });
  });
  it("fails on provider errors", async () => {
    const f = vi.fn(async () => new Response("no", { status: 403 }));
    await expect(
      translateText("hi", "en", "es", "K", { fetchImpl: f as unknown as typeof fetch }),
    ).rejects.toThrow();
  });
});

describe("live setup", () => {
  it("uses the live translate model with translationConfig in generationConfig", () => {
    const s = buildSetup("es").setup;
    expect(s.model).toBe("models/gemini-3.5-live-translate-preview");
    expect(s.generationConfig.translationConfig).toEqual({
      targetLanguageCode: "es",
      echoTargetLanguage: false,
    });
  });
});

describe("demo", () => {
  it("runs under 60 seconds and ends with all four lines", () => {
    expect(DEMO_TOTAL_MS).toBeLessThan(60000);
    expect(demoAt(DEMO_TOTAL_MS).messages.filter((m) => m.final)).toHaveLength(4);
  });
});
