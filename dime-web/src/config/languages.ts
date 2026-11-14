export type LangCode = "en" | "es" | "fr" | "pt" | "de" | "it" | "ar" | "zh" | "ja" | "ko";
/** Languages with a full interface translation; others fall back to English copy. */
export type UiLang = "en" | "es";

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
  stageInvite: string;
  stageConnecting: string;
  stageWaiting: string;
  errChannel: string;
  errNoAck: string;
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
  voiceNote: string;
  useCase: string;
  ready: string;
  finishTalking: string;
  voiceMode: string;
  writeMessage: string;
  correctText: string;
  sayNewTurn: string;
}

export interface LanguageDef {
  code: LangCode;
  /** BCP-47 locale for the browser (lang attribute, speech voices). */
  locale: string;
  /** Google Cloud Translation v2 language code. */
  translateCode: string;
  /** Gemini Live voice translation; only pairs where both sides are true offer live voice. */
  liveVoice: boolean;
  dir: "ltr" | "rtl";
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
  stageInvite: "Opening invite…",
  stageConnecting: "Connecting to the other phone…",
  stageWaiting: "Waiting for host…",
  errChannel:
    "Reached the connection service, but the phones could not link directly. Put both phones on the same Wi‑Fi or one phone's hotspot, then retry.",
  errNoAck:
    "The host phone didn't answer. Keep the host's invite screen open and unlocked, then retry.",
  joinTitle: "Join conversation",
  joinBody: "Tap Join to talk in {guest}. They speak {host}.",
  joined: "They joined. You can start speaking.",
  typedMode: "Typed · translated per message",
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
  useCase:
    "Walk into a salon or local business and make a plan, even when you speak different languages.",
  voiceNote: "Live voice: English ↔ Spanish. Other languages use typed translation.",
  ready: "Ready",
  finishTalking: "Tap when finished",
  voiceMode: "Voice · live captions",
  writeMessage: "Write message",
  correctText: "Type a correction",
  sayNewTurn: "Say again",
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
  stageInvite: "Abriendo la invitación…",
  stageConnecting: "Conectando con el otro teléfono…",
  stageWaiting: "Esperando al anfitrión…",
  errChannel:
    "Llegamos al servicio, pero los teléfonos no pudieron enlazarse. Conecten ambos a la misma Wi‑Fi o al punto de acceso de uno, y reintenten.",
  errNoAck:
    "El teléfono anfitrión no respondió. Mantén abierta y desbloqueada la invitación, y reintenta.",
  joinTitle: "Unirse a la conversación",
  joinBody: "Toca Unirme para hablar en {guest}. La otra persona habla {host}.",
  joined: "Se unió. Ya puedes empezar a hablar.",
  typedMode: "Escrito · traducido por mensaje",
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
  them: "Otra persona",
  host: "Anfitrión",
  guest: "Invitado",
  useCase: "Entra a un salón o negocio local y hagan un plan, aunque hablen idiomas distintos.",
  voiceNote: "Voz en vivo: español ↔ inglés. Los demás idiomas usan traducción escrita.",
  ready: "Listo",
  finishTalking: "Toca para terminar",
  voiceMode: "Voz · subtítulos en vivo",
  writeMessage: "Escribe un mensaje",
  correctText: "Corregir texto",
  sayNewTurn: "Decir de nuevo",
};

type Names = Record<LangCode, string>;
// NAMES[uiLang][lang] = name of `lang` written in `uiLang` (used in invite sentences).
const NAMES: Record<LangCode, Names> = {
  en: {
    en: "English",
    es: "Spanish",
    fr: "French",
    pt: "Portuguese",
    de: "German",
    it: "Italian",
    ar: "Arabic",
    zh: "Simplified Chinese",
    ja: "Japanese",
    ko: "Korean",
  },
  es: {
    en: "inglés",
    es: "español",
    fr: "francés",
    pt: "portugués",
    de: "alemán",
    it: "italiano",
    ar: "árabe",
    zh: "chino simplificado",
    ja: "japonés",
    ko: "coreano",
  },
  fr: {
    en: "anglais",
    es: "espagnol",
    fr: "français",
    pt: "portugais",
    de: "allemand",
    it: "italien",
    ar: "arabe",
    zh: "chinois simplifié",
    ja: "japonais",
    ko: "coréen",
  },
  pt: {
    en: "inglês",
    es: "espanhol",
    fr: "francês",
    pt: "português",
    de: "alemão",
    it: "italiano",
    ar: "árabe",
    zh: "chinês simplificado",
    ja: "japonês",
    ko: "coreano",
  },
  de: {
    en: "Englisch",
    es: "Spanisch",
    fr: "Französisch",
    pt: "Portugiesisch",
    de: "Deutsch",
    it: "Italienisch",
    ar: "Arabisch",
    zh: "vereinfachtes Chinesisch",
    ja: "Japanisch",
    ko: "Koreanisch",
  },
  it: {
    en: "inglese",
    es: "spagnolo",
    fr: "francese",
    pt: "portoghese",
    de: "tedesco",
    it: "italiano",
    ar: "arabo",
    zh: "cinese semplificato",
    ja: "giapponese",
    ko: "coreano",
  },
  ar: {
    en: "الإنجليزية",
    es: "الإسبانية",
    fr: "الفرنسية",
    pt: "البرتغالية",
    de: "الألمانية",
    it: "الإيطالية",
    ar: "العربية",
    zh: "الصينية المبسطة",
    ja: "اليابانية",
    ko: "الكورية",
  },
  zh: {
    en: "英语",
    es: "西班牙语",
    fr: "法语",
    pt: "葡萄牙语",
    de: "德语",
    it: "意大利语",
    ar: "阿拉伯语",
    zh: "简体中文",
    ja: "日语",
    ko: "韩语",
  },
  ja: {
    en: "英語",
    es: "スペイン語",
    fr: "フランス語",
    pt: "ポルトガル語",
    de: "ドイツ語",
    it: "イタリア語",
    ar: "アラビア語",
    zh: "簡体字中国語",
    ja: "日本語",
    ko: "韓国語",
  },
  ko: {
    en: "영어",
    es: "스페인어",
    fr: "프랑스어",
    pt: "포르투갈어",
    de: "독일어",
    it: "이탈리아어",
    ar: "아랍어",
    zh: "중국어(간체)",
    ja: "일본어",
    ko: "한국어",
  },
};
/** byLang[x] = name of this language written in x. */
const namesOf = (code: LangCode) =>
  Object.fromEntries(Object.keys(NAMES).map((u) => [u, NAMES[u as LangCode][code]])) as Names;

