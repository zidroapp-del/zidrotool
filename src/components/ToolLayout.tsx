import { useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Star,
  Share2,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  HelpCircle,
  ListChecks,
  Wrench,
  Flag,
  Clock,
  TrendingUp,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { ToolCard } from "@/components/ToolCard";
import { getTool, getRelatedTools, getCategory, getPopularTools } from "@/data/catalog";
import { getIcon } from "@/lib/icons";
import { useFavorites } from "@/lib/favorites";
import { useHistory } from "@/lib/history";
import { copyToClipboard, cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface ToolLayoutProps {
  children: React.ReactNode;
  output: string;
  onReset: () => void;
  howToSteps: { titleKey: string; descKey: string }[];
  faqs: { qKey: string; aKey: string }[];
  seoTitle?: string;
  seoDescription?: string;
  sampleInput?: string;
  onLoadSample?: () => void;
}

export function ToolLayout({
  children,
  output,
  onReset,
  howToSteps,
  faqs,
  seoTitle,
  seoDescription,
}: ToolLayoutProps) {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tool = slug ? getTool(slug) : undefined;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { history, addHistory } = useHistory();
  const { success, error, info } = useToast();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<"idle" | "loading" | "done">("idle");

  const fav = tool ? isFavorite(tool.slug) : false;
  const cat = tool ? getCategory(tool.category) : undefined;
  const related = tool ? getRelatedTools(tool, 4) : [];
  const popular = getPopularTools(4);
  const Icon = tool ? getIcon(tool.icon) : Wrench;

  const recentTools = useMemo(
    () => history.slice(0, 4).map((h) => getTool(h.slug)).filter(Boolean).filter((t2) => t2!.slug !== slug),
    [history, slug],
  );

  const toolJsonLd = useMemo(
    () =>
      tool
        ? {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: t(tool.nameKey),
            description: t(tool.descKey),
            applicationCategory: "Utilities",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }
        : {},
    [tool, t],
  );

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: t(f.qKey),
        acceptedAnswer: { "@type": "Answer", text: t(f.aKey) },
      })),
    }),
    [faqs, t],
  );

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const ok = await copyToClipboard(output);
    if (ok) {
      setCopied(true);
      success(t("tool.copied"));
      setTimeout(() => setCopied(false), 2000);
    } else {
      error(t("tool.error"));
    }
  }, [output, success, error, t]);

  const handleShare = useCallback(async () => {
    if (!tool) return;
    const url = window.location.href;
    const ok = await copyToClipboard(url);
    if (ok) {
      setShared(true);
      success(t("tool.share.copied"));
      setTimeout(() => setShared(false), 2000);
    }
  }, [tool, success, t]);

  const handleReset = useCallback(() => {
    onReset();
    info(t("tool.reset"));
  }, [onReset, info, t]);

  const handleReport = useCallback(() => {
    setReportStatus("loading");
    setTimeout(() => {
      setReportStatus("done");
      success(t("tool.report.success"));
      setTimeout(() => {
        setReportOpen(false);
        setReportStatus("idle");
      }, 1500);
    }, 1000);
  }, [success, t]);

  if (!tool) {
    navigate("/404");
    return null;
  }

  useState(() => {
    addHistory({ slug: tool.slug, name: t(tool.nameKey), ts: Date.now() });
  });

  return (
    <>
      <Seo
        title={seoTitle || t(tool.nameKey)}
        description={seoDescription || t(tool.descKey)}
        jsonLd={[toolJsonLd, faqJsonLd]}
      />

      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: t("breadcrumbs.tools"), to: "/tools" },
            ...(cat ? [{ label: t(cat.nameKey), to: `/category/${cat.slug}` }] : []),
            { label: t(tool.nameKey) },
          ]}
        />

        {/* Tool hero */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-sm">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-100">
                {t(tool.nameKey)}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-ink-500 dark:text-ink-400">
                {t(tool.descKey)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={() => {
                toggleFavorite(tool.slug);
                fav ? info(t("tool.favorite") + " — removed") : success(t("tool.favorited"));
              }}
              className={cn(
                "btn btn-sm",
                fav
                  ? "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600"
                  : "btn-secondary btn-sm",
              )}
              aria-pressed={fav}
            >
              <Star className={cn("h-4 w-4", fav && "fill-current")} />
              <span className="hidden sm:inline">{t("tool.favorite")}</span>
            </button>
            <button onClick={handleShare} className="btn-secondary btn-sm">
              {shared ? <Check className="h-4 w-4 text-success-700" /> : <Share2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{shared ? t("tool.share.copied") : t("tool.share")}</span>
            </button>
            <button onClick={handleReset} className="btn-secondary btn-sm">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tool.reset")}</span>
            </button>
            <button onClick={() => setReportOpen(true)} className="btn-ghost btn-sm" aria-label={t("tool.report")}>
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tool.report")}</span>
            </button>
          </div>
        </div>

        {/* Tool body */}
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="card p-6">
              {children}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <AdSlot variant="sidebar" />

              {/* Related tools */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                  {t("tool.related")}
                </h3>
                <div className="mt-3 space-y-2">
                  {related.map((rt) => {
                    const RIcon = getIcon(rt.icon);
                    return (
                      <Link
                        key={rt.slug}
                        to={`/tools/${rt.slug}`}
                        className="flex items-center gap-3 rounded-lg p-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                          <RIcon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{t(rt.nameKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Recently used */}
              {recentTools.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-ink-400" />
                    <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                      {t("tool.recentlyUsed")}
                    </h3>
                  </div>
                  <div className="mt-3 space-y-2">
                    {recentTools.map((rt) => {
                      if (!rt) return null;
                      const RIcon = getIcon(rt.icon);
                      return (
                        <Link
                          key={rt.slug}
                          to={`/tools/${rt.slug}`}
                          className="flex items-center gap-3 rounded-lg p-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                            <RIcon className="h-4 w-4" />
                          </div>
                          <span className="truncate">{t(rt.nameKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Popular tools */}
              <div className="card p-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                    {t("tool.popular")}
                  </h3>
                </div>
                <div className="mt-3 space-y-2">
                  {popular.filter((p) => p.slug !== tool.slug).slice(0, 4).map((pt) => {
                    const PIcon = getIcon(pt.icon);
                    return (
                      <Link
                        key={pt.slug}
                        to={`/tools/${pt.slug}`}
                        className="flex items-center gap-3 rounded-lg p-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                          <PIcon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{t(pt.nameKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use */}
        <section className="mt-12">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("tool.howto")}</h2>
          </div>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {howToSteps.map((step, i) => (
              <li key={i} className="card p-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-3 font-semibold text-ink-900 dark:text-ink-100">
                  {t(step.titleKey)}
                </h3>
                <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
                  {t(step.descKey)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-12">
          <AdSlot variant="inline" />
        </div>

        {/* FAQ */}
        <section className="mt-12">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("tool.faq")}</h2>
          </div>
          <div className="mt-6 space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-ink-900 dark:text-ink-100">
                    {t(faq.qKey)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-ink-400 transition-transform",
                      openFaq === i && "rotate-180",
                    )}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-600 dark:border-ink-800 dark:text-ink-400">
                    {t(faq.aKey)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Related tools grid */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("tool.related")}</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((rt) => (
              <ToolCard key={rt.slug} tool={rt} />
            ))}
          </div>
        </section>
      </div>

      {/* Report issue modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setReportOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl animate-scale-in dark:border-ink-700 dark:bg-ink-900">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-danger" />
                <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">{t("tool.report")}</h2>
              </div>
              <button onClick={() => setReportOpen(false)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            {reportStatus === "done" ? (
              <div className="p-8 text-center">
                <Check className="mx-auto h-12 w-12 text-success-700 dark:text-success-600" />
                <p className="mt-4 font-medium text-ink-900 dark:text-ink-100">{t("tool.report.success")}</p>
              </div>
            ) : (
              <div className="space-y-4 p-5">
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  {t("tool.report.desc")} <strong>{t(tool.nameKey)}</strong>
                </p>
                <div>
                  <label className="label">{t("tool.report.type")}</label>
                  <select className="input" defaultValue="bug">
                    <option value="bug">{t("tool.report.bug")}</option>
                    <option value="improvement">{t("tool.report.improvement")}</option>
                    <option value="other">{t("tool.report.other")}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t("tool.report.message")}</label>
                  <textarea className="input min-h-[100px]" placeholder={t("tool.report.placeholder")} />
                </div>
                <button onClick={handleReport} disabled={reportStatus === "loading"} className="btn-primary w-full">
                  {reportStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t("tool.report.send")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
