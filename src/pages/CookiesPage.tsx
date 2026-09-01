import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Cookie, ShieldCheck, BarChart3, Megaphone, HardDrive, Mail, ExternalLink } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { SITE_CONFIG } from "@/lib/siteConfig";

const UPDATED = "2026-08-25";

export default function CookiesPage() {
  const { t } = useTranslation();

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: t("cookies.title"),
      description: t("cookies.seoDescription"),
      url: `${SITE_CONFIG.url}/cookies`,
      dateModified: UPDATED,
      isPartOf: { "@type": "WebSite", name: SITE_CONFIG.name, url: SITE_CONFIG.url },
    }),
    [t],
  );

  const categories = [
    [ShieldCheck, "cookies.summary.necessary.title", "cookies.summary.necessary.body"],
    [BarChart3, "cookies.summary.analytics.title", "cookies.summary.analytics.body"],
    [Megaphone, "cookies.summary.advertising.title", "cookies.summary.advertising.body"],
  ] as const;

  return (
    <>
      <Seo
        title={t("cookies.seoTitle")}
        description={t("cookies.seoDescription")}
        path="/cookies"
        jsonLd={jsonLd}
      />

      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("footer.links.cookies") }]} />

        <header className="relative mt-6 overflow-hidden rounded-3xl border border-ink-200 bg-gradient-to-br from-white via-brand-50/70 to-accent-50/50 p-8 dark:border-ink-800 dark:from-ink-950 dark:via-brand-950/30 dark:to-accent-950/20 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm dark:border-brand-800 dark:bg-ink-900/80 dark:text-brand-300">
              <Cookie className="h-3.5 w-3.5" />
              {t("cookies.eyebrow")}
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100 sm:text-5xl">{t("cookies.title")}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 dark:text-ink-300">{t("cookies.subtitle")}</p>
            <p className="mt-4 text-xs text-ink-400 dark:text-ink-500">{t("cookies.updated")}</p>
          </div>
        </header>

        <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-3">
          {categories.map(([Icon, titleKey, bodyKey]) => (
            <div key={titleKey} className="card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-semibold text-ink-900 dark:text-ink-100">{t(titleKey)}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">{t(bodyKey)}</p>
            </div>
          ))}
        </div>

        <article className="mx-auto mt-10 max-w-4xl space-y-8">
          <section className="card p-7 sm:p-9">
            <h2>1. {t("cookies.sections.what.title")}</h2>
            <p>{t("cookies.sections.what.body")}</p>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>2. {t("cookies.sections.necessary.title")}</h2>
            <p>{t("cookies.sections.necessary.body")}</p>
            <ul>
              <li>{t("cookies.sections.necessary.auth")}</li>
              <li>{t("cookies.sections.necessary.preferences")}</li>
              <li>{t("cookies.sections.necessary.consent")}</li>
            </ul>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>3. {t("cookies.sections.optional.title")}</h2>
            <p>{t("cookies.sections.optional.body")}</p>
            <ul>
              <li>{t("cookies.sections.optional.analytics")}</li>
              <li>{t("cookies.sections.optional.advertising")}</li>
            </ul>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>4. {t("cookies.sections.local.title")}</h2>
            <p>{t("cookies.sections.local.body")}</p>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>5. {t("cookies.sections.choices.title")}</h2>
            <p>{t("cookies.sections.choices.body")}</p>
            <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/60 p-5 dark:border-brand-900/60 dark:bg-brand-950/20">
              <p className="text-sm leading-6 text-ink-700 dark:text-ink-300">{t("cookies.sections.choices.note")}</p>
              <Link to="/privacy" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                {t("cookies.sections.choices.privacyLink")} <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>6. {t("cookies.sections.thirdParty.title")}</h2>
            <p>{t("cookies.sections.thirdParty.body")}</p>
          </section>

          <section className="card p-7 sm:p-9">
            <h2>7. {t("cookies.sections.updates.title")}</h2>
            <p>{t("cookies.sections.updates.body")}</p>
          </section>

          <section className="rounded-3xl bg-gradient-to-r from-brand-600 to-accent-600 p-7 text-white shadow-lg sm:p-9">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Mail className="h-5 w-5" /></div>
            <h2 className="mt-5 text-2xl font-bold">{t("cookies.contact.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">{t("cookies.contact.body")}</p>
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
