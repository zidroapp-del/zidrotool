import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  titleKey: string;
  subKey?: string;
  viewAllTo?: string;
  className?: string;
}

export function SectionHeader({ titleKey, subKey, viewAllTo, className }: SectionHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-100">
          {t(titleKey)}
        </h2>
        {subKey && (
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{t(subKey)}</p>
        )}
      </div>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="group flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          {t("section.viewAll")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
