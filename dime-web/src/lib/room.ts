/**
 * Peer-to-peer room transport (PeerJS + WebRTC). The host owns the room, the translator and
 * the live session; the guest never receives a key. All state is in memory only.
 */
import type { DataConnection, Peer as PeerT } from "peerjs";
import { LANGUAGES, pairHasLiveVoice, type LangCode } from "@/config/languages";
import { randomId, ID_RE } from "./ids";
import { getKeys, onKeys } from "./keys";
import { translateText } from "./translate";
import { LiveSession, type LiveFail } from "./live";
import { startMic, MicError, type MicHandle } from "./audio";
import { buildGuestUrl, canCreateInvitation } from "@/config/publicUrl";

export const PROTOCOL = 1;
export const ROOM_TTL_MS = 30 * 60 * 1000;
export const MAX_TEXT = 500;
export const RATE_PER_MIN = 20;
export const MAX_TURN_MS = 60_000;
export const MAX_FRAME_BYTES = 6400;
const SIGNAL_TIMEOUT_MS = 15_000; // guest peer -> broker
const CHANNEL_TIMEOUT_MS = 25_000; // WebRTC data channel open (ICE, maybe TURN)
const ACK_TIMEOUT_MS = 8_000; // hello -> accepted
const HOST_HELLO_MS = 40_000; // host waits longer than the guest's channel timeout
const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    { urls: "stun:stun.cloudflare.com:3478" },
    // PeerJS public TURN relay (best effort; used when phones cannot reach each other directly)
    { urls: "turn:eu-0.turn.peerjs.com:3478", username: "peerjs", credential: "peerjsp" },
    { urls: "turn:us-0.turn.peerjs.com:3478", username: "peerjs", credential: "peerjsp" },
  ],
  sdpSemantics: "unified-plan",
} as RTCConfiguration;
const FIRST_CAPTION_MS = 12_000;
const DRAIN_MS = 3500;

export type Role = "host" | "guest";
export type ErrCode =
  "channel" | "noack" | "token" | "full" | "expired" | "timeout" | "signal" | "roomgone" | "mic" | "rate" | "toolong";
export type MsgStatus = "pending" | "failed" | "delivered";
export type TurnState = "connecting" | "listening" | "translating" | "final" | "unavailable";

export interface Msg {
  id: string;
  kind: "text" | "voice" | "preset";
  from: Role;
  original: string;
  translated: string;
  status: MsgStatus;
  final: boolean;
  ts: number;
}
export interface Turn {
  id: string;
  speaker: Role;
  state: TurnState;
  startedAt: number;
  firstCaptionMs: number | null;
  reason?: string;
}
export interface RoomState {
  role: Role | null;
  phase: "idle" | "opening" | "waiting" | "connected" | "reconnecting" | "error" | "ended";
  error: ErrCode | null;
  pair: { host: LangCode; guest: LangCode } | null;
  joinUrl: string;
  expiresAt: number;
  messages: Msg[];
  typedReady: boolean;
  liveReady: boolean;
  justJoined: boolean;
  turn: Turn | null;
  liveNote: string | null;
  signaling: "unknown" | "ok" | "failed";
  /** Join progress, for the guest button and /debug. */
  stage: JoinStage;
  /** Sanitized handshake events (no ids, tokens, keys, text or audio). */
  diag: { events: string[]; ice: string; lastOk: string; lastError: string };
}
export type JoinStage = "idle" | "invite" | "connecting" | "waitingHost" | "joined";

const initial: RoomState = {
  role: null,
  phase: "idle",
  error: null,
  pair: null,
  joinUrl: "",
  expiresAt: 0,
  messages: [],
  typedReady: false,
  liveReady: false,
  justJoined: false,
  turn: null,
  liveNote: null,
  signaling: "unknown",
  stage: "idle",
  diag: { events: [], ice: "—", lastOk: "—", lastError: "—" },
};

