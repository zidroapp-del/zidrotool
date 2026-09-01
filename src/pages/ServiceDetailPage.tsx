import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ArrowLeft, Clock, Sparkles, Crown, Code2, Lock } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Newsletter } from "@/components/Newsletter";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ONLINE_SERVICES, getService } from "@/data/services";
import { useState } from "react";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const service = slug ? getService(slug) : undefined;
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!service) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-ink-500">{t("service.notFound")}</p>
        <Link to="/services" className="btn-primary mt-4">{t("service.back")}</Link>
      </div>
    );
  }

  const Icon = getIcon(service.icon);

  const apiExample = `// Future API usage
fetch("https://api.zidrotool.com/v1/${service.slug}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ data: "..." })
})
  .then(res => res.json())
  .then(data => console.log(data));`;

  return (
    <>
      <Seo title={t(service.nameKey)} description={t(service.descKey)} />
      <div className="container-page py-8">
        <Breadcrumbs items={[
          { label: t("service.title"), to: "/services" },
          { label: t(service.nameKey) },
        ]} />

        <Link to="/services" className="mt-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400">
          <ArrowLeft className="h-4 w-4" />
          {t("service.back")}
        </Link>

        {/* Hero */}
        <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center animate-slide-up">
          <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", service.gradient)}>
            <Icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t(service.nameKey)}</h1>
              {service.badge === "new" && <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-bold text-success-700 dark:bg-success-700/20 dark:text-success-600">NEW</span>}
              {service.badge === "soon" && <span className="rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-bold text-warning-700 dark:bg-warning-700/20 dark:text-warning-600">COMING SOON</span>}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-ink-500 dark:text-ink-400">{t(service.longDescKey)}</p>
          </div>
        </div>

        {/* Coming soon banner */}
        {service.comingSoon && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
            <Clock className="h-5 w-5 shrink-0 text-warning-700 dark:text-warning-600" />
            <p className="text-sm text-warning-800 dark:text-warning-400">{t("service.comingSoon")}</p>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Main content */}
          <div className="lg:col-span-8">
            {/* Features */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("service.features")}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {service.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-50 dark:bg-success-700/20">
                      <Check className="h-3.5 w-3.5 text-success-700 dark:text-success-600" />
                    </div>
                    <span className="text-sm text-ink-700 dark:text-ink-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works placeholder */}
            <div className="mt-6 card p-6">
              <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("service.howItWorks")}</h2>
              <div className="mt-4 space-y-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {step}
                    </div>
                    <div>
                      <p className="font-medium text-ink-900 dark:text-ink-100">{t(`service.step.${service.slug}.${step}.title`)}</p>
                      <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{t(`service.step.${service.slug}.${step}.desc`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* API preview */}
            <div className="mt-6 card p-6">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("service.apiPreview")}</h2>
              </div>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("service.apiPreview.desc")}</p>
              <pre className="mt-4 overflow-x-auto rounded-lg bg-ink-950 p-4 text-xs leading-relaxed text-ink-100">
                <code>{apiExample}</code>
              </pre>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Plan requirement */}
              <div className="card p-5">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{t("service.availability")}</h3>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500 dark:text-ink-400">{t("premium.plan.free")}</span>
                    <span className="badge-neutral text-xs">Limited</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500 dark:text-ink-400">{t("premium.plan.pro")}</span>
                    <span className="badge-brand text-xs">Full</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500 dark:text-ink-400">{t("premium.plan.business")}</span>
                    <span className="badge-brand text-xs">Full + API</span>
                  </div>
                </div>
                <button onClick={() => setShowUpgrade(true)} className="btn-primary btn-sm mt-4 w-full">
                  <Crown className="h-3.5 w-3.5" />
                  {t("premium.cta.pro")}
                </button>
              </div>

              {/* Other services */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{t("service.other")}</h3>
                <div className="mt-3 space-y-2">
                  {ONLINE_SERVICES.filter((s) => s.slug !== service.slug).slice(0, 4).map((s) => {
                    const SIcon = getIcon(s.icon);
                    return (
                      <Link key={s.slug} to={`/services/${s.slug}`} className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white", s.gradient)}>
                          <SIcon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{t(s.nameKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-12">
          <Newsletter />
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
