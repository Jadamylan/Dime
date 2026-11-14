export type LangCode = "en" | "es";

export interface UiStrings {
  tagline: string;
  start: string;
  watchDemo: string;
  duo: string;
  hostSetup: string;
  check: string;
  iSpeak: string;
  theySpeak: string;
  sameLang: string;
  inviteTitle: string;
  /** {host} = host language name, {guest} = guest language name (in this UI language) */
  inviteBody: string;
  cancel: string;
  copyLink: string;
  copied: string;
  waitingPeer: string;
  join: string;
  joining: string;
  joinTitle: string;
  joinBody: string;
  joined: string;
  typedMode: string;
  typePlaceholder: string;
  send: string;
  pending: string;
  failed: string;
  retry: string;
  delivered: string;
  original: string;
  translated: string;
  showOriginal: string;
  repeat: string;
  sayAgain: string;
  sayAgainLabel: string;
  listening: string;
  translating: string;
  translatedState: string;
  connecting: string;
  liveUnavailable: string;
  liveCaptions: string;
  holdToTalk: string;
  tapToTalk: string;
  stop: string;
  otherSpeaking: string;
  hearTranslation: string;
  play: string;
  end: string;
  ended: string;
  needKeysHost: string;
  needKeysGuest: string;
  addKeys: string;
  errToken: string;
  errFull: string;
  errExpired: string;
  errTimeout: string;
  errSignal: string;
  errRoomGone: string;
  errMic: string;
  errRate: string;
  errTooLong: string;
  reconnecting: string;
  you: string;
  them: string;
  host: string;
  guest: string;
}

export interface LanguageDef {
  code: LangCode;
  locale: string;
  endonym: string;
  /** Name of this language as written in every UI language */
  names: Record<LangCode, string>;
  ui: UiStrings;
}

const en: UiStrings = {
  tagline: "Tell me in your language.",
  start: "Start conversation",
  watchDemo: "Watch demo",
  duo: "Duo concept",
  hostSetup: "Host setup",
  check: "Preflight check",
  iSpeak: "I speak",
  theySpeak: "They speak",
  sameLang: "Choose two different languages.",
  inviteTitle: "Can we talk?",
  inviteBody: "I speak {host}. Scan to talk with me in {guest}.",
  cancel: "Cancel",
  copyLink: "Copy join link",
  copied: "Link copied",
  waitingPeer: "Preparing invitation…",
  join: "Join",
  joining: "Joining…",
  joinTitle: "Join conversation",
  joinBody: "Tap Join to talk in {guest}. They speak {host}.",
  joined: "They joined. You can start speaking.",
  typedMode: "Typed: translated per message",
  typePlaceholder: "Type a message",
  send: "Send",
  pending: "Sending…",
  failed: "Not delivered",
  retry: "Retry",
  delivered: "Delivered",
  original: "Original",
  translated: "Translated",
  showOriginal: "Show original",
  repeat: "Repeat",
  sayAgain: "Could you say that again?",
  sayAgainLabel: "Preset request",
  listening: "Listening",
  translating: "Translating",
  translatedState: "Translated",
  connecting: "Connecting",
  liveUnavailable: "Live captions unavailable — typing still works",
  liveCaptions: "Live captions",
  holdToTalk: "Hold to talk",
  tapToTalk: "Tap to talk",
  stop: "Stop",
  otherSpeaking: "Other person is speaking",
  hearTranslation: "Hear translation",
  play: "Play",
  end: "End",
  ended: "Conversation ended.",
  needKeysHost: "Add a translation key to start translating.",
  needKeysGuest: "Waiting for the host to finish setup.",
  addKeys: "Add keys",
  errToken: "This invitation is not valid. Ask for a new QR code.",
  errFull: "Someone else already joined this conversation.",
  errExpired: "This invitation expired. Ask for a new QR code.",
  errTimeout: "Could not reach the other phone. Try the same Wi‑Fi or a hotspot.",
  errSignal: "Could not reach the connection service. Check your internet.",
  errRoomGone: "This conversation is no longer open. Ask for a new QR code.",
  errMic: "Microphone access was denied.",
  errRate: "Too many messages. Wait a moment.",
  errTooLong: "Message too long (500 characters max).",
  reconnecting: "Reconnecting…",
  you: "You",
  them: "Them",
  host: "Host",
  guest: "Guest",
};

