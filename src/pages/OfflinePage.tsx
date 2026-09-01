import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WifiOff, RefreshCw, Home, Download } from "lucide-react";
import { Seo } from "@/components/Seo";

export default function OfflinePage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo title={t("page.offline.title")} noIndex />
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500 animate-pulse">
            <WifiOff className="h-10 w-10" />
          </div>
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-full bg-brand-500/5 blur-3xl" />
        </div>
        <h1 className="mt-8 text-2xl font-bold text-ink-900 dark:text-ink-100">{t("page.offline.title")}</h1>
        <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">{t("page.offline.desc")}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => window.location.reload()} className="btn-primary">
            <RefreshCw className="h-4 w-4" />
            {t("page.offline.retry")}
          </button>
          <Link to="/" className="btn-secondary">
            <Home className="h-4 w-4" />
            {t("page.404.cta")}
          </Link>
        </div>

        <div className="mt-8 max-w-md rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-900/50">
          <div className="flex items-center gap-2 text-left">
            <Download className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <p className="text-xs text-ink-500 dark:text-ink-400">{t("page.offline.pwa")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
