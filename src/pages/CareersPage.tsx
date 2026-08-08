import { useTranslation } from "react-i18next";
import { Briefcase, Mail } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function CareersPage() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t("careers.title")} description={t("careers.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("footer.links.careers") }]} />
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
            <Briefcase className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("careers.title")}</h1>
          <p className="mt-3 text-lg text-ink-500 dark:text-ink-400">{t("careers.subtitle")}</p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          <div className="card p-8 text-center">
            <p className="text-sm text-ink-600 dark:text-ink-400">{t("careers.empty")}</p>
            <a href={`mailto:${SITE_CONFIG.emails.careers}`} className="btn-primary mt-6">
              <Mail className="h-4 w-4" />
              {SITE_CONFIG.emails.careers}
            </a>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">Our Culture</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { title: "Remote First", desc: "Work from anywhere. We trust our team to deliver." },
              { title: "Quality Obsessed", desc: "We sweat the details that make products great." },
              { title: "Open & Transparent", desc: "Decisions are shared openly. Feedback is welcomed." },
              { title: "User Focused", desc: "Every decision starts with what's best for users." },
            ].map((v) => (
              <div key={v.title} className="card p-5">
                <h3 className="font-semibold text-ink-900 dark:text-ink-100">{v.title}</h3>
                <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
