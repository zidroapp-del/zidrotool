import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const { t } = useTranslation();
  const full: Crumb[] = [{ label: t("breadcrumbs.home"), to: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: full.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: c.to ? `https://zidrotool.com${c.to}` : undefined,
    })),
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
        <ol className="flex flex-wrap items-center gap-1">
          {full.map((c, i) => {
            const last = i === full.length - 1;
            return (
              <li key={i} className="flex items-center gap-1">
                {c.to && !last ? (
                  <Link
                    to={c.to}
                    className="text-ink-500 transition-colors hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-medium text-ink-700 dark:text-ink-300" aria-current="page">
                    {c.label}
                  </span>
                )}
                {!last && (
                  <ChevronRight className="h-3.5 w-3.5 text-ink-300 ltr-flip dark:text-ink-600" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