const es: UiStrings = {
  tagline: "Dímelo en tu idioma.",
  start: "Iniciar conversación",
  watchDemo: "Ver demostración",
  duo: "Concepto Duo",
  hostSetup: "Configuración del anfitrión",
  check: "Comprobación previa",
  iSpeak: "Yo hablo",
  theySpeak: "La otra persona habla",
  sameLang: "Elige dos idiomas distintos.",
  inviteTitle: "¿Podemos hablar?",
  inviteBody: "Hablo {host}. Escanea para hablar conmigo en {guest}.",
  cancel: "Cancelar",
  copyLink: "Copiar enlace",
  copied: "Enlace copiado",
  waitingPeer: "Preparando invitación…",
  join: "Unirme",
  joining: "Uniéndome…",
  joinTitle: "Unirse a la conversación",
  joinBody: "Toca Unirme para hablar en {guest}. La otra persona habla {host}.",
  joined: "Se unió. Ya puedes empezar a hablar.",
  typedMode: "Escrito: traducido por mensaje",
  typePlaceholder: "Escribe un mensaje",
  send: "Enviar",
  pending: "Enviando…",
  failed: "No entregado",
  retry: "Reintentar",
  delivered: "Entregado",
  original: "Original",
  translated: "Traducido",
  showOriginal: "Ver original",
  repeat: "Repetir",
  sayAgain: "¿Puede repetirlo?",
  sayAgainLabel: "Solicitud predefinida",
  listening: "Escuchando",
  translating: "Traduciendo",
  translatedState: "Traducido",
  connecting: "Conectando",
  liveUnavailable: "Subtítulos en vivo no disponibles — puedes seguir escribiendo",
  liveCaptions: "Subtítulos en vivo",
  holdToTalk: "Mantén para hablar",
  tapToTalk: "Toca para hablar",
  stop: "Detener",
  otherSpeaking: "La otra persona está hablando",
  hearTranslation: "Escuchar traducción",
  play: "Reproducir",
  end: "Terminar",
  ended: "Conversación terminada.",
  needKeysHost: "Agrega una clave de traducción para empezar.",
  needKeysGuest: "Esperando a que el anfitrión termine la configuración.",
  addKeys: "Agregar claves",
  errToken: "Esta invitación no es válida. Pide un código QR nuevo.",
  errFull: "Otra persona ya se unió a esta conversación.",
  errExpired: "Esta invitación caducó. Pide un código QR nuevo.",
  errTimeout:
    "No se pudo conectar con el otro teléfono. Prueben la misma Wi‑Fi o un punto de acceso.",
  errSignal: "No se pudo conectar al servicio. Revisa tu internet.",
  errRoomGone: "Esta conversación ya no está abierta. Pide un código QR nuevo.",
  errMic: "Se denegó el acceso al micrófono.",
  errRate: "Demasiados mensajes. Espera un momento.",
  errTooLong: "Mensaje demasiado largo (máximo 500 caracteres).",
  reconnecting: "Reconectando…",
  you: "Tú",
  them: "Ellos",
  host: "Anfitrión",
  guest: "Invitado",
};

export const LANGUAGES: Record<LangCode, LanguageDef> = {
  en: {
    code: "en",
    locale: "en-US",
    endonym: "English",
    names: { en: "English", es: "inglés" },
    ui: en,
  },
  es: {
    code: "es",
    locale: "es-ES",
    endonym: "Español",
    names: { en: "Spanish", es: "español" },
    ui: es,
  },
};

export const LANG_CODES = Object.keys(LANGUAGES) as LangCode[];
export const DEFAULT_HOST: LangCode = "es";
export const DEFAULT_GUEST: LangCode = "en";

export function isLang(x: unknown): x is LangCode {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(LANGUAGES, x);
}

/** Returns a valid pair or null (unsupported codes or same language are rejected). */
export function validPair(
  host: unknown,
  guest: unknown,
): { host: LangCode; guest: LangCode } | null {
  if (!isLang(host) || !isLang(guest) || host === guest) return null;
  return { host, guest };
}

export function ui(code: LangCode): UiStrings {
  return LANGUAGES[code].ui;
}

export function fill(tpl: string, uiLang: LangCode, pair: { host: LangCode; guest: LangCode }) {
  return tpl
    .replace("{host}", LANGUAGES[pair.host].names[uiLang])
    .replace("{guest}", LANGUAGES[pair.guest].names[uiLang]);
}
