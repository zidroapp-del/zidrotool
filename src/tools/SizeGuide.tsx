import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Ruler } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface SizeEntry {
  name: string;
  w: number;
  h: number;
  ratio: string;
  use: string;
}

interface PlatformData {
  key: string;
  labelKey: string;
  emoji: string;
  entries: SizeEntry[];
}

const PLATFORMS: PlatformData[] = [
  {
    key: "instagram", labelKey: "creator.sizeGuide.instagram", emoji: "📷",
    entries: [
      { name: "Profile Photo", w: 320, h: 320, ratio: "1:1", use: "Profile picture" },
      { name: "Square Post", w: 1080, h: 1080, ratio: "1:1", use: "Feed post" },
      { name: "Portrait Post", w: 1080, h: 1350, ratio: "4:5", use: "Feed post (tall)" },
      { name: "Landscape Post", w: 1080, h: 566, ratio: "1.91:1", use: "Feed post (wide)" },
      { name: "Story / Reel", w: 1080, h: 1920, ratio: "9:16", use: "Story / Reel cover" },
      { name: "IGTV Cover", w: 420, h: 654, ratio: "1:1.56", use: "IGTV thumbnail" },
    ],
  },
  {
    key: "tiktok", labelKey: "creator.sizeGuide.tiktok", emoji: "🎵",
    entries: [
      { name: "Profile Photo", w: 200, h: 200, ratio: "1:1", use: "Profile picture" },
      { name: "Video", w: 1080, h: 1920, ratio: "9:16", use: "Standard video" },
      { name: "Ad Image", w: 1080, h: 1920, ratio: "9:16", use: "In-feed ad" },
      { name: "Carousel Ad", w: 1080, h: 1080, ratio: "1:1", use: "Carousel ad" },
    ],
  },
  {
    key: "facebook", labelKey: "creator.sizeGuide.facebook", emoji: "👍",
    entries: [
      { name: "Profile Photo", w: 170, h: 170, ratio: "1:1", use: "Profile picture" },
      { name: "Cover Photo", w: 820, h: 312, ratio: "2.63:1", use: "Page cover" },
      { name: "Shared Post", w: 1200, h: 630, ratio: "1.9:1", use: "Link preview / post" },
      { name: "Event Cover", w: 1920, h: 1080, ratio: "16:9", use: "Event header" },
      { name: "Group Cover", w: 1640, h: 856, ratio: "1.91:1", use: "Group banner" },
      { name: "Ad Image", w: 1080, h: 1080, ratio: "1:1", use: "Feed ad" },
    ],
  },
  {
    key: "youtube", labelKey: "creator.sizeGuide.youtube", emoji: "▶️",
    entries: [
      { name: "Video Thumbnail", w: 1280, h: 720, ratio: "16:9", use: "Video thumbnail" },
      { name: "Channel Avatar", w: 800, h: 800, ratio: "1:1", use: "Profile picture" },
      { name: "Channel Banner", w: 2560, h: 1440, ratio: "16:9", use: "Desktop banner" },
      { name: "Shorts Cover", w: 1080, h: 1920, ratio: "9:16", use: "Shorts cover" },
    ],
  },
  {
    key: "linkedin", labelKey: "creator.sizeGuide.linkedin", emoji: "💼",
    entries: [
      { name: "Profile Photo", w: 400, h: 400, ratio: "1:1", use: "Profile picture" },
      { name: "Cover Photo", w: 1584, h: 396, ratio: "4:1", use: "Profile banner" },
      { name: "Shared Post", w: 1200, h: 627, ratio: "1.91:1", use: "Post image" },
      { name: "Company Logo", w: 300, h: 300, ratio: "1:1", use: "Company page" },
      { name: "Company Cover", w: 1128, h: 191, ratio: "5.9:1", use: "Company banner" },
    ],
  },
  {
    key: "pinterest", labelKey: "creator.sizeGuide.pinterest", emoji: "📌",
    entries: [
      { name: "Profile Photo", w: 165, h: 165, ratio: "1:1", use: "Profile picture" },
      { name: "Standard Pin", w: 1000, h: 1500, ratio: "2:3", use: "Standard pin" },
      { name: "Square Pin", w: 1000, h: 1000, ratio: "1:1", use: "Square pin" },
      { name: "Board Cover", w: 600, h: 600, ratio: "1:1", use: "Board cover" },
      { name: "Story Pin", w: 1080, h: 1920, ratio: "9:16", use: "Story pin" },
    ],
  },
];

export default function SizeGuide({ slug }: { slug?: string }) {
  const { t } = useTranslation();
  const { success } = useToast();

  const isYtGuide = slug === "yt-thumbnail-size-guide";
  const defaultPlatform = isYtGuide ? "youtube" : "instagram";
  const [activePlatform, setActivePlatform] = useState(defaultPlatform);
  const [copied, setCopied] = useState<string | null>(null);

  const platform = PLATFORMS.find((p) => p.key === activePlatform) ?? PLATFORMS[0];

  const handleCopy = async (entry: SizeEntry) => {
    const text = `${entry.w}×${entry.h}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(entry.name);
      success(t("tool.copied"));
      setTimeout(() => setCopied(null), 2000);
    } catch { /* noop */ }
  };

  return (
    <div>
      {/* Platform selector */}
      <div className="mb-6">
        <p className="label mb-2 block">{t("creator.sizeGuide.platforms")}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePlatform(p.key)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                activePlatform === p.key
                  ? "border-brand-500 bg-brand-50 shadow-sm dark:border-brand-700 dark:bg-brand-900/20"
                  : "border-ink-200 hover:border-ink-300 dark:border-ink-700",
              )}
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className={cn(
                "text-xs font-medium",
                activePlatform === p.key ? "text-brand-700 dark:text-brand-400" : "text-ink-500 dark:text-ink-400",
              )}>
                {t(p.labelKey)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Size cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {platform.entries.map((entry) => {
          const isPortrait = entry.h > entry.w;
          const isSquare = entry.h === entry.w;
          const ratioStyle = isSquare
            ? { width: "48px", height: "48px" }
            : isPortrait
              ? { width: "32px", height: "48px" }
              : { width: "48px", height: "32px" };

          return (
            <div
              key={entry.name}
              className="group flex items-center gap-4 rounded-xl border border-ink-200 p-4 transition-all hover:border-brand-300 hover:shadow-sm dark:border-ink-700"
            >
              {/* Visual ratio indicator */}
              <div
                className="flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-400 to-accent-400 opacity-20 transition-opacity group-hover:opacity-40"
                style={ratioStyle}
              >
                <Ruler className="h-3 w-3 text-ink-600 opacity-0" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{entry.name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs font-mono text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                    {entry.w}×{entry.h}
                  </code>
                  <span className="text-xs text-ink-400">{entry.ratio}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-400">{entry.use}</p>
              </div>

              {/* Copy */}
              <button
                onClick={() => handleCopy(entry)}
                className={cn("btn btn-sm shrink-0", copied === entry.name ? "btn-primary" : "btn-secondary")}
              >
                {copied === entry.name ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
