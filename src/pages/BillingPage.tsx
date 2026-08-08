import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CreditCard, Download, Crown, Check, Calendar, DollarSign } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/lib/auth";
import { UpgradeModal } from "@/components/UpgradeModal";
import { PRICING_PLANS, MOCK_INVOICES } from "@/data/plans";
import { formatDate, cn } from "@/lib/utils";

export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading) return <div className="container-page py-20 text-center text-ink-400">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/signin" replace />;

  const currentPlan = PRICING_PLANS[1];
  const recentInvoices = MOCK_INVOICES.slice(0, 3);

  return (
    <>
      <Seo title={t("billing.title")} noIndex />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("nav.dashboard"), to: "/dashboard" }, { label: t("billing.title") }]} />

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("billing.title")}</h1>

        {/* Current plan */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-500 dark:text-ink-400">{t("billing.currentPlan")}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-ink-900 dark:text-ink-100">{t(currentPlan.nameKey)}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">${currentPlan.monthly}{t("premium.perMonth")} · {t("premium.monthly")}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">${currentPlan.monthly}</p>
                <p className="text-xs text-ink-400">{t("billing.perMonth")}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => setShowUpgrade(true)} className="btn-primary btn-sm">{t("billing.upgrade")}</button>
              <button className="btn-secondary btn-sm">{t("billing.cancel")}</button>
            </div>
          </div>

          {/* Next billing date */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h3 className="font-semibold text-ink-900 dark:text-ink-100">{t("billing.nextCharge")}</h3>
            </div>
            <p className="mt-3 text-2xl font-bold text-ink-900 dark:text-ink-100">{formatDate("2026-09-01", i18n.language)}</p>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">${currentPlan.monthly}.00 USD</p>
          </div>
        </div>

        {/* Payment method */}
        <div className="mt-6 card p-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="font-semibold text-ink-900 dark:text-ink-100">{t("billing.paymentMethod")}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-ink-200 p-4 dark:border-ink-700">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-12 items-center justify-center rounded bg-ink-900 text-xs font-bold text-white">VISA</div>
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-ink-100">•••• •••• •••• 4242</p>
                <p className="text-xs text-ink-400">Expires 12/2028</p>
              </div>
            </div>
            <button className="btn-ghost btn-sm">{t("billing.update")}</button>
          </div>
        </div>

        {/* Recent invoices */}
        <div className="mt-6 card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink-900 dark:text-ink-100">{t("billing.invoices")}</h3>
            <Link to="/dashboard/invoices" className="text-sm font-medium text-brand-600 dark:text-brand-400">{t("section.viewAll")}</Link>
          </div>
          <div className="mt-4 space-y-2">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3 dark:border-ink-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-600">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{inv.id}</p>
                    <p className="text-xs text-ink-400">{formatDate(inv.date, i18n.language)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("badge text-xs", inv.status === "paid" ? "badge-brand" : "badge-neutral")}>
                    {inv.status === "paid" && <Check className="h-3 w-3" />}
                    {t(`billing.status.${inv.status}`)}
                  </span>
                  <span className="text-sm font-medium text-ink-900 dark:text-ink-100">${inv.amount}.00</span>
                  <button className="text-ink-400 hover:text-brand-600" aria-label="Download">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} currentPlan="pro" />
    </>
  );
}
