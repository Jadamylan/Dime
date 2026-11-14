import { ui, type LangCode } from "@/config/languages";

/** No original wordmark asset was supplied, so the word "Dime" is rendered as text. */
export function Wordmark({
  size = "lg",
  lang = "en",
  tagline = true,
}: {
  size?: "sm" | "lg";
  lang?: LangCode;
  tagline?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={
          size === "lg" ? "text-6xl font-bold tracking-tight" : "text-3xl font-bold tracking-tight"
        }
      >
        Dime
      </div>
      {tagline && (
        <p
          className={
            size === "lg"
              ? "mt-2 text-xl text-muted-foreground"
              : "mt-1 text-base text-muted-foreground"
          }
        >
          {ui(lang).tagline}
        </p>
      )}
    </div>
  );
}
