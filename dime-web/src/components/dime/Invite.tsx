import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { fill, ui, type LangCode } from "@/config/languages";

export function Invite({
  pair,
  url,
  demo,
  onCancel,
}: {
  pair: { host: LangCode; guest: LangCode };
  url: string;
  demo?: boolean;
  onCancel?: () => void;
}) {
  const t = ui(pair.guest);
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col items-center gap-5 text-center" lang={pair.guest}>
      <h1 className="text-4xl font-bold leading-tight">{t.inviteTitle}</h1>
      <p className="max-w-xs text-xl leading-snug">{fill(t.inviteBody, pair.guest, pair)}</p>
      <div className="rounded-3xl bg-qr-bg p-5 shadow-sm">
        {url ? (
          <QRCodeSVG
            value={url}
            size={demo ? 150 : 240}
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="M"
            marginSize={1}
            aria-label={demo ? "Demo QR (does not join)" : "Join QR code"}
            role="img"
          />
        ) : (
          <div className="grid size-60 place-items-center text-muted-foreground">
            {t.waitingPeer}
          </div>
        )}
      </div>
      {demo && <p className="text-sm font-semibold uppercase tracking-wide">Demo QR</p>}
      {!demo && url && (
        <button
          className="tap rounded-full bg-secondary px-5 text-base font-medium"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* */
            }
          }}
        >
          {copied ? t.copied : t.copyLink}
        </button>
      )}
      {onCancel && (
        <button className="tap px-4 text-base text-muted-foreground underline" onClick={onCancel}>
          {ui(pair.host).cancel}
        </button>
      )}
    </div>
  );
}
