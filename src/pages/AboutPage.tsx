import { useTranslation } from "react-i18next";
import { Shield, Eye, Heart, Zap, Users, Globe } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function AboutPage() {
  const { t } = useTranslation();
  const stats = [
    { value: "19+", label: t("hero.stat.tools") },
    { value: "2.4M+", label: t("hero.stat.users") },
    { value: "99.9%", label: t("hero.stat.uptime") },
    { value: "180+", label: t("hero.stat.countries") },
  ];
  const values = [
    { icon: Shield, text: t("about.value.privacy") },
    { icon: Eye, text: t("about.value.access") },
    { icon: Heart, text: t("about.value.quality") },
    { icon: Zap, text: t("about.value.open") },
  ];

  return (
    <>
      <Seo title={t("about.title")} description={t("about.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("nav.about") }]} />
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("about.title")}</h1>
          <p className="mt-3 text-lg text-ink-500 dark:text-ink-400">{t("about.subtitle")}</p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-8">
          <section className="card p-8">
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("about.mission.title")}</h2>
            <p className="prose-zt mt-3">{t("about.mission.body")}</p>
          </section>

          <section className="card p-8">
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("about.story.title")}</h2>
            <p className="prose-zt mt-3">{t("about.story.body")}</p>
          </section>

          <section className="card p-8">
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("about.values.title")}</h2>
            <ul className="mt-4 space-y-3">
              {values.map((v, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    <v.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-ink-700 dark:text-ink-300">{v.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("about.stats.title")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="card p-6 text-center">
                  <p className="text-3xl font-bold text-gradient">{s.value}</p>
                  <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{s.label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
