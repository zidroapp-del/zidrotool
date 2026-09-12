import { useState } from "react";
import { Download, Loader2, Link2, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Toast";

type VideoPlatform =
  | "facebook"
  | "tiktok"
  | "youtube"
  | "instagram"
  | "x"
  | "auto";

interface VideoDownloaderProps {
  slug?: string;
  platforms?: VideoPlatform[];
}

interface DownloadResult {
  downloadUrl?: string;
  title?: string;
  thumbnail?: string;
  filename?: string;
  provider?: string;
  author?: string;
  duration?: number | null;
  platform?: VideoPlatform;
}

function detectPlatformFromUrl(
  value: string
): VideoPlatform | null {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    // TikTok
    if (
      hostname === "tiktok.com" ||
      hostname.endsWith(".tiktok.com")
    ) {
      return "tiktok";
    }

    // YouTube
    if (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtu.be" ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    ) {
      return "youtube";
    }

    // Facebook
    if (
      hostname === "facebook.com" ||
      hostname.endsWith(".facebook.com") ||
      hostname === "fb.watch"
    ) {
      return "facebook";
    }

    // Instagram
    if (
      hostname === "instagram.com" ||
      hostname.endsWith(".instagram.com")
    ) {
      return "instagram";
    }

    // X / Twitter
    if (
      hostname === "x.com" ||
      hostname.endsWith(".x.com") ||
      hostname === "twitter.com" ||
      hostname.endsWith(".twitter.com")
    ) {
      return "x";
    }

    return null;
  } catch {
    return null;
  }
}

function getToolPrimaryPlatform(
  platforms?: VideoPlatform[]
): VideoPlatform {
  return platforms?.[0] || "auto";
}

function getToolTitle(
  platforms?: VideoPlatform[],
  t?: (key: string) => string
) {
  const primary = getToolPrimaryPlatform(platforms);

  switch (primary) {
    case "facebook":
      return t
        ? t("tool.facebook-video-downloader.name")
        : "Facebook Video Downloader";

    case "tiktok":
      return t
        ? t("tool.tiktok-downloader.name")
        : "TikTok Downloader";

    case "youtube":
      return t
        ? t("tool.videoDownloader.titleYoutube")
        : "YouTube Video Downloader";

    case "instagram":
      return t
        ? t("tool.videoDownloader.titleInstagram")
        : "Instagram Video Downloader";

    case "x":
      return t
        ? t("tool.videoDownloader.titleX")
        : "X Video Downloader";

    default:
      return t
        ? t("tool.videoDownloader.titleDefault")
        : "Video Downloader";
  }
}

