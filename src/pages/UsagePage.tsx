import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Crown } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/lib/auth";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useState } from "react";
import { USAGE_METRICS } from "@/data/plans";
import { cn } from "@/lib/utils";

export default function UsagePage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading) return <div className="container-page py-20 text-center text-ink-400">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/signin" replace />;

  const pct = (used: number, limit: number) => Math.min(100, (used / limit) * 100);
  const isUnlimited = (limit: number) => limit >= 999;

  return (
    <>
      <Seo title={t("usage.title")} noIndex />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("nav.dashboard"), to: "/dashboard" }, { label: t("usage.title") }]} />

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("usage.title")}</h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t("usage.subtitle")}</p>
          </div>
          <button onClick={() => setShowUpgrade(true)} className="btn-primary btn-sm">
            <Crown className="h-3.5 w-3.5" />
            {t("usage.upgrade")}
          </button>
        </div>

        {/* Plan banner */}
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-white/80">{t("billing.currentPlan")}</p>
              <p className="text-lg font-bold">{t("premium.plan.pro")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80">{t("usage.resetDate")}</p>
            <p className="font-semibold">Sept 1, 2026</p>
          </div>
        </div>

        {/* Usage metrics */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {USAGE_METRICS.map((metric) => {
            const unlimited = isUnlimited(metric.limit);
            const percentage = pct(metric.used, metric.limit);
            const isNear = !unlimited && percentage >= 80;
            return (
              <div key={metric.labelKey} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{t(metric.labelKey)}</p>
                  {isNear && <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-bold text-warning-700 dark:bg-warning-700/20 dark:text-warning-600">{t("usage.nearLimit")}</span>}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-ink-900 dark:text-ink-100">{metric.used}{metric.unit}</span>
                  <span className="text-sm text-ink-400">/ {unlimited ? "∞" : `${metric.limit}${metric.unit}`}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                  <div className={cn("h-full rounded-full transition-all duration-500", unlimited ? "bg-success-600" : isNear ? "bg-warning-600" : "bg-brand-600")} style={{ width: unlimited ? "30%" : `${percentage}%` }} />
                </div>
                {unlimited && <p className="mt-2 text-xs text-success-700 dark:text-success-600">{t("usage.unlimited")}</p>}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-ink-200 p-6 dark:border-ink-700">
          <div>
            <p className="font-semibold text-ink-900 dark:text-ink-100">{t("usage.needMore")}</p>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t("usage.needMore.desc")}</p>
          </div>
          <button onClick={() => setShowUpgrade(true)} className="btn-primary btn-sm">
            {t("usage.upgrade")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} currentPlan="pro" />
    </>
  );
}
