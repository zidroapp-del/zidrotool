import { useState } from "react";
import { Download, Loader2, Link2, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Toast";

interface VideoDownloaderProps {
  slug?: string;
  platform?: "facebook" | "tiktok" | "auto";
}

interface DownloadResult {
  downloadUrl?: string;
  title?: string;
  thumbnail?: string;
  filename?: string;
  provider?: string;
}

export default function VideoDownloader({
  slug,
  platform: requestedPlatform,
}: VideoDownloaderProps) {
  const platform: "facebook" | "tiktok" | "auto" =
    requestedPlatform ||
    (slug === "tiktok-downloader"
      ? "tiktok"
      : slug === "facebook-video-downloader"
      ? "facebook"
      : "auto");

  const { t } = useTranslation();
  const { error } = useToast();

  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);

  const submit = async () => {
    const value = url.trim();

    if (!value) {
      error(t("tool.error"));
      return;
    }

    setBusy(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/video-download?platform=${encodeURIComponent(
          platform
        )}&url=${encodeURIComponent(value)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.downloadUrl) {
        throw new Error(data.error || "Download service unavailable.");
      }

      setResult(data as DownloadResult);
    } catch (err) {
      console.error("Video download error:", err);

      error(
        err instanceof Error
          ? err.message
          : t("tool.videoDownloader.unavailable")
      );
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const value = url.trim();

    if (!value) {
      error(t("tool.error"));
      return;
    }

    const downloadUrl = `/api/download?url=${encodeURIComponent(
      value
    )}&platform=${encodeURIComponent(platform)}&download=1`;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download =
      result?.filename ||
      `${platform === "auto" ? "video" : platform}-video.mp4`;
    a.rel = "noopener noreferrer";

    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-ink-200 bg-ink-50/70 p-6 dark:border-ink-800 dark:bg-ink-900/50">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            <Video className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-ink-900 dark:text-ink-100">
              {platform === "auto"
                ? "Universal Video Downloader"
                : t(
                    platform === "tiktok"
                      ? "tool.tiktok-downloader.name"
                      : "tool.facebook-video-downloader.name"
                  )}
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {t("tool.videoDownloader.helper")}
            </p>
          </div>
        </div>

        <label
          className="mt-5 block text-sm font-medium text-ink-700 dark:text-ink-300"
          htmlFor={`${platform}-video-url`}
        >
          {t("tool.videoDownloader.urlLabel")}
        </label>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

            <input
              id={`${platform}-video-url`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void submit();
                }
              }}
              placeholder={t("tool.videoDownloader.urlPlaceholder")}
              className="input w-full pl-10"
              type="url"
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={busy || !url.trim()}
            className="btn-primary sm:min-w-36"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("tool.videoDownloader.processing")}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t("tool.videoDownloader.fetch")}
              </>
            )}
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-ink-400">
          {t("tool.videoDownloader.legal")}
        </p>
      </div>

      {result && (
        <div className="rounded-2xl border border-success-200 bg-success-50 p-5 dark:border-success-800 dark:bg-success-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {result.thumbnail ? (
              <img
                src={result.thumbnail}
                alt=""
                className="h-16 w-24 rounded-lg object-cover"
              />
            ) : (
              <Video className="h-8 w-8 text-success-700" />
            )}

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-success-800 dark:text-success-300">
                {result.title || t("tool.videoDownloader.ready")}
              </p>

              <p className="truncate text-sm text-success-700/80 dark:text-success-400/80">
                {result.filename || t("tool.videoDownloader.videoFile")}
                {result.provider ? ` · ${result.provider}` : ""}
              </p>
            </div>

            <button type="button" onClick={download} className="btn-primary">
              <Download className="h-4 w-4" />
              {t("tool.download")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}