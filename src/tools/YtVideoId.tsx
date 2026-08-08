import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Video, Copy, Check, AlertCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export default function YtVideoId() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState(false);
  const [copied, setCopied] = useState(false);

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
    setVideoId(id);
    success(t("creator.yt.videoIdExtracted"));
  };

  const handleCopy = async () => {
    if (!videoId) return;
    try {
      await navigator.clipboard.writeText(videoId);
      setCopied(true);
      success(t("tool.copied"));
      setTimeout(() => setCopied(false), 2000);
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
            <Video className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", urlError ? "text-danger" : "text-ink-400")} />
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleExtract()}
              className={cn("input pl-10", urlError && "border-danger focus:border-danger")}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <button onClick={handleExtract} className="btn-primary shrink-0">
            <ArrowRight className="h-4 w-4" />
            {t("creator.yt.extract")}
          </button>
        </div>
        {urlError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("creator.yt.invalidUrl")}
          </p>
        )}
        <p className="mt-2 text-xs text-ink-400">Supports: youtube.com/watch, youtu.be, /embed/, /shorts/, or raw 11-char ID</p>
      </div>

      {/* Result */}
      {videoId ? (
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-6 dark:border-brand-800 dark:bg-brand-900/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{t("creator.yt.videoId")}</p>
          <div className="mt-3 flex items-center gap-3">
            <code className="flex-1 truncate rounded-lg bg-white px-4 py-3 text-lg font-mono font-bold text-ink-900 dark:bg-ink-900 dark:text-ink-100">
              {videoId}
            </code>
            <button
              onClick={handleCopy}
              className={cn("btn shrink-0", copied ? "btn-primary" : "btn-secondary")}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("tool.copied") : t("tool.copy")}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline dark:text-brand-400">
              Open on YouTube →
            </a>
            <a href={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline dark:text-brand-400">
              View thumbnail →
            </a>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Video className="h-12 w-12 text-ink-300 dark:text-ink-700" />
          <p className="mt-4 text-sm text-ink-400">{t("creator.yt.placeholder")}</p>
        </div>
      )}
    </div>
  );
}
