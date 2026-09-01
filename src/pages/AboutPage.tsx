import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Heart,
  LockKeyhole,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    { icon: LockKeyhole, title: t("about.value.privacy.title"), body: t("about.value.privacy.body") },
    { icon: Eye, title: t("about.value.access.title"), body: t("about.value.access.body") },
    { icon: Heart, title: t("about.value.quality.title"), body: t("about.value.quality.body") },
    { icon: Zap, title: t("about.value.open.title"), body: t("about.value.open.body") },
  ];

  const stats = useMemo(
    () => [
      { value: SITE_CONFIG.stats.tools, label: t("about.stats.tools") },
      { value: SITE_CONFIG.stats.categories, label: t("about.stats.categories") },
      { value: SITE_CONFIG.stats.languages, label: t("about.stats.languages") },
      { value: SITE_CONFIG.stats.countries, label: t("about.stats.countries") },
    ],
    [t],
  );

  const aboutJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: t("about.title"),
      description: t("about.subtitle"),
      url: `${SITE_CONFIG.url}/about`,
      mainEntity: {
        "@type": "Organization",
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        description: SITE_CONFIG.description,
      },
    }),
    [t],
  );

  return (
    <>
      <Seo
        title={t("about.seoTitle")}
        description={t("about.seoDescription")}
        path="/about"
        jsonLd={aboutJsonLd}
      />

      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("nav.about") }]} />

        <header className="relative mt-6 overflow-hidden rounded-3xl border border-ink-200 bg-gradient-to-br from-white via-brand-50/50 to-accent-50/40 p-8 dark:border-ink-800 dark:from-ink-950 dark:via-brand-950/30 dark:to-accent-950/20 sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-accent-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm dark:border-brand-800 dark:bg-ink-900/80 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t("about.eyebrow")}
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100 sm:text-5xl">
              {t("about.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600 dark:text-ink-300 sm:text-lg">
              {t("about.subtitle")}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/tools" className="btn-primary">
                <Wrench className="h-4 w-4" />
                {t("about.exploreTools")}
              </Link>
              <Link to="/contact" className="btn-secondary">
                {t("about.contactUs")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("about.stats.title")}>
          {stats.map((stat) => (
            <div key={stat.label} className="card p-6">
              <p className="text-3xl font-bold tracking-tight text-gradient">{stat.value}</p>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{stat.label}</p>
            </div>
          ))}
        </section>

        <div className="mx-auto mt-12 max-w-4xl space-y-8">
          <section className="card p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {t("about.mission.eyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-100">
              {t("about.mission.title")}
            </h2>
            <p className="prose-zt mt-4">{t("about.mission.body")}</p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="card p-7 sm:p-8">
              <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("about.how.title")}</h2>
              <p className="prose-zt mt-3">{t("about.how.body")}</p>
              <ul className="mt-5 space-y-3">
                {["about.how.one", "about.how.two", "about.how.three"].map((key) => (
                  <li key={key} className="flex gap-3 text-sm leading-6 text-ink-600 dark:text-ink-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-7 sm:p-8">
              <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("about.trust.title")}</h2>
              <p className="prose-zt mt-3">{t("about.trust.body")}</p>
              <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900/60 dark:bg-brand-950/30">
                <p className="text-sm font-medium text-brand-900 dark:text-brand-200">{t("about.trust.note")}</p>
              </div>
            </div>
          </section>

          <section className="card p-7 sm:p-8">
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("about.values.title")}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <div key={value.title} className="rounded-2xl border border-ink-200 bg-ink-50/70 p-5 dark:border-ink-800 dark:bg-ink-950/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-ink-900 dark:text-ink-100">{value.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">{value.body}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl bg-gradient-to-r from-brand-600 to-accent-600 p-8 text-white shadow-lg sm:p-10">
            <h2 className="text-2xl font-bold">{t("about.cta.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">{t("about.cta.body")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/tools" className="btn bg-white text-brand-700 hover:bg-white/90">
                {t("about.exploreTools")}
              </Link>
              <Link to="/contact" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
                {t("about.contactUs")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
