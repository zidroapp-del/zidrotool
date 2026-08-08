import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, X, Sparkles, ChevronDown, Crown, ArrowRight } from "lucide-react";
import { Fragment } from "react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { UpgradeModal } from "@/components/UpgradeModal";
import { PRICING_PLANS, COMPARISON_GROUPS, type BillingCycle } from "@/data/plans";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const { t } = useTranslation();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const faqs = [
    { q: t("premium.faq.q1"), a: t("premium.faq.a1") },
    { q: t("premium.faq.q2"), a: t("premium.faq.a2") },
    { q: t("premium.faq.q3"), a: t("premium.faq.a3") },
    { q: t("premium.faq.q4"), a: t("premium.faq.a4") },
    { q: t("premium.faq.q5"), a: t("premium.faq.a5") },
    { q: t("premium.faq.q6"), a: t("premium.faq.a6") },
  ];

  const priceFor = (plan: typeof PRICING_PLANS[number]) => cycle === "monthly" ? plan.monthly : plan.yearly;

  const renderCellValue = (val: string | boolean) => {
    if (val === true) return <Check className="mx-auto h-4 w-4 text-success-700 dark:text-success-600" />;
    if (val === false) return <X className="mx-auto h-4 w-4 text-ink-300 dark:text-ink-600" />;
    return <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{val}</span>;
  };

  return (
    <>
      <Seo title={t("premium.title")} description={t("premium.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("nav.pricing") }]} />

        {/* Hero */}
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t("premium.subtitle")}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl dark:text-ink-100">{t("premium.title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 dark:text-ink-400">{t("premium.hero.desc")}</p>

          {/* Billing toggle */}
          <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-ink-200 p-1 dark:border-ink-700">
            <button onClick={() => setCycle("monthly")} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", cycle === "monthly" ? "bg-brand-600 text-white" : "text-ink-600 dark:text-ink-400")}>
              {t("premium.monthly")}
            </button>
            <button onClick={() => setCycle("yearly")} className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors", cycle === "yearly" ? "bg-brand-600 text-white" : "text-ink-600 dark:text-ink-400")}>
              {t("premium.yearly")}
              <span className="rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-bold text-success-700 dark:bg-success-700/20 dark:text-success-600">{t("premium.yearly.save")}</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className={cn("card relative p-6 flex flex-col", plan.popular && "border-brand-500 shadow-glow dark:border-brand-500")}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                  {t("premium.badge.popular")}
                </span>
              )}
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white", plan.gradient)}>
                <Crown className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-ink-900 dark:text-ink-100">{t(plan.nameKey)}</h2>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{t(plan.descKey)}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink-900 dark:text-ink-100">${priceFor(plan)}</span>
                <span className="text-sm text-ink-500">{plan.monthly > 0 ? t("premium.perMonth") : ""}</span>
              </div>
              {plan.monthly > 0 && cycle === "yearly" && (
                <p className="mt-1 text-xs text-success-700 dark:text-success-600">{t("premium.yearly.save")}</p>
              )}
              {plan.id === "free" ? (
                <Link to="/tools" className="btn-secondary mt-5 w-full">{t(plan.ctaKey)}</Link>
              ) : plan.id === "enterprise" ? (
                <Link to="/contact" className="btn-secondary mt-5 w-full">{t(plan.ctaKey)}</Link>
              ) : (
                <button onClick={() => setShowUpgrade(true)} className="btn-primary mt-5 w-full">
                  <Crown className="h-3.5 w-3.5" />
                  {t(plan.ctaKey)}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold text-ink-900 dark:text-ink-100">{t("premium.compare.title")}</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="border-b-2 border-ink-200 dark:border-ink-700">
                  <th className="py-4 pr-4 text-left text-sm font-semibold text-ink-900 dark:text-ink-100">{t("premium.compare.feature")}</th>
                  {PRICING_PLANS.map((plan) => (
                    <th key={plan.id} className={cn("py-4 px-3 text-center text-sm font-bold", plan.popular ? "text-brand-600 dark:text-brand-400" : "text-ink-900 dark:text-ink-100")}>
                      {t(plan.nameKey)}
                      {plan.popular && <span className="ml-1 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">★</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_GROUPS.map((group) => (
                  <Fragment key={group.labelKey}>
                    <tr className="bg-ink-50 dark:bg-ink-800/50">
                      <td colSpan={5} className="py-2 px-4 text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">{t(group.labelKey)}</td>
                    </tr>
                    {group.features.map((feature) => (
                      <tr key={feature.key} className="border-b border-ink-100 dark:border-ink-800">
                        <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300">{t(feature.key)}</td>
                        <td className="py-3 px-3 text-center">{renderCellValue(feature.free)}</td>
                        <td className="py-3 px-3 text-center">{renderCellValue(feature.pro)}</td>
                        <td className="py-3 px-3 text-center">{renderCellValue(feature.business)}</td>
                        <td className="py-3 px-3 text-center">{renderCellValue(feature.enterprise)}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-10"><AdSlot variant="inline" /></div>

        {/* FAQ */}
        <section className="mx-auto mt-12 max-w-2xl">
          <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-100">FAQ</h2>
          <div className="mt-6 space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between p-5 text-left">
                  <span className="font-medium text-ink-900 dark:text-ink-100">{faq.q}</span>
                  <ChevronDown className={cn("h-5 w-5 text-ink-400 transition-transform", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-ink-100 px-5 py-4 text-sm text-ink-600 dark:border-ink-800 dark:text-ink-400">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">{t("premium.cta.title")}</h2>
          <p className="mt-2 text-sm text-white/90">{t("premium.cta.desc")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button onClick={() => setShowUpgrade(true)} className="btn-primary bg-white text-brand-700 hover:bg-white/90">
              {t("premium.cta.pro")}
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link to="/contact" className="btn-secondary bg-transparent border-white/30 text-white hover:bg-white/10">
              {t("premium.cta.contact")}
            </Link>
          </div>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