function diag(ev: string, ok = true) {
  const d = state.diag;
  const t = new Date().toISOString().slice(11, 19);
  set({
    diag: {
      ...d,
      events: [...d.events, `${t} ${ev}`].slice(-30),
      lastOk: ok ? ev : d.lastOk,
      lastError: ok ? d.lastError : ev,
    },
  });
}
function watchIce(conn: DataConnection) {
  const attach = () => {
    const pc = (conn as unknown as { peerConnection?: RTCPeerConnection }).peerConnection;
    if (!pc) return false;
    const upd = () => {
      set({ diag: { ...state.diag, ice: pc.iceConnectionState } });
      diag("ice " + pc.iceConnectionState, pc.iceConnectionState !== "failed");
    };
    pc.addEventListener("iceconnectionstatechange", upd);
    return true;
  };
  if (!attach()) {
    let n = 0;
    const i = setInterval(() => {
      if (attach() || ++n > 20) clearInterval(i);
    }, 100);
  }
}

let state: RoomState = initial;
let gen = 0; // bumps on every open/close so stale async opens abort
const subs = new Set<() => void>();
function set(p: Partial<RoomState>) {
  state = { ...state, ...p };
  subs.forEach((f) => f());
}
export const roomStore = {
  get: () => state,
  getServer: () => initial,
  subscribe(f: () => void) {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
};

function upsertMsg(m: Msg) {
  const i = state.messages.findIndex((x) => x.id === m.id);
  const messages = state.messages.slice();
  if (i >= 0) messages[i] = m;
  else messages.push(m);
  messages.sort((a, b) => a.ts - b.ts);
  set({ messages });
}

async function loadPeer(): Promise<typeof import("peerjs").Peer> {
  const mod = await import("peerjs");
  return mod.Peer;
}

// ---------------------------------------------------------------- validation
type AnyMsg = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
  t?: unknown;
  v?: unknown;
  token?: unknown;
  reconnect?: unknown;
  id?: unknown;
  text?: unknown;
  kind?: unknown;
  turnId?: unknown;
  seq?: unknown;
  pcm?: unknown;
  reason?: unknown;
  pair?: unknown;
  expiresAt?: unknown;
  typedReady?: unknown;
  liveReady?: unknown;
  msg?: unknown;
  turn?: unknown;
  code?: unknown;
};
const isStr = (x: unknown, max = 600): x is string => typeof x === "string" && x.length <= max;
const isId = (x: unknown): x is string => typeof x === "string" && ID_RE.test(x);

// ================================================================== HOST
interface HostCtx {
  peer: PeerT;
  token: string;
  conn: DataConnection | null;
  reconnectToken: string | null;
  admitted: boolean;
  seen: Map<string, MsgStatus>;
  rate: number[];
  expiry: ReturnType<typeof setTimeout>;
  wake: WakeLockSentinel | null;
  unKeys: () => void;
  onVis: () => void;
  live: {
    session: LiveSession | null;
    mic: MicHandle | null;
    seq: number;
    timers: ReturnType<typeof setTimeout>[];
    turnId: string | null;
  };
}
let host: HostCtx | null = null;

function keysState(pair = state.pair) {
  const k = getKeys();
  return { typedReady: !!k.translate, liveReady: !!k.gemini && pairHasLiveVoice(pair) };
}

function hostSend(m: AnyMsg) {
  if (host?.conn?.open && host.admitted) host.conn.send(m);
}

export function hasActiveHost() {
  return !!host && state.role === "host" && state.phase !== "ended" && state.phase !== "error";
}

