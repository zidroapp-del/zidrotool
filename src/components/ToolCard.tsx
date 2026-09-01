import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, ArrowUpRight, Flame, TrendingUp, Sparkles, Lock, Zap } from "lucide-react";
import type { Tool } from "@/types";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { getCategory } from "@/data/catalog";
import { getToolImage } from "@/data/toolImages";

const COLOR_MAP: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400",
  accent: "bg-accent-50 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400",
  success: "bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-600",
  warning: "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600",
  danger: "bg-danger-50 text-danger dark:bg-danger/15 dark:text-danger",
};

export function ToolCard({ tool, compact, variant = "default" }: { tool: Tool; compact?: boolean; variant?: "default" | "directory" }) {
  const { t, i18n } = useTranslation();
  const Icon = getIcon(tool.icon);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { success, info } = useToast();
  const fav = isFavorite(tool.slug);
  const catObj = getCategory(tool.category);
  const colorKey = catObj?.color || "brand";
  const [imageFailed, setImageFailed] = useState(false);

  if (variant === "directory") {
    return (
      <Link
        to={`/tools/${tool.slug}`}
        className="zt-directory-card group relative flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_8px_30px_-24px_rgba(35,25,15,.35)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_20px_45px_-24px_rgba(234,88,12,.28)] dark:border-ink-800 dark:bg-ink-900 dark:hover:border-orange-500/30"
      >
        <div className="relative h-36 overflow-hidden bg-orange-50 dark:bg-ink-800">
          {!imageFailed ? (
            <img
              src={getToolImage(tool)}
              alt={`${t(tool.nameKey)} illustration`}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100 text-orange-600 dark:from-orange-950/50 dark:via-ink-800 dark:to-rose-950/30 dark:text-orange-300">
              <Icon className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden="true" />
          <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/85 text-orange-600 shadow-lg backdrop-blur-sm dark:border-ink-700 dark:bg-ink-900/80 dark:text-orange-300">
            <Icon className="h-5 w-5" />
          </div>
          <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1">
            {tool.isNew && (
              <span className="zt-directory-badge bg-orange-50/95 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300">
                <Sparkles className="h-3 w-3" />
                {t("tool.new.badge")}
              </span>
            )}
            {tool.popular && !tool.isNew && (
              <span className="zt-directory-badge bg-white/90 text-amber-700 dark:bg-ink-900/85 dark:text-amber-300">
                <Flame className="h-3 w-3" />
                {t("tool.popular.badge")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-[17px] font-bold leading-snug text-ink-900 transition-colors group-hover:text-orange-600 dark:text-ink-100 dark:group-hover:text-orange-300">
            {t(tool.nameKey)}
          </h3>
          <p className="mt-2 line-clamp-3 text-[13px] leading-5 text-ink-500 dark:text-ink-400">
            {t(tool.descKey)}
          </p>

          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400 dark:text-ink-500">
              {tool.tags?.[0] || t("nav.tools")}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-orange-600 transition-transform group-hover:translate-x-0.5 dark:text-orange-300">
              {t("tool.use")}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="card card-hover zt-tool-shine group relative flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-ink-100 dark:bg-ink-900">
        {!imageFailed ? (
          <img
            src={getToolImage(tool)}
            alt={`${t(tool.nameKey)} illustration`}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500/15 via-accent-500/10 to-ink-100 text-brand-600 dark:from-brand-500/20 dark:via-accent-500/10 dark:to-ink-900 dark:text-brand-400",
          )}>
            <Icon className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/20 to-transparent" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2",
              COLOR_MAP[colorKey] || COLOR_MAP.brand,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {tool.popular && (
              <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300" title="Popular">
                <Flame className="h-3 w-3" />
                {t("tool.popular.badge")}
              </span>
            )}
            {tool.trending && !tool.popular && (
              <span className="badge bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300" title="Trending">
                <TrendingUp className="h-3 w-3" />
                {t("tool.trending.badge")}
              </span>
            )}
            {tool.isNew && (
              <span className="badge bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-600" title="New">
                <Sparkles className="h-3 w-3" />
                {t("tool.new.badge")}
              </span>
            )}
            {tool.premium && (
              <span className="badge bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600" title="Premium">
                <Lock className="h-3 w-3" />
                {t("tool.badge.premium")}
              </span>
            )}
            {!tool.implemented && !tool.premium && (
              <span className="badge bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400" title="Coming Soon">
                <Zap className="h-3 w-3" />
                {t("tool.comingSoon")}
              </span>
            )}
            {!compact && tool.addedAt && !tool.popular && !tool.trending && !tool.isNew && (
              <span className="hidden text-[10px] text-ink-400 sm:inline dark:text-ink-600">
                {formatDate(tool.addedAt, i18n.language)}
              </span>
            )}
          </div>
        </div>

        <h3 className="mt-4 font-semibold text-ink-900 transition-colors group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400">
          {t(tool.nameKey)}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          {t(tool.descKey)}
        </p>

        {tool.tags && tool.tags.length > 0 && !compact && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tool.tags.slice(0, 3).map((tag, index) => (
              <span key={`${tool.slug}-tag-${index}-${tag}`} className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(tool.slug);
              fav ? info(t("tool.favorite") + " — removed") : success(t("tool.favorited"));
            }}
            className={cn(
              "flex items-center gap-1 text-xs font-medium transition-colors",
              fav
                ? "text-warning-600 dark:text-warning-600"
                : "text-ink-400 hover:text-warning-600 dark:text-ink-500",
            )}
            aria-label={t("tool.favorite")}
            aria-pressed={fav}
          >
            <Star className={cn("h-4 w-4", fav && "fill-current")} />
          </button>
          <span className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
            {t("tool.use")}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );

}
