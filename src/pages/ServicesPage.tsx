import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles, Globe, Zap } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Newsletter } from "@/components/Newsletter";
import { ONLINE_SERVICES } from "@/data/services";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo title={t("service.title")} description={t("service.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("service.title") }]} />

        {/* Hero */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
            <Globe className="h-3.5 w-3.5" />
            {t("service.subtitle")}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl dark:text-ink-100">{t("service.title")}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-500 dark:text-ink-400">{t("service.hero.desc")}</p>
        </div>

        {/* Services grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ONLINE_SERVICES.map((service) => {
            const Icon = getIcon(service.icon);
            return (
              <Link key={service.slug} to={`/services/${service.slug}`} className="card card-hover group flex flex-col overflow-hidden">
                <div className={cn("flex h-28 items-center justify-center bg-gradient-to-br", service.gradient)}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-ink-900 group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400">{t(service.nameKey)}</h3>
                    {service.badge === "new" && <span className="rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-bold text-success-700 dark:bg-success-700/20 dark:text-success-600">NEW</span>}
                    {service.badge === "soon" && <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-bold text-warning-700 dark:bg-warning-700/20 dark:text-warning-600">SOON</span>}
                    {service.badge === "beta" && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-bold text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">BETA</span>}
                  </div>
                  <p className="mt-2 flex-1 text-sm text-ink-500 dark:text-ink-400">{t(service.descKey)}</p>
                  <div className="mt-3 flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
                    {t("service.explore")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* API-ready banner */}
        <div className="mt-12 rounded-2xl border border-ink-200 p-8 dark:border-ink-700">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("service.api.title")}</h2>
            <p className="max-w-xl text-sm text-ink-500 dark:text-ink-400">{t("service.api.desc")}</p>
            <div className="flex gap-3">
              <Link to="/api" className="btn-primary btn-sm">{t("service.api.learn")}</Link>
              <Link to="/pricing" className="btn-secondary btn-sm">{t("nav.pricing")}</Link>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Newsletter />
        </div>
      </div>
    </>
  );
}