export async function openHost(pair: { host: LangCode; guest: LangCode }) {
  if (!canCreateInvitation(window.location.hostname)) return;
  if (hasActiveHost()) return;
  closeAll();
  set({ ...initial, role: "host", phase: "opening", pair, ...keysState(pair) });
  const my = gen;
  const Peer = await loadPeer();
  if (my !== gen) return;
  const id = "dime-" + randomId(16);
  const token = randomId(16);
  const peer = new Peer(id, { debug: 0, config: ICE_CONFIG });
  const expiresAt = Date.now() + ROOM_TTL_MS;
  const onVis = () => {
    if (document.visibilityState === "visible") void requestWake();
    else if (host?.live.turnId && state.turn?.speaker === "host")
      void hostEndTurn(host.live.turnId);
  };
  host = {
    peer,
    token,
    conn: null,
    reconnectToken: null,
    admitted: false,
    seen: new Map(),
    rate: [],
    expiry: setTimeout(() => endRoom("expired"), ROOM_TTL_MS),
    wake: null,
    unKeys: onKeys(() => {
      set(keysState());
      hostSend({ t: "status", ...keysState() });
    }),
    onVis,
    live: { session: null, mic: null, seq: 0, timers: [], turnId: null },
  };
  document.addEventListener("visibilitychange", onVis);
  const hostSignalTimer = setTimeout(() => {
    if (host?.peer === peer && state.phase === "opening") {
      diag("signaling timeout", false);
      set({ phase: "error", error: "signal", signaling: "failed" });
    }
  }, SIGNAL_TIMEOUT_MS);
  peer.on("open", () => {
    clearTimeout(hostSignalTimer);
    diag("signaling open");
    set({
      phase: "waiting",
      signaling: "ok",
      expiresAt,
      joinUrl: buildGuestUrl({ roomId: id, token, pair }),
    });
    void requestWake();
  });
  peer.on("error", (e: { type?: string }) => {
    diag("error " + (e.type ?? "unknown"), false);
    if (state.phase === "opening") set({ phase: "error", error: "signal", signaling: "failed" });
  });
  peer.on("disconnected", () => {
    // Lost the broker (e.g. phone slept). Re-register the same id so the QR keeps working.
    diag("signaling lost", false);
    setTimeout(() => {
      if (host?.peer === peer && peer.disconnected && !peer.destroyed) peer.reconnect();
    }, 1000);
  });
  peer.on("connection", (conn) => hostOnConnection(conn));
}

async function requestWake() {
  if (!host || !("wakeLock" in navigator)) return;
  try {
    host.wake = await navigator.wakeLock.request("screen");
  } catch {
    /* unsupported */
  }
}

function hostOnConnection(conn: DataConnection) {
  const h = host!;
  let accepted = false;
  diag("connection offer received");
  watchIce(conn);
  const kill = setTimeout(() => {
    if (!accepted) {
      diag("guest never said hello", false);
      conn.close();
    }
  }, HOST_HELLO_MS);
  conn.on("open", () => diag("data channel open"));
  conn.on("error", (e: { type?: string }) => diag("conn error " + (e?.type ?? ""), false));
  conn.on("data", (raw) => {
    const m = raw as AnyMsg;
    if (!m || typeof m !== "object") return;
    if (!accepted) {
      if (m.t !== "hello") return;
      clearTimeout(kill);
      diag("hello received");
      const reject = (reason: ErrCode) => {
        conn.send({ t: "reject", v: PROTOCOL, reason });
        setTimeout(() => conn.close(), 300);
      };
      if (m.v !== PROTOCOL) return reject("token");
      if (Date.now() > state.expiresAt) return reject("expired");
      if (m.token !== h.token) return reject("token");
      const isReconnect = h.reconnectToken && m.reconnect === h.reconnectToken;
      if (h.admitted && h.conn?.open && !isReconnect) return reject("full");
      if (h.reconnectToken && !isReconnect) return reject("full");
      accepted = true;
      if (h.conn && h.conn !== conn)
        try {
          h.conn.close();
        } catch {
          /* */
        }
      h.conn = conn;
      h.admitted = true;
      h.reconnectToken = h.reconnectToken ?? randomId(16);
      conn.send({
        t: "accepted",
        v: PROTOCOL,
        pair: state.pair,
        reconnect: h.reconnectToken,
        expiresAt: state.expiresAt,
        ...keysState(),
      });
      diag("accepted sent");
      set({ phase: "connected", stage: "joined", justJoined: !isReconnect || state.justJoined });
      for (const msg of state.messages) conn.send({ t: "msgState", msg });
      return;
    }
    if (conn !== h.conn) return;
    hostHandleGuest(m);
  });
  conn.on("close", () => {
    if (conn === h.conn && state.phase === "connected") {
      set({ phase: "reconnecting" });
      if (state.turn?.speaker === "guest" && h.live.turnId) void hostEndTurn(h.live.turnId);
    }
  });
}

