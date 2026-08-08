import { useTranslation } from "react-i18next";
import { Handshake, Mail } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE_CONFIG } from "@/lib/siteConfig";

const PARTNERS = [
  { name: "TechCorp", desc: "Infrastructure partner" },
  { name: "EduPlatform", desc: "Education partner" },
  { name: "DevCommunity", desc: "Community partner" },
  { name: "CloudServices", desc: "Cloud partner" },
];

export default function PartnersPage() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t("partners.title")} description={t("partners.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("footer.links.partners") }]} />
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
            <Handshake className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("partners.title")}</h1>
          <p className="mt-3 text-lg text-ink-500 dark:text-ink-400">{t("partners.subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNERS.map((p) => (
            <div key={p.name} className="card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-xl font-bold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                {p.name[0]}
              </div>
              <h3 className="mt-4 font-semibold text-ink-900 dark:text-ink-100">{p.name}</h3>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href={`mailto:${SITE_CONFIG.emails.partners}`} className="btn-primary">
            <Mail className="h-4 w-4" />
            {SITE_CONFIG.emails.partners}
          </a>
        </div>
      </div>
    </>
  );
}
