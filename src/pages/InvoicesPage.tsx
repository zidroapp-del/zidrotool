import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, Check, FileText, Search } from "lucide-react";
import { useState } from "react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/lib/auth";
import { MOCK_INVOICES } from "@/data/plans";
import { formatDate, cn } from "@/lib/utils";

export default function InvoicesPage() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const [query, setQuery] = useState("");

  if (loading) return <div className="container-page py-20 text-center text-ink-400">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/signin" replace />;

  const filtered = MOCK_INVOICES.filter((inv) => inv.id.toLowerCase().includes(query.toLowerCase()) || inv.plan.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <Seo title={t("billing.invoices")} noIndex />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("nav.dashboard"), to: "/dashboard" }, { label: t("billing.invoices") }]} />

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("billing.invoices")}</h1>
          <Link to="/dashboard/billing" className="btn-secondary btn-sm">{t("billing.title")}</Link>
        </div>

        {/* Search */}
        <div className="mt-6 relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("billing.searchInvoices")} className="input pl-10" />
        </div>

        {/* Invoices table */}
        <div className="mt-6 card overflow-hidden">
          <table className="w-full">
            <thead className="bg-ink-50 dark:bg-ink-800/50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{t("billing.invoice.id")}</th>
                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{t("billing.invoice.date")}</th>
                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{t("billing.invoice.plan")}</th>
                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{t("billing.invoice.amount")}</th>
                <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{t("billing.invoice.status")}</th>
                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{t("billing.invoice.download")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-t border-ink-100 dark:border-ink-800">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-ink-400" />
                      <span className="text-sm font-medium text-ink-900 dark:text-ink-100">{inv.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-600 dark:text-ink-400">{formatDate(inv.date, i18n.language)}</td>
                  <td className="py-3 px-4 text-sm text-ink-600 dark:text-ink-400">{inv.plan}</td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-ink-900 dark:text-ink-100">${inv.amount}.00</td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn("badge text-xs", inv.status === "paid" ? "badge-brand" : "badge-neutral")}>
                      {inv.status === "paid" && <Check className="h-3 w-3" />}
                      {t(`billing.status.${inv.status}`)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-ink-400 transition-colors hover:text-brand-600" aria-label={`Download ${inv.id}`}>
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