function hostHandleGuest(m: AnyMsg) {
  switch (m.t) {
    case "msg":
      if (isId(m.id) && isStr(m.text, 2000))
        void hostSubmit("guest", m.id, m.text, m.kind === "preset" ? "preset" : "text");
      break;
    case "turnReq":
      if (isId(m.turnId)) void hostBeginTurn("guest", m.turnId);
      break;
    case "audio":
      if (isId(m.turnId) && typeof m.seq === "number" && m.pcm instanceof ArrayBuffer)
        hostAudio(m.turnId, m.seq, m.pcm);
      break;
    case "turnEnd":
      if (isId(m.turnId)) void hostEndTurn(m.turnId);
      break;
    case "bye":
      endRoom("ended");
      break;
  }
}

function langs(from: Role) {
  const p = state.pair!;
  return from === "host" ? { src: p.host, dst: p.guest } : { src: p.guest, dst: p.host };
}

function broadcast(msg: Msg) {
  upsertMsg(msg);
  hostSend({ t: "msgState", msg });
}

/** One host-owned translator for both sides. Returns an error code or null. */
async function hostSubmit(
  from: Role,
  id: string,
  text: string,
  kind: Msg["kind"] = "text",
): Promise<ErrCode | null> {
  const h = host;
  if (!h || !state.pair) return null;
  const clean = text.trim();
  if (!clean) return null;
  const prev = h.seen.get(id);
  if (prev === "pending" || prev === "delivered") {
    const existing = state.messages.find((x) => x.id === id);
    if (existing) hostSend({ t: "msgState", msg: existing });
    return null;
  }
  if (clean.length > MAX_TEXT) {
    if (from === "guest") hostSend({ t: "error", id, code: "toolong" });
    return "toolong";
  }
  const now = Date.now();
  h.rate = h.rate.filter((t) => now - t < 60_000);
  if (h.rate.length >= RATE_PER_MIN) {
    if (from === "guest") hostSend({ t: "error", id, code: "rate" });
    return "rate";
  }
  h.rate.push(now);
  const ts = state.messages.find((x) => x.id === id)?.ts ?? now;
  const base: Msg = {
    id,
    kind,
    from,
    original: clean,
    translated: "",
    status: "pending",
    final: true,
    ts,
  };
  h.seen.set(id, "pending");
  broadcast(base);
  const { src, dst } = langs(from);
  try {
    const translated = await translateText(
      clean,
      LANGUAGES[src].translateCode,
      LANGUAGES[dst].translateCode,
      getKeys().translate,
    );
    h.seen.set(id, "delivered");
    broadcast({ ...base, translated, status: "delivered" });
  } catch {
    h.seen.set(id, "failed");
    broadcast({ ...base, status: "failed" });
  }
  return null;
}

// ---------------------------------------------------------------- live (host side)
function setTurn(t: Turn | null) {
  set({ turn: t });
  hostSend({ t: "turn", turn: t });
}

