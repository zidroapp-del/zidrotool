import { useTranslation } from "react-i18next";
import { Copy, Check, ShieldCheck, Lightbulb, Crop } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface SizeRow {
  elementKey: string;
  recommended: string;
  minUpload: string;
  ratio: string;
  safeZone: string;
}

const SIZE_DATA: SizeRow[] = [
  { elementKey: "creator.ytSize.thumb", recommended: "1280 × 720 px", minUpload: "640 × 360 px", ratio: "16:9", safeZone: "Center 80%" },
  { elementKey: "creator.ytSize.channelArt", recommended: "2560 × 1440 px", minUpload: "2048 × 1152 px", ratio: "16:9", safeZone: "1546 × 423 px" },
  { elementKey: "creator.ytSize.avatar", recommended: "800 × 800 px", minUpload: "250 × 250 px", ratio: "1:1", safeZone: "Full image" },
  { elementKey: "creator.ytSize.shorts", recommended: "1080 × 1920 px", minUpload: "720 × 1280 px", ratio: "9:16", safeZone: "Center 70%" },
  { elementKey: "creator.ytSize.bumper", recommended: "1280 × 720 px", minUpload: "640 × 360 px", ratio: "16:9", safeZone: "Center 85%" },
];

const PRACTICES = [
  { key: "creator.ytSize.practice1" },
  { key: "creator.ytSize.practice2" },
  { key: "creator.ytSize.practice3" },
  { key: "creator.ytSize.practice4" },
  { key: "creator.ytSize.practice5" },
];

export default function YtThumbnailSizeGuide() {
  const { t } = useTranslation();
  const { success } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      success(t("tool.copied"));
      setTimeout(() => setCopied(null), 2000);
    } catch { /* noop */ }
  };

  return (
    <div>
      {/* Table */}
      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-700">
              <th className="pb-3 pr-4">{t("creator.ytSize.element")}</th>
              <th className="pb-3 pr-4">{t("creator.ytSize.recommended")}</th>
              <th className="pb-3 pr-4">{t("creator.ytSize.minUpload")}</th>
              <th className="pb-3 pr-4">{t("creator.ytSize.aspectRatio")}</th>
              <th className="pb-3 pr-4">{t("creator.ytSize.safeZone")}</th>
              <th className="pb-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {SIZE_DATA.map((row) => (
              <tr key={row.elementKey} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                <td className="py-3 pr-4 font-medium text-ink-900 dark:text-ink-100">{t(row.elementKey)}</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-brand-50 px-2 py-0.5 text-xs font-mono font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                    {row.recommended}
                  </code>
                </td>
                <td className="py-3 pr-4 text-ink-500 dark:text-ink-400">{row.minUpload}</td>
                <td className="py-3 pr-4">
                  <span className="badge badge-brand text-[10px]">{row.ratio}</span>
                </td>
                <td className="py-3 pr-4 text-ink-500 dark:text-ink-400">{row.safeZone}</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => handleCopy(row.recommended)}
                    className={cn("btn btn-sm", copied === row.recommended ? "btn-primary" : "btn-secondary")}
                  >
                    {copied === row.recommended ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Safe Zone Visual */}
      <div className="mb-8">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
          <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          {t("creator.ytSize.safeZone")}
        </h3>
        <div className="relative mx-auto overflow-hidden rounded-xl border-2 border-ink-200 dark:border-ink-700" style={{ maxWidth: "640px", aspectRatio: "16/9" }}>
          {/* Full area */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30" />
          {/* Safe zone (center 80%) */}
          <div className="absolute border-2 border-dashed border-brand-500 bg-brand-500/10" style={{ top: "10%", left: "10%", right: "10%", bottom: "10%" }}>
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Crop className="mx-auto mb-2 h-6 w-6 text-brand-600 dark:text-brand-400" />
                <p className="text-xs font-medium text-brand-700 dark:text-brand-400">{t("creator.ytSize.safeZoneLabel")}</p>
                <p className="text-[10px] text-brand-600/70 dark:text-brand-500/70">1024 × 576 px</p>
              </div>
            </div>
          </div>
          {/* Edge labels */}
          <div className="absolute top-1 left-2 text-[10px] text-ink-400">{t("creator.ytSize.fullImage")}</div>
        </div>
        <p className="mt-2 text-center text-xs text-ink-400">{t("creator.ytSize.safeZoneDesc")}</p>
      </div>

      {/* Best Practices */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
          <Lightbulb className="h-4 w-4 text-warning-500" />
          {t("creator.ytSize.bestPractices")}
        </h3>
        <div className="space-y-2">
          {PRACTICES.map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-ink-200 p-3 dark:border-ink-700">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {i + 1}
              </div>
              <p className="text-sm text-ink-600 dark:text-ink-400">{t(p.key)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