type InviteCopy = Pick<UiStrings, "inviteTitle" | "inviteBody" | "joinTitle" | "joinBody" | "join">;
function extra(
  code: LangCode,
  locale: string,
  translateCode: string,
  endonym: string,
  copy: InviteCopy,
  dir: "ltr" | "rtl" = "ltr",
): LanguageDef {
  // Only the guest-facing invite/join copy is localized; the rest uses English for now.
  return {
    code,
    locale,
    translateCode,
    liveVoice: false,
    dir,
    endonym,
    names: namesOf(code),
    ui: { ...en, ...copy },
  };
}

export const LANGUAGES: Record<LangCode, LanguageDef> = {
  en: {
    code: "en",
    locale: "en-US",
    translateCode: "en",
    liveVoice: true,
    dir: "ltr",
    endonym: "English",
    names: namesOf("en"),
    ui: en,
  },
  es: {
    code: "es",
    locale: "es-ES",
    translateCode: "es",
    liveVoice: true,
    dir: "ltr",
    endonym: "Español",
    names: namesOf("es"),
    ui: es,
  },
  fr: extra("fr", "fr-FR", "fr", "Français", {
    inviteTitle: "On peut parler ?",
    inviteBody: "Je parle {host}. Scannez pour me parler en {guest}.",
    joinTitle: "Rejoindre la conversation",
    joinBody: "Touchez Rejoindre pour parler en {guest}. L'autre personne parle {host}.",
    join: "Rejoindre",
  }),
  pt: extra("pt", "pt-BR", "pt", "Português", {
    inviteTitle: "Podemos conversar?",
    inviteBody: "Eu falo {host}. Escaneie para falar comigo em {guest}.",
    joinTitle: "Entrar na conversa",
    joinBody: "Toque em Entrar para falar em {guest}. A outra pessoa fala {host}.",
    join: "Entrar",
  }),
  de: extra("de", "de-DE", "de", "Deutsch", {
    inviteTitle: "Können wir reden?",
    inviteBody: "Ich spreche {host}. Scanne den Code, um mit mir auf {guest} zu sprechen.",
    joinTitle: "Gespräch beitreten",
    joinBody: "Tippe auf Beitreten, um auf {guest} zu sprechen. Die andere Person spricht {host}.",
    join: "Beitreten",
  }),
  it: extra("it", "it-IT", "it", "Italiano", {
    inviteTitle: "Possiamo parlare?",
    inviteBody: "Parlo {host}. Scansiona per parlare con me in {guest}.",
    joinTitle: "Partecipa alla conversazione",
    joinBody: "Tocca Partecipa per parlare in {guest}. L'altra persona parla {host}.",
    join: "Partecipa",
  }),
  ar: extra(
    "ar",
    "ar",
    "ar",
    "العربية",
    {
      inviteTitle: "هل يمكننا التحدث؟",
      inviteBody: "أنا أتحدث {host}. امسح الرمز للتحدث معي بـ{guest}.",
      joinTitle: "انضم إلى المحادثة",
      joinBody: "اضغط انضم للتحدث بـ{guest}. الشخص الآخر يتحدث {host}.",
      join: "انضم",
    },
    "rtl",
  ),
  // Display label "中文（简体）", browser locale zh-CN, Google Translate code zh-CN.
  zh: extra("zh", "zh-CN", "zh-CN", "中文（简体）", {
    inviteTitle: "我们可以聊聊吗？",
    inviteBody: "我说{host}。扫码用{guest}和我交谈。",
    joinTitle: "加入对话",
    joinBody: "点击加入，用{guest}交谈。对方说{host}。",
    join: "加入",
  }),
  ja: extra("ja", "ja-JP", "ja", "日本語", {
    inviteTitle: "話せますか？",
    inviteBody: "私は{host}を話します。スキャンして{guest}で話しましょう。",
    joinTitle: "会話に参加",
    joinBody: "「参加」をタップして{guest}で話しましょう。相手は{host}を話します。",
    join: "参加",
  }),
  ko: extra("ko", "ko-KR", "ko", "한국어", {
    inviteTitle: "대화할 수 있을까요?",
    inviteBody: "저는 {host}를 해요. 스캔해서 {guest}로 저와 이야기해요.",
    joinTitle: "대화 참여",
    joinBody: "참여를 눌러 {guest}로 이야기하세요. 상대방은 {host}를 해요.",
    join: "참여",
  }),
};

/** Live voice is offered only when both sides support it (today: English ↔ Spanish). */
export function pairHasLiveVoice(pair: { host: LangCode; guest: LangCode } | null) {
  return !!pair && LANGUAGES[pair.host].liveVoice && LANGUAGES[pair.guest].liveVoice;
}

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
