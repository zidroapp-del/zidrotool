import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Link2, Loader2, AlertCircle, Maximize2, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface ThumbSize {
  labelKey: string;
  key: string;
  w: number;
  h: number;
}

const SIZES: ThumbSize[] = [
  { labelKey: "creator.thumb.maxRes", key: "maxresdefault", w: 1280, h: 720 },
  { labelKey: "creator.thumb.sd", key: "sddefault", w: 640, h: 480 },
  { labelKey: "creator.thumb.hq", key: "hqdefault", w: 480, h: 360 },
  { labelKey: "creator.thumb.mq", key: "mqdefault", w: 320, h: 180 },
];

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export default function YtThumbnailViewer() {
  const { t } = useTranslation();
  const { error, success } = useToast();
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const handleView = () => {
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
    setTimeout(() => { setLoading(false); success(t("creator.yt.thumbnailsLoaded")); }, 500);
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
              onKeyDown={(e) => e.key === "Enter" && handleView()}
              className={cn("input pl-10", urlError && "border-danger focus:border-danger")}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <button onClick={handleView} className="btn-primary shrink-0" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {t("creator.yt.view")}
          </button>
        </div>
        {urlError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("creator.yt.invalidUrl")}
          </p>
        )}
      </div>

      {/* Preview Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : videoId ? (
        <div className="space-y-4">
          {SIZES.map((size) => (
            <div key={size.key} className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink-900 dark:text-ink-100">{t(size.labelKey)}</span>
                  <span className="badge badge-brand text-[10px]">{size.w}×{size.h}</span>
                </div>
                <button
                  onClick={() => setLightbox(`https://img.youtube.com/vi/${videoId}/${size.key}.jpg`)}
                  className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
              <div className="bg-ink-50 dark:bg-ink-900/50" style={{ aspectRatio: `${size.w}/${size.h}` }}>
                <img
                  src={`https://img.youtube.com/vi/${videoId}/${size.key}.jpg`}
                  alt={`${t(size.labelKey)} — ${size.w}×${size.h}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Eye className="h-12 w-12 text-ink-300 dark:text-ink-700" />
          <p className="mt-4 text-sm text-ink-400">{t("creator.yt.placeholder")}</p>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade-in" />
          <div className="relative z-10 max-h-[90vh] max-w-5xl">
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={lightbox} alt="Full size thumbnail" className="max-h-[90vh] w-auto rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
