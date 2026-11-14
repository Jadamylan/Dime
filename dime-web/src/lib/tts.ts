import { LANGUAGES, type LangCode } from "@/config/languages";

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
export function speak(text: string, lang: LangCode): boolean {
  if (!ttsSupported()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const loc = LANGUAGES[lang].locale;
  u.lang = loc;
  const voices = synth.getVoices();
  const v = voices.find((x) => x.lang === loc) ?? voices.find((x) => x.lang.startsWith(lang));
  if (v) u.voice = v;
  synth.speak(u);
  return true;
}
export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
