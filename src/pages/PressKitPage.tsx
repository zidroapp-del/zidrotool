import { useTranslation } from "react-i18next";
import { Download, Image, FileText, Globe, Palette, Newspaper, Mic, Camera, Mail } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function PressKitPage() {
  const { t } = useTranslation();

  const assets = [
    { icon: Image, titleKey: "press.logo.title", descKey: "press.logo.desc", formats: "SVG, PNG, PDF" },
    { icon: Palette, titleKey: "press.colors.title", descKey: "press.colors.desc", formats: "HEX, RGB, HSL" },
    { icon: FileText, titleKey: "press.boiler.title", descKey: "press.boiler.desc", formats: "TXT, DOCX" },
    { icon: Globe, titleKey: "press.icons.title", descKey: "press.icons.desc", formats: "SVG, PNG" },
  ];

  const resources = [
    { icon: Newspaper, titleKey: "press.media.title", descKey: "press.media.desc" },
    { icon: Mic, titleKey: "press.podcast.title", descKey: "press.podcast.desc" },
    { icon: Camera, titleKey: "press.screenshots.title", descKey: "press.screenshots.desc" },
  ];

  return (
    <>
      <Seo title={t("press.title")} description={t("press.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("press.title") }]} />
        <div className="mt-6 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("press.title")}</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("press.subtitle")}</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <span className="text-xl font-bold">Z</span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink-900 dark:text-ink-100">{SITE_CONFIG.name}</h2>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{SITE_CONFIG.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-ink-400">{t("press.founded")}</dt><dd className="font-medium text-ink-900 dark:text-ink-100">{SITE_CONFIG.founded}</dd></div>
              <div><dt className="text-ink-400">{t("press.headquarters")}</dt><dd className="font-medium text-ink-900 dark:text-ink-100">{SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}</dd></div>
              <div><dt className="text-ink-400">{t("press.website")}</dt><dd className="font-medium text-ink-900 dark:text-ink-100">{SITE_CONFIG.domain}</dd></div>
              <div><dt className="text-ink-400">{t("press.version")}</dt><dd className="font-medium text-ink-900 dark:text-ink-100">v{SITE_CONFIG.version}</dd></div>
            </dl>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("press.contact")}</h2>
            </div>
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">{t("press.contactDesc")}</p>
            <a href={`mailto:${SITE_CONFIG.emails.press}`} className="btn-primary btn-sm mt-4">{SITE_CONFIG.emails.press}</a>
          </div>
        </div>

        <h2 className="mt-12 text-xl font-bold text-ink-900 dark:text-ink-100">{t("press.brandAssets")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.titleKey} className="card card-hover group p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:scale-110 dark:bg-brand-900/30 dark:text-brand-400">
                <a.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-ink-900 dark:text-ink-100">{t(a.titleKey)}</h3>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{t(a.descKey)}</p>
              <p className="mt-2 text-xs font-medium text-ink-400">{a.formats}</p>
              <button className="btn-secondary btn-sm mt-4 w-full"><Download className="h-3.5 w-3.5" />{t("common.download")}</button>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-ink-900 dark:text-ink-100">{t("press.mediaResources")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {resources.map((r) => (
            <div key={r.titleKey} className="card card-hover p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-ink-900 dark:text-ink-100">{t(r.titleKey)}</h3>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t(r.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
