import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Copy, Check, QrCode, FileCode } from "lucide-react";
import { copyToClipboard, downloadFile, cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";

const COLORS = [
  { label: "Black", fg: "000000", bg: "ffffff" },
  { label: "Blue", fg: "2563eb", bg: "ffffff" },
  { label: "Red", fg: "dc2626", bg: "ffffff" },
  { label: "Green", fg: "16a34a", bg: "ffffff" },
  { label: "Inverted", fg: "ffffff", bg: "000000" },
];

const SIZES = [128, 256, 512];

export default function QrCodeGenerator() {
  const { t } = useTranslation();
  const { success } = useToast();
  const [text, setText] = useState("https://zidrotool.com");
  const [size, setSize] = useState(256);
  const [colorIdx, setColorIdx] = useState(0);
  const [ecc, setEcc] = useState("M");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const color = COLORS[colorIdx];

  const qrUrl = useMemo(() => {
    const encoded = encodeURIComponent(text || " ");
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=${color.bg}&color=${color.fg}&margin=10&ecc=${ecc}`;
  }, [text, size, color, ecc]);

  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qr-code.png";
      a.click();
      URL.revokeObjectURL(url);
      success("PNG downloaded");
    } catch {
      /* noop */
    }
    setDownloading(false);
  };

  const handleDownloadSvg = async () => {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#${color.bg}"/>
  <image href="${dataUrl}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
        downloadFile("qr-code.svg", svgContent, "image/svg+xml");
        success("SVG downloaded");
      };
      reader.readAsDataURL(blob);
    } catch { /* noop */ }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      success(t("tool.copied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      {/* Input */}
      <div className="mb-6">
        <label className="label mb-2 block">{t("creator.qr.placeholder")}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input min-h-[80px] resize-y"
          placeholder="https://example.com"
        />
      </div>

      {/* Options grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Size */}
        <div>
          <label className="label mb-2 block">{t("creator.qr.size")}</label>
          <div className="flex gap-1.5">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-all",
                  size === s
                    ? "bg-brand-600 text-white"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
                )}
              >
                {s}px
              </button>
            ))}
          </div>
        </div>

        {/* Error correction */}
        <div>
          <label className="label mb-2 block">{t("creator.qr.errorCorrect")}</label>
          <select
            value={ecc}
            onChange={(e) => setEcc(e.target.value)}
            className="input"
          >
            <option value="L">{t("creator.qr.levelL")}</option>
            <option value="M">{t("creator.qr.levelM")}</option>
            <option value="Q">{t("creator.qr.levelQ")}</option>
            <option value="H">{t("creator.qr.levelH")}</option>
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="label mb-2 block">{t("creator.qr.color")}</label>
          <div className="flex gap-1.5">
            {COLORS.map((c, i) => (
              <button
                key={c.label}
                onClick={() => setColorIdx(i)}
                className={cn(
                  "h-9 flex-1 rounded-lg border-2 transition-all",
                  colorIdx === i ? "border-brand-600 ring-2 ring-brand-200" : "border-ink-200 dark:border-ink-700",
                )}
                style={{ backgroundColor: `#${c.bg}`, boxShadow: `inset 0 0 0 2px #${c.fg}` }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Preview + Actions */}
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-xl border-2 border-ink-200 bg-white p-4 dark:border-ink-700">
          {text ? (
            <img
              src={qrUrl}
              alt="Generated QR code"
              width={size}
              height={size}
              className="max-w-full h-auto"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center text-sm text-ink-400" style={{ width: size, height: size }}>
              <QrCode className="h-12 w-12 text-ink-300" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadPng} className="btn-primary" disabled={!text || downloading}>
            <Download className="h-4 w-4" />
            {t("creator.qr.downloadPng")}
          </button>
          <button onClick={handleDownloadSvg} className="btn-secondary" disabled={!text}>
            <FileCode className="h-4 w-4" />
            {t("creator.qr.downloadSvg")}
          </button>
          <button onClick={handleCopy} className={cn("btn-secondary")} disabled={!text}>
            {copied ? <Check className="h-4 w-4 text-success-600" /> : <Copy className="h-4 w-4" />}
            {copied ? t("tool.copied") : t("tool.copy")}
          </button>
        </div>
      </div>
    </div>
  );
}
