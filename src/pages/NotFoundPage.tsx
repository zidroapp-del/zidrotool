import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Search, Compass, Wrench, FileText, Globe } from "lucide-react";
import { Seo } from "@/components/Seo";
import { TOOLS } from "@/data/catalog";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const suggestions = TOOLS.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 6);

  return (
    <>
      <Seo title={t("page.404.title")} noIndex />
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <div className="relative">
          <p className="text-8xl font-bold text-gradient sm:text-9xl animate-slide-up">404</p>
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-full bg-brand-500/10 blur-3xl" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-ink-900 dark:text-ink-100">{t("page.404.title")}</h1>
        <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">{t("page.404.desc")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="btn-primary"><Home className="h-4 w-4" />{t("page.404.cta")}</Link>
          <Link to="/tools" className="btn-secondary"><Compass className="h-4 w-4" />{t("nav.tools")}</Link>
        </div>

        <div className="mt-12 w-full max-w-2xl">
          <p className="text-sm font-medium text-ink-400 dark:text-ink-500">{t("page.404.popular")}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {suggestions.map((tool) => (
              <Link key={tool.slug} to={`/tools/${tool.slug}`} className="card card-hover flex items-center gap-2 p-3 text-left">
                <Wrench className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                <span className="truncate text-sm font-medium text-ink-700 dark:text-ink-300">{t(tool.nameKey)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4 text-xs text-ink-400 dark:text-ink-500">
          <Link to="/blog" className="flex items-center gap-1 transition-colors hover:text-brand-600 dark:hover:text-brand-400"><FileText className="h-3.5 w-3.5" />{t("nav.blog")}</Link>
          <Link to="/services" className="flex items-center gap-1 transition-colors hover:text-brand-600 dark:hover:text-brand-400"><Globe className="h-3.5 w-3.5" />{t("nav.services")}</Link>
          <Link to="/contact" className="flex items-center gap-1 transition-colors hover:text-brand-600 dark:hover:text-brand-400"><Search className="h-3.5 w-3.5" />{t("nav.contact")}</Link>
        </div>
      </div>
    </>
  );
}
