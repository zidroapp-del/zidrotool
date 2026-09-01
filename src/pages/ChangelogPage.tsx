import { useTranslation } from "react-i18next";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const ENTRIES = [
  { version: "1.0.0", date: "2026-08-01", changes: [
    "Launched ZidroTool with 19 tools across 8 categories",
    "Added dark mode with light/dark/system preferences",
    "Implemented instant search with Ctrl+K shortcut",
    "Added 6 language support including Arabic (RTL)",
    "Blog, pricing, dashboard, and 12 static pages",
    "PWA support with offline capabilities",
  ]},
  { version: "0.9.0", date: "2026-07-15", changes: [
    "Beta testing with invited users",
    "Performance optimizations and Lighthouse tuning",
  ]},
  { version: "0.5.0", date: "2026-06-01", changes: [
    "Initial tool development began",
    "Core infrastructure and design system established",
  ]},
];

export default function ChangelogPage() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t("changelog.title")} description={t("changelog.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("footer.links.changelog") }]} />
        <div className="mt-6 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("changelog.title")}</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("changelog.subtitle")}</p>
        </div>

        <div className="mt-8 max-w-3xl space-y-8">
          {ENTRIES.map((entry) => (
            <div key={entry.version} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="badge-brand">{entry.version}</span>
                <span className="text-sm text-ink-400 dark:text-ink-500">{entry.date}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {entry.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
