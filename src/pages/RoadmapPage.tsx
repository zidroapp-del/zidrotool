import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, Loader2, Circle } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type RoadmapStatus = "done" | "in-progress" | "planned";
interface RoadmapItem {
  titleKey: string;
  descKey: string;
  status: RoadmapStatus;
  quarter: string;
}
interface RoadmapPhase {
  phase: string;
  labelKey: string;
  items: RoadmapItem[];
}

const ROADMAP: RoadmapPhase[] = [
  {
    phase: "Q3 2026",
    labelKey: "roadmap.q3",
    items: [
      { titleKey: "roadmap.item.tempEmail", descKey: "roadmap.item.tempEmail.desc", status: "in-progress", quarter: "Q3 2026" },
      { titleKey: "roadmap.item.urlShort", descKey: "roadmap.item.urlShort.desc", status: "in-progress", quarter: "Q3 2026" },
      { titleKey: "roadmap.item.qrGen", descKey: "roadmap.item.qrGen.desc", status: "done", quarter: "Q3 2026" },
      { titleKey: "roadmap.item.apiV2", descKey: "roadmap.item.apiV2.desc", status: "planned", quarter: "Q3 2026" },
    ],
  },
  {
    phase: "Q4 2026",
    labelKey: "roadmap.q4",
    items: [
      { titleKey: "roadmap.item.fileShare", descKey: "roadmap.item.fileShare.desc", status: "planned", quarter: "Q4 2026" },
      { titleKey: "roadmap.item.passMgr", descKey: "roadmap.item.passMgr.desc", status: "planned", quarter: "Q4 2026" },
      { titleKey: "roadmap.item.linkBio", descKey: "roadmap.item.linkBio.desc", status: "planned", quarter: "Q4 2026" },
      { titleKey: "roadmap.item.teamCollab", descKey: "roadmap.item.teamCollab.desc", status: "planned", quarter: "Q4 2026" },
    ],
  },
  {
    phase: "Q1 2027",
    labelKey: "roadmap.q1",
    items: [
      { titleKey: "roadmap.item.aiTools", descKey: "roadmap.item.aiTools.desc", status: "planned", quarter: "Q1 2027" },
      { titleKey: "roadmap.item.webhooks", descKey: "roadmap.item.webhooks.desc", status: "planned", quarter: "Q1 2027" },
      { titleKey: "roadmap.item.enterprise", descKey: "roadmap.item.enterprise.desc", status: "planned", quarter: "Q1 2027" },
    ],
  },
];

const STATUS_META: Record<RoadmapStatus, { icon: React.ComponentType<{ className?: string }>; labelKey: string; color: string }> = {
  done: { icon: CheckCircle2, labelKey: "roadmap.status.done", color: "text-success-700 bg-success-50 dark:bg-success-700/20 dark:text-success-600" },
  "in-progress": { icon: Loader2, labelKey: "roadmap.status.progress", color: "text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400" },
  planned: { icon: Circle, labelKey: "roadmap.status.planned", color: "text-ink-500 bg-ink-100 dark:bg-ink-800 dark:text-ink-400" },
};

export default function RoadmapPage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo title={t("roadmap.title")} description={t("roadmap.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("roadmap.title") }]} />
        <div className="mt-6 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("roadmap.title")}</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("roadmap.subtitle")}</p>
        </div>

        <div className="mt-10">
          {ROADMAP.map((phase, pi) => (
            <div key={phase.phase} className="relative pb-12 last:pb-0">
              {/* Timeline line */}
              {pi < ROADMAP.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-ink-200 dark:bg-ink-700" />
              )}
              <div className="flex items-center gap-4">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 bg-white dark:bg-ink-900">
                  <div className="h-3 w-3 rounded-full bg-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{phase.phase}</h2>
                  <p className="text-sm text-ink-500 dark:text-ink-400">{t(phase.labelKey)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 pl-12 sm:grid-cols-2">
                {phase.items.map((item) => {
                  const meta = STATUS_META[item.status];
                  const Icon = meta.icon;
                  return (
                    <div key={item.titleKey} className="card p-5">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-ink-900 dark:text-ink-100">{t(item.titleKey)}</h3>
                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${meta.color}`}>
                          <Icon className={cn("h-3 w-3", item.status === "in-progress" && "animate-spin")} />
                          {t(meta.labelKey)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t(item.descKey)}</p>
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

import { cn } from "@/lib/utils";
