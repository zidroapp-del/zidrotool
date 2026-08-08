import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link2, Download, Copy, Check, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface ThumbSize {
  labelKey: string;
  key: string;
  w: number;
  h: number;
  estSize: string;
}

const SIZES: ThumbSize[] = [
  { labelKey: "creator.thumb.maxRes", key: "maxresdefault", w: 1280, h: 720, estSize: "~400KB" },
  { labelKey: "creator.thumb.sd", key: "sddefault", w: 640, h: 480, estSize: "~100KB" },
  { labelKey: "creator.thumb.hq", key: "hqdefault", w: 480, h: 360, estSize: "~50KB" },
  { labelKey: "creator.thumb.mq", key: "mqdefault", w: 320, h: 180, estSize: "~25KB" },
  { labelKey: "creator.thumb.default", key: "default", w: 120, h: 90, estSize: "~5KB" },
];

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export default function YtThumbnailDownloader() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleFetch = () => {
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
    setTimeout(() => setLoading(false), 600);
  };

  const handleDownload = async (size: ThumbSize) => {
    try {
      const res = await fetch(`https://img.youtube.com/vi/${videoId}/${size.key}.jpg`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `yt-thumbnail-${videoId}-${size.key}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
      success(t("creator.yt.downloading"));
    } catch {
      const link = document.createElement("a");
      link.href = `https://img.youtube.com/vi/${videoId}/${size.key}.jpg`;
      link.download = `yt-thumbnail-${videoId}-${size.key}.jpg`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
      success(t("creator.yt.downloading"));
    }
  };

  const handleCopyUrl = async (size: ThumbSize) => {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/${size.key}.jpg`;
    try {
      await navigator.clipboard.writeText(thumbUrl);
      setCopiedKey(size.key);
      success(t("tool.copied"));
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      error(t("tool.error"));
    }
  };

  const handleOpen = (size: ThumbSize) => {
    window.open(`https://img.youtube.com/vi/${videoId}/${size.key}.jpg`, "_blank", "noopener,noreferrer");
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
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              className={cn("input pl-10", urlError && "border-danger focus:border-danger")}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <button onClick={handleFetch} className="btn-primary shrink-0" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("creator.yt.fetch")}
          </button>
        </div>
        {urlError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("creator.yt.invalidUrl")}
          </p>
        )}
        {videoId && !loading && (
          <p className="mt-2 text-xs text-ink-400">
            {t("creator.thumb.vidIdFound")} <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-brand-600 dark:bg-ink-800 dark:text-brand-400">{videoId}</code>
          </p>
        )}
      </div>

      {/* Thumbnail Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : videoId ? (
        <div>
          <h3 className="mb-4 text-sm font-semibold text-ink-900 dark:text-ink-100">{t("creator.thumb.resolutions")}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SIZES.map((size) => (
              <div key={size.key} className="group overflow-hidden rounded-xl border border-ink-200 transition-all hover:border-brand-300 hover:shadow-md dark:border-ink-700 dark:hover:border-brand-700">
                {/* Preview */}
                <div className="relative aspect-video overflow-hidden bg-ink-100 dark:bg-ink-800">
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/${size.key}.jpg`}
                    alt={t(size.labelKey)}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.opacity = "0.2";
                      img.style.filter = "grayscale(1)";
                    }}
                  />
                  <div className="absolute top-2 left-2 rounded-md bg-ink-950/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {size.w}×{size.h}
                  </div>
                </div>

                {/* Info + Actions */}
                <div className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-900 dark:text-ink-100">{t(size.labelKey)}</span>
                    <span className="text-xs text-ink-400">{size.estSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => handleDownload(size)} className="btn btn-sm btn-primary">
                      <Download className="h-3 w-3" />
                      {t("creator.thumb.download")}
                    </button>
                    <button onClick={() => handleCopyUrl(size)} className={cn("btn btn-sm", copiedKey === size.key ? "btn-primary" : "btn-secondary")}>
                      {copiedKey === size.key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <button onClick={() => handleOpen(size)} className="btn btn-sm btn-secondary">
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Download className="h-12 w-12 text-ink-300 dark:text-ink-700" />
          <p className="mt-4 text-sm text-ink-400">{t("creator.thumb.noThumbnails")}</p>
        </div>
      )}
    </div>
  );
}
