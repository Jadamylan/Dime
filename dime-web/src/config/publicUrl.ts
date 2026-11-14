/** Public links never inherit a preview origin, query string, or share receipt. */
export const PUBLIC_URL = "https://dimeapp.lovable.app";

export function canCreateInvitation(hostname: string) {
  return hostname.toLowerCase() === new URL(PUBLIC_URL).hostname;
}

/** Final safeguard shared by QR rendering and Copy link, including the demo. */
export function isPublicInvitationUrl(value: string, demo = false) {
  try {
    const url = new URL(value);
    if (url.origin !== PUBLIC_URL || url.username || url.password || url.hash) return false;
    if (demo) return url.pathname === "/demo" && !url.search;
    if (url.pathname !== "/join") return false;
    const allowed = ["r", "token", "h", "g"];
    return [...url.searchParams.keys()].every((key) => allowed.includes(key)) &&
      allowed.every((key) => url.searchParams.getAll(key).length === 1 && !!url.searchParams.get(key));
  } catch {
    return false;
  }
}

export function buildGuestUrl(info: {
  roomId: string;
  token: string;
  pair: { host: string; guest: string };
}) {
  const url = new URL("/join", PUBLIC_URL);
  url.search = new URLSearchParams({
    r: info.roomId,
    token: info.token,
    h: info.pair.host,
    g: info.pair.guest,
  }).toString();
  return url.href;
}