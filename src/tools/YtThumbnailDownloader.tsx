import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, Copy, Download, ExternalLink, ImageIcon, Link2, Loader2, Play } from "lucide-react";
import { useToast } from "@/components/Toast";
import { SeoToolShell, seoBtn, seoCard, seoField } from "@/components/SeoToolShell";

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

const ID = /^[a-zA-Z0-9_-]{11}$/;

function extractVideoId(value: string): string | null {
  const input = value.trim();
  if (ID.test(input)) return input;
  try {
    const u = new URL(input);
    const host = u.hostname.toLowerCase();
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be"].includes(host)) return null;
    const v = u.searchParams.get("v");
    if (v && ID.test(v)) return v;
    const match = u.pathname.match(/\/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    if (host.endsWith("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return ID.test(id || "") ? id : null;
    }
  } catch {
    return null;
  }
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
  // real pixel size of each image once loaded, and the sizes YouTube does not have for this video
  const [real, setReal] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<Record<string, boolean>>({});

  const imgUrl = (key: string) => `https://i.ytimg.com/vi/${videoId}/${key}.jpg`;

  const handleFetch = () => {
    if (!url.trim()) { error(t("creator.yt.enterUrl")); setUrlError(true); return; }
    const id = extractVideoId(url.trim());
    if (!id) { error(t("creator.yt.invalidUrl")); setUrlError(true); setVideoId(null); return; }
    setUrlError(false);
    setReal({});
    setMissing({});
    setLoading(true);
    setVideoId(id);
    setTimeout(() => setLoading(false), 500);
  };

  const handleDownload = async (size: ThumbSize) => {
    try {
      const apiUrl = `/api/youtube?action=thumbnail&videoId=${encodeURIComponent(videoId || "")}&size=${encodeURIComponent(size.key)}`;
      const res = await fetch(apiUrl, { headers: { accept: "image/jpeg,image/*" } });
      if (!res.ok) throw new Error(`Thumbnail request failed (${res.status})`);
      if (!(res.headers.get("content-type") || "").startsWith("image/")) throw new Error("Thumbnail response was not an image.");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `yt-thumbnail-${videoId}-${size.key}.jpg`;
      a.click();
      URL.revokeObjectURL(href);
      success(t("creator.yt.downloading"));
    } catch {
      const a = document.createElement("a");
      a.href = imgUrl(size.key);
      a.download = `yt-thumbnail-${videoId}-${size.key}.jpg`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
      success(t("creator.yt.downloading"));
    }
  };

  const handleCopyUrl = async (size: ThumbSize) => {
    try {
      await navigator.clipboard.writeText(imgUrl(size.key));
      setCopiedKey(size.key);
      success(t("tool.copied"));
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      error(t("tool.error"));
    }
  };

  const onLoad = (key: string, img: HTMLImageElement) => {
    // YouTube answers a missing "maxresdefault" with a tiny grey placeholder instead of a 404
    if (key === "maxresdefault" && img.naturalWidth <= 120) { setMissing((m) => ({ ...m, [key]: true })); return; }
    setReal((r) => ({ ...r, [key]: `${img.naturalWidth}×${img.naturalHeight}` }));
  };

  return (
    <SeoToolShell>
      <div className={`${seoCard} zseo-rise p-4 sm:p-6`}>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="zseo-ico grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30"><Play className="h-4 w-4 fill-white" /></span>
          <label htmlFor="thumb-url" className="text-sm font-bold text-slate-800 dark:text-slate-100">{t("creator.yt.urlLabel")}</label>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Link2 className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${urlError ? "text-rose-500" : "text-slate-400"}`} />
            <input
              id="thumb-url"
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              className={`${seoField} pl-11 ${urlError ? "!border-rose-400 focus:!ring-rose-500/15" : ""}`}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <button onClick={handleFetch} disabled={loading} className="zseo-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("creator.yt.fetch")}
          </button>
        </div>
        {urlError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-300"><AlertCircle className="h-3.5 w-3.5" />{t("creator.yt.invalidUrl")}</p>
        )}
        {videoId && !loading && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t("creator.thumb.vidIdFound")} <code className="rounded-md bg-indigo-100 px-1.5 py-0.5 font-mono text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{videoId}</code>
          </p>
        )}
      </div>

      {loading ? (
        <div className={`${seoCard} flex items-center justify-center p-14`}><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
      ) : videoId ? (
        <div className="space-y-4">
          <h3 className="px-1 text-sm font-bold text-slate-800 dark:text-slate-100">{t("creator.thumb.resolutions")}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SIZES.map((size, i) => {
              const gone = !!missing[size.key];
              return (
                <div key={size.key} style={{ ["--i" as any]: i }} className={`${seoCard} zseo-rise group overflow-hidden transition hover:-translate-y-1 ${gone ? "opacity-60" : ""}`}>
                  <div className="relative aspect-video overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <img
                      src={`/api/youtube?action=thumbnail&videoId=${videoId}&size=${size.key}`}
                      alt={t(size.labelKey)}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                      onLoad={(e) => onLoad(size.key, e.currentTarget)}
                      onError={(e) => { e.currentTarget.style.opacity = "0.2"; setMissing((m) => ({ ...m, [size.key]: true })); }}
                    />
                    <span className="absolute left-2 top-2 rounded-lg bg-slate-950/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">{real[size.key] || `${size.w}×${size.h}`}</span>
                  </div>
                  <div className="p-3.5">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{t(size.labelKey)}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{gone ? "Not available" : size.estSize}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => handleDownload(size)} disabled={gone} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                        <Download className="h-3.5 w-3.5" />{t("creator.thumb.download")}
                      </button>
                      <button onClick={() => handleCopyUrl(size)} disabled={gone} className={`${seoBtn} !px-3 !py-2`} aria-label="Copy image link">
                        {copiedKey === size.key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a href={imgUrl(size.key)} target="_blank" rel="noopener noreferrer" className={`${seoBtn} !px-3 !py-2 ${gone ? "pointer-events-none opacity-50" : ""}`} aria-label="Open image in a new tab">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {missing.maxresdefault && (
            <p className="px-1 text-xs text-slate-600 dark:text-slate-300">The 1280×720 version does not exist for this video (older or low-resolution uploads). Use the 640×480 or 480×360 size instead.</p>
          )}
        </div>
      ) : (
        <div className={`${seoCard} zseo-rise p-12 text-center`}>
          <span className="zseo-float mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/30"><ImageIcon className="h-6 w-6" /></span>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{t("creator.thumb.noThumbnails")}</p>
        </div>
      )}
    </SeoToolShell>
  );
}
