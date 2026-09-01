import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, ShieldCheck, UserRound, CreditCard, Scale, RefreshCw, Mail } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { SITE_CONFIG } from "@/lib/siteConfig";

const sections = [
  [FileText, "terms.sections.accept"],
  [ShieldCheck, "terms.sections.use"],
  [UserRound, "terms.sections.accounts"],
  [CreditCard, "terms.sections.paid"],
  [Scale, "terms.sections.content"],
  [ShieldCheck, "terms.sections.availability"],
  [RefreshCw, "terms.sections.changes"],
] as const;

export default function TermsPage() {
  const { t } = useTranslation();

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("terms.title"),
    description: t("terms.seoDescription"),
    url: `${SITE_CONFIG.url}/terms`,
    dateModified: "2026-08-25",
    isPartOf: { "@type": "WebSite", name: SITE_CONFIG.name, url: SITE_CONFIG.url },
  }), [t]);

  return (
    <>
      <Seo title={t("terms.seoTitle")} description={t("terms.seoDescription")} path="/terms" jsonLd={jsonLd} />
      <div className="container-page py-8 pb-16">
        <Breadcrumbs items={[{ label: t("footer.links.terms") }]} />

        <header className="relative mt-6 overflow-hidden rounded-3xl border border-ink-200 bg-gradient-to-br from-white via-brand-50/60 to-accent-50/50 p-8 dark:border-ink-800 dark:from-ink-950 dark:via-brand-950/30 dark:to-accent-950/20 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm dark:border-brand-800 dark:bg-ink-900/80 dark:text-brand-300">
              <FileText className="h-3.5 w-3.5" />
              {t("terms.eyebrow")}
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100 sm:text-5xl">{t("terms.title")}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 dark:text-ink-300">{t("terms.subtitle")}</p>
            <p className="mt-4 text-xs text-ink-400 dark:text-ink-500">{t("terms.updated")}</p>
          </div>
        </header>

        <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-3">
          {[[ShieldCheck, "terms.summary.service"], [UserRound, "terms.summary.accounts"], [Scale, "terms.summary.responsibility"]].map(([Icon, key]) => {
            const I = Icon as typeof ShieldCheck;
            return <div key={key as string} className="card p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"><I className="h-5 w-5" /></div><h2 className="mt-4 font-semibold text-ink-900 dark:text-ink-100">{t(`${key}.title`)}</h2><p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">{t(`${key}.body`)}</p></div>;
          })}
        </div>

        <article className="mx-auto mt-10 max-w-4xl space-y-6">
          {sections.map(([Icon, key], index) => {
            const I = Icon as typeof FileText;
            return <section key={key} className="card p-7 sm:p-9"><div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"><I className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">{String(index + 1).padStart(2, "0")}</p><h2 className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-100">{t(`${key}.title`)}</h2></div></div><div className="mt-5 space-y-4 text-sm leading-7 text-ink-600 dark:text-ink-400"><p>{t(`${key}.body`)}</p>{key === "terms.sections.use" && <ul><li>{t("terms.sections.use.lawful")}</li><li>{t("terms.sections.use.abuse")}</li><li>{t("terms.sections.use.automation")}</li></ul>}</div></section>;
          })}

          <section className="card p-7 sm:p-9">
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("terms.sections.privacy.title")}</h2>
            <p className="mt-4 text-sm leading-7 text-ink-600 dark:text-ink-400">{t("terms.sections.privacy.body")}</p>
            <Link to="/privacy" className="mt-4 inline-flex font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">{t("terms.sections.privacy.link")}</Link>
          </section>

          <section className="rounded-3xl bg-gradient-to-r from-brand-600 to-accent-600 p-7 text-white shadow-lg sm:p-9">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Mail className="h-5 w-5" /></div>
            <h2 className="mt-5 text-2xl font-bold">{t("terms.contact.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">{t("terms.contact.body")}</p>
            <a className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-white/90" href={`mailto:${SITE_CONFIG.emails.legal}`}>{SITE_CONFIG.emails.legal}</a>
          </section>
        </article>
        <div className="mt-12"><AdSlot variant="inline" /></div>
      </div>
    </>
  );
}
