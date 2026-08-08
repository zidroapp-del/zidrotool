import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Copy, Check, AlertCircle, Zap } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface ExtractResult {
  id: string | null;
  handle: string | null;
  type: "channelId" | "handle" | "none";
}

function extractChannel(url: string): ExtractResult {
  const idMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (idMatch) return { id: idMatch[1], handle: null, type: "channelId" };

  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch) return { id: null, handle: handleMatch[1], type: "handle" };

  const customMatch = url.match(/youtube\.com\/(?:c|user)\/([a-zA-Z0-9_.-]+)/);
  if (customMatch) return { id: null, handle: customMatch[1], type: "handle" };

  return { id: null, handle: null, type: "none" };
}

export default function YtChannelId() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [urlError, setUrlError] = useState(false);
  const [copied, setCopied] = useState<"id" | "handle" | null>(null);

  const handleFind = () => {
    if (!url.trim()) {
      error(t("creator.yt.enterUrl"));
      setUrlError(true);
      return;
    }
    const res = extractChannel(url.trim());
    if (res.type === "none") {
      error(t("creator.yt.invalidChannel"));
      setUrlError(true);
      setResult(null);
      return;
    }
    setUrlError(false);
    setResult(res);
    success(res.id ? t("creator.yt.channelFound") : t("creator.yt.handleFound"));
  };

  const handleCopy = async (text: string, type: "id" | "handle") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      success(t("tool.copied"));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      error(t("tool.error"));
    }
  };

  return (
    <div>
      {/* URL Input */}
      <div className="mb-6">
        <label className="label mb-2 block">{t("creator.yt.channelUrlLabel")}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", urlError ? "text-danger" : "text-ink-400")} />
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleFind()}
              className={cn("input pl-10", urlError && "border-danger focus:border-danger")}
              placeholder="https://youtube.com/@channel or youtube.com/channel/UC..."
            />
          </div>
          <button onClick={handleFind} className="btn-primary shrink-0">
            <Search className="h-4 w-4" />
            {t("creator.yt.find")}
          </button>
        </div>
        {urlError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("creator.yt.invalidChannel")}
          </p>
        )}
        <p className="mt-2 text-xs text-ink-400">{t("creator.yt.channelHelp")}</p>
      </div>

      {/* Result */}
      {result && result.id ? (
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-6 dark:border-brand-800 dark:bg-brand-900/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{t("creator.yt.channelId")}</p>
          <div className="mt-3 flex items-center gap-3">
            <code className="flex-1 truncate rounded-lg bg-white px-4 py-3 font-mono text-sm font-bold text-ink-900 dark:bg-ink-900 dark:text-ink-100">
              {result.id}
            </code>
            <button onClick={() => handleCopy(result.id!, "id")} className={cn("btn shrink-0", copied === "id" ? "btn-primary" : "btn-secondary")}>
              {copied === "id" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "id" ? t("tool.copied") : t("tool.copy")}
            </button>
          </div>
        </div>
      ) : result && result.handle ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-200 p-6 dark:border-ink-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t("creator.yt.handle")}</p>
            <div className="mt-3 flex items-center gap-3">
              <code className="flex-1 truncate rounded-lg bg-ink-100 px-4 py-3 font-mono text-sm font-bold text-ink-900 dark:bg-ink-800 dark:text-ink-100">
                @{result.handle}
              </code>
              <button onClick={() => handleCopy(result.handle!, "handle")} className={cn("btn shrink-0", copied === "handle" ? "btn-primary" : "btn-secondary")}>
                {copied === "handle" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "handle" ? t("tool.copied") : t("tool.copy")}
              </button>
            </div>
          </div>
          {/* API Coming Soon note */}
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-50/50 p-4 dark:bg-warning-700/10">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
            <div>
              <p className="text-sm font-medium text-warning-700 dark:text-warning-600">{t("creator.channel.usesHandle")}</p>
              <p className="mt-1 text-xs text-warning-600/80 dark:text-warning-600/70">{t("creator.channel.apiNote")}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-ink-300 dark:text-ink-700" />
          <p className="mt-4 text-sm text-ink-400">{t("creator.yt.channelPlaceholder")}</p>
        </div>
      )}
    </div>
  );
}
