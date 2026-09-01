import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LockKeyhole, ShieldCheck, Database, Cookie, Mail, ExternalLink } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function PrivacyPage() {
  const { t } = useTranslation();

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("privacy.title"),
    description: t("privacy.seoDescription"),
    url: `${SITE_CONFIG.url}/privacy`,
    dateModified: "2026-08-25",
    isPartOf: { "@type": "WebSite", name: SITE_CONFIG.name, url: SITE_CONFIG.url },
  }), [t]);

  return (
    <>
      <Seo title={t("privacy.seoTitle")} description={t("privacy.seoDescription")} path="/privacy" jsonLd={jsonLd} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("footer.links.privacy") }]} />

        <header className="relative mt-6 overflow-hidden rounded-3xl border border-ink-200 bg-gradient-to-br from-white via-brand-50/60 to-accent-50/50 p-8 dark:border-ink-800 dark:from-ink-950 dark:via-brand-950/30 dark:to-accent-950/20 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm dark:border-brand-800 dark:bg-ink-900/80 dark:text-brand-300">
              <LockKeyhole className="h-3.5 w-3.5" />
              {t("privacy.eyebrow")}
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100 sm:text-5xl">{t("privacy.title")}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 dark:text-ink-300">{t("privacy.subtitle")}</p>
            <p className="mt-4 text-xs text-ink-400 dark:text-ink-500">{t("privacy.updated")}</p>
          </div>
        </header>

        <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            [ShieldCheck, "privacy.summary.local.title", "privacy.summary.local.body"],
            [Database, "privacy.summary.account.title", "privacy.summary.account.body"],
            [Cookie, "privacy.summary.cookies.title", "privacy.summary.cookies.body"],
          ].map(([Icon, titleKey, bodyKey]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={titleKey as string} className="card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"><I className="h-5 w-5" /></div>
                <h2 className="mt-4 font-semibold text-ink-900 dark:text-ink-100">{t(titleKey as string)}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">{t(bodyKey as string)}</p>
              </div>
            );
          })}
        </div>

        <article className="mx-auto mt-10 max-w-4xl space-y-8">
          <section className="card p-7 sm:p-9">
            <h2>1. {t("privacy.sections.collect.title")}</h2>
            <p>{t("privacy.sections.collect.intro")}</p>
            <ul>
              <li>{t("privacy.sections.collect.account")}</li>
              <li>{t("privacy.sections.collect.preferences")}</li>
              <li>{t("privacy.sections.collect.analytics")}</li>
              <li>{t("privacy.sections.collect.toolData")}</li>
            </ul>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>2. {t("privacy.sections.use.title")}</h2>
            <p>{t("privacy.sections.use.body")}</p>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>3. {t("privacy.sections.storage.title")}</h2>
            <p>{t("privacy.sections.storage.body")}</p>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>4. {t("privacy.sections.cookies.title")}</h2>
            <p>{t("privacy.sections.cookies.body")}</p>
            <Link to="/cookies" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              {t("privacy.sections.cookies.link")} <ExternalLink className="h-4 w-4" />
            </Link>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>5. {t("privacy.sections.services.title")}</h2>
            <p>{t("privacy.sections.services.body")}</p>
            <ul>
              <li>{t("privacy.sections.services.supabase")}</li>
              <li>{t("privacy.sections.services.analytics")}</li>
              <li>{t("privacy.sections.services.external")}</li>
            </ul>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>6. {t("privacy.sections.rights.title")}</h2>
            <p>{t("privacy.sections.rights.body")}</p>
          </section>

          <section className="rounded-3xl bg-gradient-to-r from-brand-600 to-accent-600 p-7 text-white shadow-lg sm:p-9">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Mail className="h-5 w-5" /></div>
            <h2 className="mt-5 text-2xl font-bold">{t("privacy.contact.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">{t("privacy.contact.body")}</p>
            <a className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-white/90" href={`mailto:${SITE_CONFIG.emails.privacy}`}>
              {SITE_CONFIG.emails.privacy}
            </a>
          </section>
        </article>

        <div className="mt-12"><AdSlot variant="inline" /></div>
      </div>
    </>
  );
}
