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

const COLOR_MAP: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400",
  accent: "bg-accent-50 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400",
  success: "bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-600",
  warning: "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600",
  danger: "bg-danger-50 text-danger dark:bg-danger/15 dark:text-danger",
};

export function ToolCard({ tool, compact }: { tool: Tool; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const Icon = getIcon(tool.icon);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { success, info } = useToast();
  const fav = isFavorite(tool.slug);
  const catObj = getCategory(tool.category);
  const colorKey = catObj?.color || "brand";

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="card card-hover group relative flex flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
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
          {tool.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
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
    </Link>
  );
}