async function hostBeginTurn(
  speaker: Role,
  turnId: string,
  viaGesture?: () => Promise<MicHandle>,
): Promise<boolean> {
  const h = host;
  if (!h || !state.pair) return false;
  if (state.turn && state.turn.state !== "final" && state.turn.state !== "unavailable") {
    if (speaker === "guest") hostSend({ t: "turnDeny", turnId, reason: "busy" });
    return false;
  }
  const key = getKeys().gemini;
  if (!key || !pairHasLiveVoice(state.pair)) {
    if (speaker === "guest") hostSend({ t: "turnDeny", turnId, reason: "nolive" });
    return false;
  }
  cleanupLive();
  h.live.turnId = turnId;
  h.live.seq = -1;
  const startedAt = Date.now();
  setTurn({ id: turnId, speaker, state: "connecting", startedAt, firstCaptionMs: null });
  const { dst } = langs(speaker);
  const msg: Msg = {
    id: turnId,
    kind: "voice",
    from: speaker,
    original: "",
    translated: "",
    status: "pending",
    final: false,
    ts: startedAt,
  };
  let gotText = false;
  let micReady = speaker === "guest";
  let sessReady = false;
  const maybeListening = () => {
    if (micReady && sessReady && state.turn?.id === turnId && state.turn.state === "connecting")
      setTurn({ ...state.turn, state: "listening" });
  };
  const session = new LiveSession(key, LANGUAGES[dst].translateCode, {
    onReady: () => {
      sessReady = true;
      maybeListening();
    },
    onText: ({ original, translated }) => {
      if (h.live.turnId !== turnId) return; // stale
      if (!gotText && translated) {
        gotText = true;
        if (state.turn?.id === turnId)
          setTurn({ ...state.turn, state: "translating", firstCaptionMs: Date.now() - startedAt });
      }
      Object.assign(msg, { original, translated });
      broadcast({ ...msg });
    },
    onTurnComplete: () => {},
    onFail: (r: LiveFail) => {
      if (h.live.turnId !== turnId) return;
      liveUnavailable(turnId, r, msg);
    },
  });
  h.live.session = session;
  session.open();
  if (speaker === "host") {
    try {
      const mic = await (viaGesture ? viaGesture() : startMic((pcm) => session.send(pcm)));
      if (h.live.turnId !== turnId) {
        mic.stop();
        return false;
      }
      h.live.mic = mic;
      micReady = true;
      maybeListening();
    } catch (e) {
      liveUnavailable(
        turnId,
        e instanceof MicError && e.code === "denied" ? "mic" : "mic-failed",
        msg,
      );
      return false;
    }
  } else {
    hostSend({ t: "turnGrant", turnId });
  }
  h.live.timers.push(setTimeout(() => void hostEndTurn(turnId), MAX_TURN_MS));
  h.live.timers.push(
    setTimeout(() => {
      if (h.live.turnId === turnId && !gotText) {
        set({ liveNote: "No translated text received yet. Keep typing if needed." });
      }
    }, FIRST_CAPTION_MS),
  );
  return true;
}

function liveUnavailable(turnId: string, reason: string, msg: Msg) {
  const h = host;
  if (!h) return;
  cleanupLive();
  const note =
    {
      "setup-timeout": "Live setup timed out.",
      denied: "Gemini key was rejected.",
      quota: "Gemini quota exceeded.",
      unsupported: "Live translate model unavailable for this key.",
      closed: "Live session closed.",
      network: "Could not reach the live service.",
      mic: "Microphone access was denied.",
      "mic-failed": "Microphone could not start.",
    }[reason] ?? "Live captions unavailable.";
  set({ liveNote: note });
  if (msg.original || msg.translated) broadcast({ ...msg, final: true, status: "delivered" });
  if (state.turn?.id === turnId) setTurn({ ...state.turn, state: "unavailable", reason: note });
}

function hostAudio(turnId: string, seq: number, pcm: ArrayBuffer) {
  const h = host;
  if (!h || h.live.turnId !== turnId || state.turn?.speaker !== "guest") return;
  if (pcm.byteLength > MAX_FRAME_BYTES || pcm.byteLength % 2) return;
  if (seq <= h.live.seq) return;
  h.live.seq = seq;
  if (!h.live.session?.send(pcm))
    set({ liveNote: "Live service is slow to start; audio buffer full." });
}

async function hostEndTurn(turnId: string) {
  const h = host;
  if (!h || h.live.turnId !== turnId) return;
  h.live.mic?.stop();
  h.live.mic = null;
  const s = h.live.session;
  if (state.turn?.id === turnId && state.turn.state !== "unavailable" && s) {
    s.endAudio();
    if (state.turn.state === "listening" || state.turn.state === "connecting")
      setTurn({ ...state.turn, state: "translating" });
    await new Promise((r) => setTimeout(r, DRAIN_MS));
  }
  if (h.live.turnId !== turnId) return;
  const m = state.messages.find((x) => x.id === turnId);
  if (m) broadcast({ ...m, final: true, status: "delivered" });
  cleanupLive();
  if (state.turn?.id === turnId && state.turn.state !== "unavailable")
    setTurn({ ...state.turn, state: "final" });
}

function cleanupLive() {
  const h = host;
  if (!h) return;
  h.live.timers.forEach(clearTimeout);
  h.live.timers = [];
  h.live.mic?.stop();
  h.live.mic = null;
  h.live.session?.close();
  h.live.session = null;
  h.live.turnId = null;
}

