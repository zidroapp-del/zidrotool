import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ListChecks, Copy, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

function extractPlaylistId(url: string): string | null {
  const m = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^(PL|OL|RD|UU|FL|LL)[a-zA-Z0-9_-]+$/.test(url)) return url;
  return null;
}

export default function YtPlaylistId() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [url, setUrl] = useState("");
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFind = () => {
    if (!url.trim()) {
      error(t("creator.yt.enterUrl"));
      setUrlError(true);
      return;
    }
    const id = extractPlaylistId(url.trim());
    if (!id) {
      error(t("creator.yt.invalidPlaylist"));
      setUrlError(true);
      setPlaylistId(null);
      return;
    }
    setUrlError(false);
    setPlaylistId(id);
    success(t("creator.yt.playlistFound"));
  };

  const handleCopy = async () => {
    if (!playlistId) return;
    try {
      await navigator.clipboard.writeText(playlistId);
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
        <label className="label mb-2 block">{t("creator.yt.playlistUrlLabel")}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ListChecks className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", urlError ? "text-danger" : "text-ink-400")} />
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleFind()}
              className={cn("input pl-10", urlError && "border-danger focus:border-danger")}
              placeholder="https://youtube.com/playlist?list=PL..."
            />
          </div>
          <button onClick={handleFind} className="btn-primary shrink-0">
            <ListChecks className="h-4 w-4" />
            {t("creator.yt.find")}
          </button>
        </div>
        {urlError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("creator.yt.invalidPlaylist")}
          </p>
        )}
        <p className="mt-2 text-xs text-ink-400">Supports: youtube.com/playlist?list=... or raw playlist ID (PL..., OL..., RD...)</p>
      </div>

      {/* Result */}
      {playlistId ? (
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-6 dark:border-brand-800 dark:bg-brand-900/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{t("creator.yt.playlistId")}</p>
          <div className="mt-3 flex items-center gap-3">
            <code className="flex-1 truncate rounded-lg bg-white px-4 py-3 text-lg font-mono font-bold text-ink-900 dark:bg-ink-900 dark:text-ink-100">
              {playlistId}
            </code>
            <button onClick={handleCopy} className={cn("btn shrink-0", copied ? "btn-primary" : "btn-secondary")}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("tool.copied") : t("tool.copy")}
            </button>
          </div>
          <div className="mt-4">
            <a href={`https://www.youtube.com/playlist?list=${playlistId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline dark:text-brand-400">
              Open playlist on YouTube →
            </a>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ListChecks className="h-12 w-12 text-ink-300 dark:text-ink-700" />
          <p className="mt-4 text-sm text-ink-400">{t("creator.yt.playlistPlaceholder")}</p>
        </div>
      )}
    </div>
  );
}
