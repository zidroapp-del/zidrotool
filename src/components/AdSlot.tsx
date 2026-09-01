import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  variant?: "header" | "sidebar" | "inline" | "footer";
  className?: string;
}

export function AdSlot({ variant = "inline", className }: AdSlotProps) {
  const { t } = useTranslation();
  const label =
    variant === "header"
      ? t("ad.header")
      : variant === "sidebar"
        ? t("ad.sidebar")
        : variant === "footer"
          ? t("ad.footer")
          : t("ad.inline");

  const heights: Record<string, string> = {
    header: "min-h-[60px] sm:min-h-[90px]",
    sidebar: "min-h-[250px] sm:min-h-[300px]",
    inline: "min-h-[90px] sm:min-h-[120px]",
    footer: "min-h-[90px]",
  };

  return (
    <div
      className={cn(
        "group relative flex items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink-300/50 text-center transition-colors duration-300 hover:border-ink-400/50 dark:border-ink-700/60 dark:hover:border-ink-600/60",
        heights[variant],
        className,
      )}
      role="complementary"
      aria-label={t("ad.label")}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-ink-50/40 via-transparent to-ink-50/30 transition-opacity duration-300 group-hover:opacity-60 dark:from-ink-800/30 dark:to-ink-900/20" />
      <div className="relative px-4">
        <div className="mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-md border border-ink-300/50 text-[8px] font-bold uppercase tracking-wider text-ink-400 dark:border-ink-600/50 dark:text-ink-600">
          Ad
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-600">
          {t("ad.label")}
        </p>
        <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">{label}</p>
      </div>
    </div>
  );
}
