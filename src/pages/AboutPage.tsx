import { useTranslation } from "react-i18next";
import { Shield, Eye, Heart, Zap } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function AboutPage() {
  const { t } = useTranslation();

  const stats = [
    { value: "70+", label: t("hero.stat.tools") },
    { value: "13", label: t("hero.stat.categories") },
    { value: "6", label: t("hero.stat.languages") },
    { value: "100%", label: t("hero.stat.free") },
  ];

  const values = [
    { icon: Shield, text: t("about.value.privacy") },
    { icon: Eye, text: t("about.value.access") },
    { icon: Heart, text: t("about.value.quality") },
    { icon: Zap, text: t("about.value.open") },
  ];

  return (
    <>
      <Seo
        title={t("about.title")}
        description={t("about.subtitle")}
      />

      <Breadcrumbs items={[{ label: t("nav.about") }]} />

      <div className="mx-auto max-w-5xl px-4 py-12">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-ink-900 dark:text-ink-100">
            {t("about.title")}
          </h1>

          <p className="prose-zt mx-auto mt-4 max-w-2xl">
            {t("about.subtitle")}
          </p>
        </header>

        <div className="mx-auto mt-12 max-w-3xl space-y-8">
          <section className="card p-8">
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">
              {t("about.mission.title")}
            </h2>

            <p className="prose-zt mt-3">
              {t("about.mission.body")}
            </p>
          </section>

          <section className="card p-8">
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">
              {t("about.story.title")}
            </h2>

            <p className="prose-zt mt-3">
              {t("about.story.body")}
            </p>
          </section>

          <section className="card p-8">
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">
              {t("about.values.title")}
            </h2>

            <ul className="mt-4 space-y-3">
              {values.map((v, i) => {
                const Icon = v.icon;

                return (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                      <Icon className="h-4 w-4" />
                    </div>

                    <span className="text-sm text-ink-700 dark:text-ink-300">
                      {v.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">
              {t("about.stats.title")}
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="card p-6 text-center">
                  <p className="text-3xl font-bold text-gradient">
                    {s.value}
                  </p>

                  <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}