export default function VideoDownloader({
  slug,
  platforms,
}: VideoDownloaderProps) {
  const { t } = useTranslation();
  const { error } = useToast();

  const primaryPlatform = getToolPrimaryPlatform(platforms);

  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] =
    useState<DownloadResult | null>(null);

  const allowedPlatforms =
    platforms && platforms.length > 0
      ? platforms
      : ["auto"];

  const validateAndDetectPlatform = (
    value: string
  ): VideoPlatform | null => {
    const detected = detectPlatformFromUrl(value);

    if (!detected) {
      return null;
    }

    if (
      allowedPlatforms.includes("auto") ||
      allowedPlatforms.includes(detected)
    ) {
      return detected;
    }

    return null;
  };

  const submit = async () => {
    const value = url.trim();

    if (!value) {
      error(t("tool.error"));
      return;
    }

    const detectedPlatform =
      validateAndDetectPlatform(value);

    if (!detectedPlatform) {
      if (
        primaryPlatform === "tiktok" &&
        allowedPlatforms.includes("youtube")
      ) {
        error(
          t("tool.videoDownloader.invalidUrlTiktokYoutube")
        );
      } else if (
        primaryPlatform === "facebook" &&
        allowedPlatforms.includes("instagram")
      ) {
        error(
          t("tool.videoDownloader.invalidUrlFacebookInstagram")
        );
      } else {
        error(t("tool.videoDownloader.invalidUrlGeneric"));
      }

      return;
    }

    setBusy(true);
    setResult(null);

    try {
      const params = new URLSearchParams({
        platform: detectedPlatform,
        url: value,
        download: "0",
      });

      const response = await fetch(
        `/api/video-download?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.downloadUrl) {
        throw new Error(
          data.error ||
            t("tool.videoDownloader.unavailable")
        );
      }

      setResult(data as DownloadResult);
    } catch (err) {
      console.error(
        "Video download error:",
        err
      );

      error(
        err instanceof Error
          ? err.message
          : t(
              "tool.videoDownloader.unavailable"
            )
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

    const detectedPlatform =
      validateAndDetectPlatform(value);

    if (!detectedPlatform) {
      error(t("tool.videoDownloader.invalidUrlGeneric"));
      return;
    }

    if (detectedPlatform === "youtube") {
      // YouTube video file downloads have been removed; only metadata
      // (title/author/duration/thumbnail) is offered for YouTube.
      return;
    }

    const params = new URLSearchParams({
      url: value,
      platform: detectedPlatform,
      download: "1",
    });

    const downloadUrl =
      `/api/video-download?${params.toString()}`;

    const a = document.createElement("a");

    a.href = downloadUrl;
    a.download =
      result?.filename ||
      `${detectedPlatform}-video.mp4`;

    a.rel = "noopener noreferrer";

    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const getSupportedText = () => {
    if (
      platforms?.includes("tiktok") &&
      platforms?.includes("youtube")
    ) {
      return t("tool.videoDownloader.supportsTiktokYoutube");
    }

    if (
      platforms?.includes("facebook") &&
      platforms?.includes("instagram")
    ) {
      return t("tool.videoDownloader.supportsFacebookInstagram");
    }

    return t(
      "tool.videoDownloader.helper"
    );
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
              {getToolTitle(platforms, t)}
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {getSupportedText()}
            </p>
          </div>
        </div>

        <label
          className="mt-5 block text-sm font-medium text-ink-700 dark:text-ink-300"
          htmlFor={`${slug || primaryPlatform}-video-url`}
        >
          {t(
            "tool.videoDownloader.urlLabel"
          )}
        </label>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

            <input
              id={`${slug || primaryPlatform}-video-url`}
              value={url}
              onChange={(e) =>
                setUrl(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void submit();
                }
              }}
              placeholder={
                platforms?.includes("tiktok") &&
                platforms?.includes("youtube")
                  ? t("tool.videoDownloader.placeholderTiktokYoutube")
                  : platforms?.includes("facebook") &&
                    platforms?.includes("instagram")
                  ? t("tool.videoDownloader.placeholderFacebookInstagram")
                  : t(
                      "tool.videoDownloader.urlPlaceholder"
                    )
              }
              className="input w-full pl-10"
              type="url"
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={
              busy || !url.trim()
            }
            className="btn-primary sm:min-w-36"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(
                  "tool.videoDownloader.processing"
                )}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t(
                  "tool.videoDownloader.fetch"
                )}
              </>
            )}
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-ink-400">
          {t(
            "tool.videoDownloader.legal"
          )}
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
                {result.title ||
                  t(
                    "tool.videoDownloader.ready"
                  )}
              </p>

              <p className="truncate text-sm text-success-700/80 dark:text-success-400/80">
                {result.filename ||
                  t(
                    "tool.videoDownloader.videoFile"
                  )}

                {result.provider
                  ? ` · ${result.provider}`
                  : ""}
              </p>

              {result.author && (
                <p className="mt-1 text-xs text-success-700/70 dark:text-success-400/70">
                  {result.author}
                </p>
              )}
            </div>

            {result.platform !== "youtube" && (
              <button
                type="button"
                onClick={download}
                className="btn-primary"
              >
                <Download className="h-4 w-4" />
                {t("tool.download")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}