function endRoom(reason: "ended" | "expired") {
  hostSend({ t: "end", reason });
  closeAll();
  set({
    phase: reason === "expired" ? "error" : "ended",
    error: reason === "expired" ? "expired" : null,
  });
}

// ================================================================== GUEST
interface GuestCtx {
  peer: PeerT;
  conn: DataConnection | null;
  roomId: string;
  token: string;
  reconnect: string | null;
  mic: MicHandle | null;
  turnId: string | null;
  seq: number;
  pendingGrant: ((ok: boolean) => void) | null;
  attempts: number;
}
let guest: GuestCtx | null = null;

export function parseJoinHash(hash: string) {
  const q = new URLSearchParams(hash.replace(/^[#?]/, ""));
  const r = q.get("r") ?? "",
    t = q.get("token") ?? q.get("t") ?? "",
    h = q.get("h"),
    g = q.get("g");
  if (!/^dime-[A-Za-z0-9_-]{16,64}$/.test(r) || !ID_RE.test(t)) return null;
  if (!h || !g || !(h in LANGUAGES) || !(g in LANGUAGES) || h === g) return null;
  return { roomId: r, token: t, pair: { host: h as LangCode, guest: g as LangCode } };
}

export async function joinRoom(info: {
  roomId: string;
  token: string;
  pair: { host: LangCode; guest: LangCode };
}) {
  closeAll(); // also cleans up any failed previous attempt before a retry
  set({ ...initial, role: "guest", phase: "opening", stage: "invite", pair: info.pair });
  diag("opening invite");
  const my = gen;
  let Peer: Awaited<ReturnType<typeof loadPeer>>;
  try {
    Peer = await loadPeer();
  } catch {
    diag("could not load connection code", false);
    if (my === gen) set({ phase: "error", error: "signal" });
    return;
  }
  if (my !== gen) return;
  const peer = new Peer("dime-g-" + randomId(16), { debug: 0, config: ICE_CONFIG });
  const g: GuestCtx = {
    peer,
    conn: null,
    roomId: info.roomId,
    token: info.token,
    reconnect: null,
    mic: null,
    turnId: null,
    seq: 0,
    pendingGrant: null,
    attempts: 0,
  };
  guest = g;
  const signalTimer = setTimeout(() => {
    if (guest === g && state.stage === "invite") {
      diag("signaling timeout", false);
      set({ phase: "error", error: "signal", signaling: "failed" });
    }
  }, SIGNAL_TIMEOUT_MS);
  peer.on("open", () => {
    clearTimeout(signalTimer);
    if (guest !== g) return;
    diag("signaling open");
    set({ signaling: "ok" });
    if (!g.conn) guestConnect(); // a re-registration after a lost broker keeps the existing link
  });
  peer.on("disconnected", () => {
    if (guest !== g) return;
    diag("signaling lost", false);
    setTimeout(() => {
      if (guest === g && peer.disconnected && !peer.destroyed) peer.reconnect();
    }, 1000);
  });
  peer.on("error", (e: { type?: string }) => {
    if (guest !== g) return;
    diag("error " + (e.type ?? "unknown"), false);
    if (e.type === "peer-unavailable") {
      clearTimeout(signalTimer);
      set({ phase: "error", error: "roomgone" });
    } else if (state.phase === "opening" || state.phase === "reconnecting") {
      clearTimeout(signalTimer);
      set({
        phase: "error",
        error:
          e.type === "network" || e.type === "server-error" || e.type === "socket-error"
            ? "signal"
            : "channel",
        signaling: e.type === "network" ? "failed" : state.signaling,
      });
    }
  });
}

function guestConnect() {
  const g = guest!;
  set({ stage: "connecting" });
  const conn = g.peer.connect(g.roomId, { reliable: true });
  g.conn = conn;
  watchIce(conn);
  let admitted = false;
  let helloSent = false;
  let ackTimer: ReturnType<typeof setTimeout> | null = null;
  const fail = (error: ErrCode, why: string) => {
    if (admitted || guest !== g || state.phase === "error") return;
    diag(why, false);
    set({ phase: "error", error });
    try {
      conn.close();
    } catch {
      /* */
    }
  };
  const chanTimer = setTimeout(() => fail("channel", "data channel timeout"), CHANNEL_TIMEOUT_MS);
  // Listen for the acknowledgement before saying hello.
  conn.on("data", (raw) => {
    const m = raw as AnyMsg;
    if (!m || typeof m !== "object") return;
    if (m.t === "reject") {
      if (ackTimer) clearTimeout(ackTimer);
      diag("rejected", false);
      const r = m.reason;
      set({ phase: "error", error: r === "full" || r === "expired" ? r : "token" });
      return;
    }
    if (m.t === "accepted") {
      if (ackTimer) clearTimeout(ackTimer);
      diag("accepted received");
      admitted = true;
      g.attempts = 0;
      g.reconnect = isStr(m.reconnect) ? m.reconnect : null;
      const p = m.pair as { host: LangCode; guest: LangCode };
      set({
        phase: "connected",
        stage: "joined",
        pair: p,
        expiresAt: Number(m.expiresAt),
        typedReady: !!m.typedReady,
        liveReady: !!m.liveReady,
        justJoined: true,
      });
      return;
    }
    if (!admitted) return;
    guestHandle(m);
  });
  conn.on("open", () => {
    clearTimeout(chanTimer);
    if (helloSent || guest !== g) return;
    helloSent = true;
    diag("data channel open");
    set({ stage: "waitingHost" });
    conn.send({ t: "hello", v: PROTOCOL, token: g.token, reconnect: g.reconnect ?? undefined });
    diag("hello sent");
    ackTimer = setTimeout(() => fail("noack", "no answer from host"), ACK_TIMEOUT_MS);
  });
  conn.on("error", (e: { type?: string }) => diag("conn error " + (e?.type ?? ""), false));
  conn.on("close", () => {
    clearTimeout(chanTimer);
    if (ackTimer) clearTimeout(ackTimer);
    if (guest !== g) return;
    if (!admitted) {
      fail(helloSent ? "noack" : "channel", "connection closed before joining");
      return;
    }
    if (state.phase === "connected" && g.reconnect && g.attempts < 5) {
      g.attempts++;
      set({ phase: "reconnecting" });
      guestStopMic();
      setTimeout(() => guest === g && guestConnect(), 1500);
    }
  });
}

function guestHandle(m: AnyMsg) {
  const g = guest!;
  switch (m.t) {
    case "msgState": {
      const msg = m.msg as Msg;
      if (msg && isStr(msg.id, 80) && isStr(msg.original, 4000) && isStr(msg.translated, 8000))
        upsertMsg(msg);
      break;
    }
    case "status":
      set({ typedReady: !!m.typedReady, liveReady: !!m.liveReady });
      break;
    case "turn":
      set({ turn: (m.turn as Turn) ?? null });
      if (
        g.turnId &&
        (!m.turn ||
          (m.turn as Turn).id !== g.turnId ||
          ["final", "unavailable"].includes((m.turn as Turn).state))
      )
        guestStopMic();
      break;
    case "turnGrant":
      if (m.turnId === g.turnId) g.pendingGrant?.(true);
      break;
    case "turnDeny":
      if (m.turnId === g.turnId) g.pendingGrant?.(false);
      break;
    case "error":
      set({ error: m.code === "rate" ? "rate" : m.code === "toolong" ? "toolong" : state.error });
      break;
    case "end":
      closeAll();
      set({
        phase: m.reason === "expired" ? "error" : "ended",
        error: m.reason === "expired" ? "expired" : null,
      });
      break;
  }
}

function guestStopMic() {
  if (!guest) return;
  guest.mic?.stop();
  guest.mic = null;
  guest.turnId = null;
}

// ================================================================== shared API used by the UI
export function sendText(
  id: string,
  text: string,
  kind: "text" | "preset" = "text",
): ErrCode | null {
  const clean = text.trim();
  if (!clean) return null;
  if (clean.length > MAX_TEXT) return "toolong";
  if (state.role === "host") {
    void hostSubmit("host", id, clean, kind).then((e) => e && set({ error: e }));
    return null;
  }
  if (state.role === "guest" && guest?.conn?.open) {
    upsertMsg({
      id,
      kind,
      from: "guest",
      original: clean,
      translated: "",
      status: "pending",
      final: true,
      ts: Date.now(),
    });
    guest.conn.send({ t: "msg", id, text: clean, kind });
    const g = guest;
    setTimeout(() => {
      const cur = state.messages.find((x) => x.id === id);
      if (guest === g && cur?.status === "pending") upsertMsg({ ...cur, status: "failed" });
    }, 15000);
    return null;
  }
  return "timeout";
}

/** Start speaking. Must be called from a user gesture. */
export async function startTalking(): Promise<boolean> {
  const turnId = randomId(16);
  if (state.role === "host") return hostBeginTurn("host", turnId);
  const g = guest;
  if (!g?.conn?.open || g.turnId) return false;
  g.turnId = turnId;
  g.seq = 0;
  // Ask for the mic in the gesture first, then request the turn from the host.
  let mic: MicHandle;
  let granted = false;
  const early: ArrayBuffer[] = [];
  try {
    mic = await startMic((pcm) => {
      if (g.turnId === turnId && granted) g.conn?.send({ t: "audio", turnId, seq: g.seq++, pcm });
      else if (g.turnId === turnId && early.length < 100) early.push(pcm);
    });
  } catch (e) {
    g.turnId = null;
    set({
      error: e instanceof MicError && e.code === "denied" ? "mic" : "mic",
      liveNote: "Microphone unavailable.",
    });
    return false;
  }
  g.mic = mic;
  const ok = await new Promise<boolean>((res) => {
    g.pendingGrant = res;
    g.conn!.send({ t: "turnReq", turnId });
    setTimeout(() => res(false), 8000);
  });
  g.pendingGrant = null;
  if (!ok || g.turnId !== turnId) {
    guestStopMic();
    return false;
  }
  granted = true;
  for (const pcm of early) g.conn?.send({ t: "audio", turnId, seq: g.seq++, pcm });
  setTimeout(() => {
    if (g.turnId === turnId) stopTalking();
  }, MAX_TURN_MS);
  return true;
}

export function stopTalking() {
  if (state.role === "host") {
    const id = host?.live.turnId;
    if (id) void hostEndTurn(id);
    return;
  }
  const g = guest;
  if (!g?.turnId) return;
  const id = g.turnId;
  g.conn?.send({ t: "turnEnd", turnId: id });
  guestStopMic();
}

export function clearJoinedNotice() {
  set({ justJoined: false, error: null });
}

export function leave() {
  if (state.role === "host" && host) hostSend({ t: "end", reason: "ended" });
  if (state.role === "guest" && guest?.conn?.open)
    try {
      guest.conn.send({ t: "bye" });
    } catch {
      /* */
    }
  closeAll();
  set({ ...initial });
}

function closeAll() {
  gen++;
  if (host) {
    cleanupLive();
    clearTimeout(host.expiry);
    host.unKeys();
    document.removeEventListener("visibilitychange", host.onVis);
    void host.wake?.release().catch(() => {});
    try {
      host.conn?.close();
    } catch {
      /* */
    }
    try {
      host.peer.destroy();
    } catch {
      /* */
    }
    host = null;
  }
  if (guest) {
    guestStopMic();
    try {
      guest.conn?.close();
    } catch {
      /* */
    }
    try {
      guest.peer.destroy();
    } catch {
      /* */
    }
    guest = null;
  }
}

/** Preflight: create and destroy a throwaway peer to check signaling. */
export async function testSignaling(timeoutMs = 10000): Promise<boolean> {
  const Peer = await loadPeer();
  return new Promise((res) => {
    const p = new Peer("dime-chk-" + randomId(16), { debug: 0 });
    const t = setTimeout(() => {
      p.destroy();
      res(false);
    }, timeoutMs);
    p.on("open", () => {
      clearTimeout(t);
      p.destroy();
      res(true);
    });
    p.on("error", () => {
      clearTimeout(t);
      p.destroy();
      res(false);
    });
  });
}

/** Exposed only for tests: host-side submit pipeline. */
export const __test = { hostSubmit, set };
