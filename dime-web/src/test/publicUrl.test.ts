import { describe, expect, it } from "vitest";
import { buildGuestUrl, canCreateInvitation, isPublicInvitationUrl } from "@/config/publicUrl";
import { parseJoinHash } from "@/lib/room";

describe("public invitations", () => {
  const roomId = "dime-abcdefghijklmnopqrstuv";
  const token = "abcdefghijklmnopqrstuv";
  const info = { roomId, token, pair: { host: "es", guest: "en" } };
  it("encodes the exact canonical query invitation", () => {
    expect(buildGuestUrl(info)).toBe(`https://dimeapp.lovable.app/join?r=${roomId}&token=${token}&h=es&g=en`);
  });
  it("does not inherit a share receipt or preview URL", () => {
    const url = new URL(buildGuestUrl(info));
    expect(url.hostname).toBe("dimeapp.lovable.app");
    expect(url.searchParams.has("__lovable_receipt")).toBe(false);
    expect(url.hash).toBe("");
  });
  it("blocks preview invitation creation", () => {
    expect(canCreateInvitation("preview--dimeapp.lovable.app")).toBe(false);
    expect(canCreateInvitation("id-preview--anything.lovable.app")).toBe(false);
    expect(canCreateInvitation("lovable.dev")).toBe(false);
    expect(canCreateInvitation("dimeapp.lovable.app")).toBe(true);
  });
  it("reads a canonical invitation and preserves languages and token", () => {
    expect(parseJoinHash(new URL(buildGuestUrl(info)).search)).toEqual(info);
  });
  it("rejects nonpublic addresses at the QR and copy boundary", () => {
    expect(isPublicInvitationUrl(buildGuestUrl(info))).toBe(true);
    for (const origin of ["https://preview--dimeapp.lovable.app", "https://lovable.dev", "https://accounts.google.com", "https://dimeapp.lovable.app.evil.example"]) {
      expect(isPublicInvitationUrl(buildGuestUrl(info).replace("https://dimeapp.lovable.app", origin))).toBe(false);
    }
  });
  it("rejects receipt tokens and extra invitation parameters", () => {
    expect(isPublicInvitationUrl(`${buildGuestUrl(info)}&__lovable_receipt=test`)).toBe(false);
    expect(isPublicInvitationUrl(`${buildGuestUrl(info)}&token=duplicate`)).toBe(false);
    expect(isPublicInvitationUrl(`${buildGuestUrl(info)}#receipt`)).toBe(false);
  });
  it("only allows the public demo address for demo QR codes", () => {
    expect(isPublicInvitationUrl("https://dimeapp.lovable.app/demo", true)).toBe(true);
    expect(isPublicInvitationUrl("https://preview--dimeapp.lovable.app/demo", true)).toBe(false);
    expect(isPublicInvitationUrl("https://dimeapp.lovable.app/demo?__lovable_receipt=test", true)).toBe(false);
  });
});