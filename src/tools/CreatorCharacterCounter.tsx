import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Hash, Type, AlignLeft, FileText, Clock, Gauge } from "lucide-react";

interface Platform {
  name: string;
  key: string;
  limit: number;
  color: string;
  icon: string;
}

const PLATFORMS: Platform[] = [
  { name: "Twitter / X", key: "twitter", limit: 280, color: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300", icon: "🐦" },
  { name: "Instagram", key: "instagram", limit: 2200, color: "bg-danger/10 text-danger", icon: "📷" },
  { name: "TikTok", key: "tiktok", limit: 2200, color: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300", icon: "🎵" },
  { name: "Facebook", key: "facebook", limit: 63206, color: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400", icon: "👍" },
  { name: "YouTube", key: "youtube", limit: 5000, color: "bg-danger/10 text-danger", icon: "▶️" },
  { name: "LinkedIn", key: "linkedin", limit: 3000, color: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400", icon: "💼" },
];

export default function CreatorCharacterCounter() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [activePlatform, setActivePlatform] = useState("twitter");

  const stats = useMemo(() => {
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
    const lines = text ? text.split("\n").length : 0;
    const paragraphs = text.trim() ? text.split(/\n\n+/).filter((s) => s.trim()).length : 0;
    const readingTimeSec = Math.ceil((words / 200) * 60);
    return { chars, charsNoSpaces, words, sentences, lines, paragraphs, readingTimeSec };
  }, [text]);

  const activeLimit = PLATFORMS.find((p) => p.key === activePlatform)?.limit || 280;
  const remaining = activeLimit - stats.chars;
  const pct = Math.min(100, (stats.chars / activeLimit) * 100);
  const isOver = remaining < 0;

  const formatReadingTime = (sec: number) => {
    if (sec < 60) return `${sec} ${t("creator.counter.sec")}`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${min} ${t("creator.counter.min")} ${remSec} ${t("creator.counter.sec")}`;
  };

  const statCards = [
    { label: t("creator.counter.chars"), value: stats.chars, icon: Hash },
    { label: t("creator.counter.words"), value: stats.words, icon: Type },
    { label: t("creator.counter.sentences"), value: stats.sentences, icon: AlignLeft },
    { label: t("creator.counter.paragraphs"), value: stats.paragraphs, icon: FileText },
  ];

  return (
    <div>
      {/* Platform selector */}
      <div className="mb-4">
        <label className="label mb-2 block">{t("creator.counter.platform")}</label>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePlatform(p.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activePlatform === p.key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
              )}
            >
              <span className="mr-1">{p.icon}</span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Text input */}
      <div className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input min-h-[140px] resize-y"
          placeholder={t("creator.counter.placeholder")}
        />
      </div>

      {/* Live stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-ink-200 p-4 text-center dark:border-ink-700">
              <Icon className="mx-auto mb-2 h-5 w-5 text-ink-400" />
              <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{stat.value}</p>
              <p className="text-xs text-ink-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Reading time */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
        <Clock className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        <div className="flex-1">
          <p className="text-xs text-ink-400">{t("creator.counter.readingTime")}</p>
          <p className="text-lg font-bold text-ink-900 dark:text-ink-100">{formatReadingTime(stats.readingTimeSec)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-400">~200 wpm</p>
        </div>
      </div>

      {/* Platform limit progress */}
      <div className="rounded-xl border border-ink-200 p-4 dark:border-ink-700">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-ink-400" />
            <span className="text-sm font-medium text-ink-700 dark:text-ink-300">
              {PLATFORMS.find((p) => p.key === activePlatform)?.name}
            </span>
          </div>
          <span className={cn(
            "text-sm font-bold",
            isOver ? "text-danger" : remaining < 50 ? "text-warning-600" : "text-success-700 dark:text-success-600",
          )}>
            {isOver ? `${Math.abs(remaining)} ${t("creator.counter.over")}` : `${remaining} ${t("creator.counter.remaining")}`}
          </span>
        </div>
        <div className="mb-2 flex items-center justify-between text-xs text-ink-400">
          <span>{stats.chars} {t("creator.counter.chars")}</span>
          <span>{t("creator.counter.limit")}: {activeLimit.toLocaleString()}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isOver ? "bg-danger" : pct > 80 ? "bg-warning-500" : "bg-success-500",
            )}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        {isOver && (
          <p className="mt-2 text-xs font-medium text-danger">
            ⚠ {t("creator.counter.over")}
          </p>
        )}
      </div>
    </div>
  );
}
