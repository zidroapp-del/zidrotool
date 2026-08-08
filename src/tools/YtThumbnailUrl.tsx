import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link2, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface UrlEntry {
  labelKey: string;
  key: string;
  w: number;
  h: number;
}

const URL_SIZES: UrlEntry[] = [
  { labelKey: "creator.thumb.maxRes", key: "maxresdefault", w: 1280, h: 720 },
  { labelKey: "creator.thumb.sd", key: "sddefault", w: 640, h: 480 },
  { labelKey: "creator.thumb.hq", key: "hqdefault", w: 480, h: 360 },
  { labelKey: "creator.thumb.mq", key: "mqdefault", w: 320, h: 180 },
  { labelKey: "creator.thumb.default", key: "default", w: 120, h: 90 },
];

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export default function YtThumbnailUrl() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleExtract = () => {
    if (!url.trim()) {
      error(t("creator.yt.enterUrl"));
      setUrlError(true);
      return;
    }
    const id = extractVideoId(url.trim());
    if (!id) {
      error(t("creator.yt.invalidUrl"));
      setUrlError(true);
      setVideoId(null);
      return;
    }
    setUrlError(false);
    setLoading(true);
    setVideoId(id);
    setTimeout(() => { setLoading(false); success(t("creator.yt.urlExtracted")); }, 400);
  };

  const handleCopy = async (thumbUrl: string, key: string) => {
    try {
      await navigator.clipboard.writeText(thumbUrl);
      setCopiedKey(key);
      success(t("tool.copied"));
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      error(t("tool.error"));
    }
  };

  return (
    <div>
      {/* URL Input */}
      <div className="mb-6">
        <label className="label mb-2 block">{t("creator.yt.urlLabel")}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", urlError ? "text-danger" : "text-ink-400")} />
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleExtract()}
              className={cn("input pl-10", urlError && "border-danger focus:border-danger")}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <button onClick={handleExtract} className="btn-primary shrink-0" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {t("creator.yt.extract")}
          </button>
        </div>
        {urlError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("creator.yt.invalidUrl")}
          </p>
        )}
      </div>

      {/* URL List */}
      {videoId && !loading ? (
        <div className="space-y-2">
          {URL_SIZES.map((entry) => {
            const thumbUrl = `https://img.youtube.com/vi/${videoId}/${entry.key}.jpg`;
            return (
              <div key={entry.key} className="flex items-center gap-3 rounded-lg border border-ink-200 p-3 transition-colors hover:border-brand-300 dark:border-ink-700 dark:hover:border-brand-700">
                {/* Mini thumbnail */}
                <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-ink-100 dark:bg-ink-800">
                  <img
                    src={thumbUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-900 dark:text-ink-100">{t(entry.labelKey)}</span>
                    <span className="text-[10px] text-ink-400">{entry.w}×{entry.h}</span>
                  </div>
                  <p className="truncate font-mono text-xs text-ink-400">{thumbUrl}</p>
                </div>

                {/* Copy */}
                <button
                  onClick={() => handleCopy(thumbUrl, entry.key)}
                  className={cn("btn btn-sm shrink-0", copiedKey === entry.key ? "btn-primary" : "btn-secondary")}
                >
                  {copiedKey === entry.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedKey === entry.key ? t("tool.copied") : t("creator.thumb.copyUrl")}
                </button>
              </div>
            );
          })}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Link2 className="h-12 w-12 text-ink-300 dark:text-ink-700" />
          <p className="mt-4 text-sm text-ink-400">{t("creator.yt.placeholder")}</p>
        </div>
      )}
    </div>
  );
}
