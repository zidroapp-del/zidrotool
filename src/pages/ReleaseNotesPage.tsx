import { useTranslation } from "react-i18next";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";

interface ReleaseEntry {
  version: string;
  date: string;
  type: "feature" | "improvement" | "fix" | "security";
  titleKey: string;
  descKey: string;
}

const RELEASES: { version: string; date: string; highlights: ReleaseEntry[] }[] = [
  {
    version: SITE_CONFIG.version,
    date: "2026-08-01",
    highlights: [
      { version: "2.4.1", date: "2026-08-01", type: "feature", titleKey: "release.v241.f1", descKey: "release.v241.f1.desc" },
      { version: "2.4.1", date: "2026-08-01", type: "improvement", titleKey: "release.v241.f2", descKey: "release.v241.f2.desc" },
      { version: "2.4.1", date: "2026-08-01", type: "fix", titleKey: "release.v241.f3", descKey: "release.v241.f3.desc" },
    ],
  },
  {
    version: "2.4.0",
    date: "2026-07-15",
    highlights: [
      { version: "2.4.0", date: "2026-07-15", type: "feature", titleKey: "release.v240.f1", descKey: "release.v240.f1.desc" },
      { version: "2.4.0", date: "2026-07-15", type: "feature", titleKey: "release.v240.f2", descKey: "release.v240.f2.desc" },
      { version: "2.4.0", date: "2026-07-15", type: "security", titleKey: "release.v240.f3", descKey: "release.v240.f3.desc" },
    ],
  },
  {
    version: "2.3.0",
    date: "2026-06-28",
    highlights: [
      { version: "2.3.0", date: "2026-06-28", type: "feature", titleKey: "release.v230.f1", descKey: "release.v230.f1.desc" },
      { version: "2.3.0", date: "2026-06-28", type: "improvement", titleKey: "release.v230.f2", descKey: "release.v230.f2.desc" },
    ],
  },
  {
    version: "2.2.0",
    date: "2026-06-10",
    highlights: [
      { version: "2.2.0", date: "2026-06-10", type: "feature", titleKey: "release.v220.f1", descKey: "release.v220.f1.desc" },
      { version: "2.2.0", date: "2026-06-10", type: "fix", titleKey: "release.v220.f2", descKey: "release.v220.f2.desc" },
    ],
  },
];

const TYPE_META: Record<ReleaseEntry["type"], { labelKey: string; color: string }> = {
  feature: { labelKey: "release.type.feature", color: "bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-600" },
  improvement: { labelKey: "release.type.improvement", color: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400" },
  fix: { labelKey: "release.type.fix", color: "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600" },
  security: { labelKey: "release.type.security", color: "bg-danger-50 text-danger dark:bg-danger/15" },
};

export default function ReleaseNotesPage() {
  const { t, i18n } = useTranslation();

  return (
    <>
      <Seo title={t("release.title")} description={t("release.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("release.title") }]} />
        <div className="mt-6 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("release.title")}</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("release.subtitle")}</p>
        </div>

        <div className="mt-10 max-w-3xl">
          {RELEASES.map((release, ri) => (
            <div key={release.version} className="relative pb-10 last:pb-0">
              {ri < RELEASES.length - 1 && <div className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-ink-200 dark:bg-ink-700" />}
              <div className="flex items-center gap-4">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 bg-white dark:bg-ink-900">
                  <div className="h-3 w-3 rounded-full bg-brand-600" />
                </div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">v{release.version}</h2>
                  <span className="text-sm text-ink-400">{new Intl.DateTimeFormat(i18n.language, { year: "numeric", month: "long", day: "numeric" }).format(new Date(release.date))}</span>
                </div>
              </div>
              <div className="mt-4 space-y-3 pl-12">
                {release.highlights.map((h, hi) => {
                  const meta = TYPE_META[h.type];
                  return (
                    <div key={hi} className="card p-4">
                      <div className="flex items-start gap-3">
                        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase", meta.color)}>
                          {t(meta.labelKey)}
                        </span>
                        <div>
                          <p className="font-medium text-ink-900 dark:text-ink-100">{t(h.titleKey)}</p>
                          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t(h.descKey)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
