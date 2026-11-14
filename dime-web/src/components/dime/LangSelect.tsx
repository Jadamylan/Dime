import { LANG_CODES, LANGUAGES, type LangCode } from "@/config/languages";

export function LangSelect({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: LangCode;
  onChange: (l: LangCode) => void;
  id: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-base font-medium text-muted-foreground">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as LangCode)}
        className="tap w-full appearance-none rounded-2xl bg-card px-5 py-4 text-2xl font-semibold"
      >
        {LANG_CODES.map((c) => (
          <option key={c} value={c} lang={c}>
            {LANGUAGES[c].endonym}
          </option>
        ))}
      </select>
    </label>
  );
}
