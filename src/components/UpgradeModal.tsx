import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Check, Crown, ArrowRight } from "lucide-react";
import { PRICING_PLANS, type PlanId } from "@/data/plans";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan?: PlanId;
  title?: string;
  description?: string;
}

export function UpgradeModal({ open, onClose, currentPlan = "free", title, description }: UpgradeModalProps) {
  const { t } = useTranslation();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  if (!open) return null;

  const upgradePlans = PRICING_PLANS.filter((p) => p.id !== "free");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-up dark:bg-ink-900">
        <div className="flex items-center justify-between border-b border-ink-100 p-5 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{title || t("upgrade.title")}</h2>
              <p className="text-sm text-ink-500 dark:text-ink-400">{description || t("upgrade.desc")}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label={t("common.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setCycle("monthly")} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", cycle === "monthly" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400")}>
              {t("premium.monthly")}
            </button>
            <button onClick={() => setCycle("yearly")} className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors", cycle === "yearly" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400")}>
              {t("premium.yearly")}
              <span className="rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-bold text-success-700 dark:bg-success-700/20 dark:text-success-600">{t("premium.yearly.save")}</span>
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {upgradePlans.map((plan) => (
              <div key={plan.id} className={cn("card p-4 text-center", plan.popular && "border-brand-500")}>
                {plan.popular && <span className="badge-brand mb-2">{t("premium.badge.popular")}</span>}
                <h3 className="font-bold text-ink-900 dark:text-ink-100">{t(plan.nameKey)}</h3>
                <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-100">
                  ${cycle === "monthly" ? plan.monthly : plan.yearly}
                  <span className="text-sm font-normal text-ink-500">{plan.monthly > 0 ? t("premium.perMonth") : ""}</span>
                </p>
                <ul className="mt-3 space-y-1.5 text-left">
                  {(plan.id === "pro" ? [t("premium.feat.ads"), t("premium.feat.ai"), t("premium.feat.favSync")] : plan.id === "business" ? [t("premium.feat.api"), t("premium.feat.seats") + " 5", t("premium.feat.sla")] : [t("premium.feat.sso"), t("premium.feat.seats") + " ∞", t("premium.feat.auditLog")]).map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-400">
                      <Check className="h-3 w-3 shrink-0 text-success-700 dark:text-success-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/pricing" onClick={onClose} className={cn("mt-4 w-full", plan.popular ? "btn-primary btn-sm" : "btn-secondary btn-sm")}>
                  {t(plan.ctaKey)}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-ink-400 dark:text-ink-500">{t("upgrade.note")}</p>
        </div>
      </div>
    </div>
  );
}
