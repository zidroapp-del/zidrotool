import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Check,
  ChevronDown,
  Clock,
  Copy,
  Flag,
  HelpCircle,
  ListChecks,
  Loader2,
  RotateCcw,
  Send,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Star,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";

import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import {
  getCategory,
  getPopularTools,
  getRelatedTools,
  getTool,
} from "@/data/catalog";
import { getIcon } from "@/lib/icons";
import { useFavorites } from "@/lib/favorites";
import { useHistory } from "@/lib/history";
import { cn, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { getToolImage } from "@/data/toolImages";
import { ToolSEOContent } from "@/components/ToolSEOContent";

interface ToolLayoutProps {
  children: ReactNode;
  output: string;
  onReset: () => void;
  howToSteps: {
    titleKey: string;
    descKey: string;
  }[];
  faqs: {
    qKey: string;
    aKey: string;
  }[];
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
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
  slug,
}: ToolLayoutProps) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  const resolvedSlug = slug ?? routeSlug;
  const tool = resolvedSlug ? getTool(resolvedSlug) : undefined;

  const { isFavorite, toggleFavorite } = useFavorites();
  const { history, addHistory } = useHistory();
  const { success, error, info } = useToast();

  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [shared, setShared] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<
    "idle" | "loading" | "done"
  >("idle");

  const copyTimerRef = useRef<number | null>(null);
  const shareTimerRef = useRef<number | null>(null);
  const reportTimerRef = useRef<number | null>(null);

  const favorite = tool ? isFavorite(tool.slug) : false;

  const category = tool
    ? getCategory(tool.category)
    : undefined;

  const related = tool
    ? getRelatedTools(tool.slug, tool.category).slice(0, 4)
    : [];

  const popular = getPopularTools().slice(0, 4);

  const Icon = tool
    ? getIcon(tool.icon)
    : Wrench;

  const recentTools = useMemo(() => {
    return history
      .slice(0, 4)
      .map((item) => getTool(item.slug))
      .filter(Boolean)
      .filter((item) => item!.slug !== resolvedSlug);
  }, [history, resolvedSlug]);

  const toolJsonLd = useMemo(() => {
    if (!tool) {
      return {};
    }

    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: t(tool.nameKey),
      description: t(tool.descKey),
      applicationCategory: "UtilitiesApplication",
      applicationSubCategory: t(tool.category === "pdf" ? "category.pdf" : "nav.tools"),
      operatingSystem: "Web Browser",
      url: `https://zidrotool.com/tools/${tool.slug}`,
      brand: { "@type": "Brand", name: "ZidroTool" },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    };
  }, [tool, t]);

  const breadcrumbJsonLd = useMemo(() => {
    if (!tool) return null;
    const items = [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zidrotool.com/" },
      { "@type": "ListItem", position: 2, name: "Tools", item: "https://zidrotool.com/tools" },
    ];
    if (category) {
      items.push({
        "@type": "ListItem",
        position: items.length + 1,
        name: t(category.nameKey),
        item: `https://zidrotool.com/category/${category.slug}`,
      });
    }
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: t(tool.nameKey),
      item: `https://zidrotool.com/tools/${tool.slug}`,
    });
    return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
  }, [tool, category, t]);

  const faqJsonLd = useMemo(() => {
    if (!faqs.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: t(faq.qKey),
        acceptedAnswer: {
          "@type": "Answer",
          text: t(faq.aKey),
        },
      })),
    };
  }, [faqs, t]);

  const handleCopy = useCallback(async () => {
    if (!output) {
      return;
    }

    const copiedSuccessfully = await copyToClipboard(output);

    if (!copiedSuccessfully) {
      error(t("tool.error"));
      return;
    }

    setCopied(true);
    success(t("tool.copied"));

    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [output, success, error, t]);

  const handleShare = useCallback(async () => {
    if (!tool) {
      return;
    }

    const copiedSuccessfully = await copyToClipboard(
      window.location.href,
    );

    if (!copiedSuccessfully) {
      error(t("tool.error"));
      return;
    }

    setShared(true);
    success(t("tool.share.copied"));

    if (shareTimerRef.current) window.clearTimeout(shareTimerRef.current);
    shareTimerRef.current = window.setTimeout(() => {
      setShared(false);
    }, 2000);
  }, [tool, success, error, t]);

  const handleReset = useCallback(() => {
    onReset();
    info(t("tool.reset"));
  }, [onReset, info, t]);

  const handleReport = useCallback(() => {
    if (reportStatus !== "idle") {
      return;
    }

    setReportStatus("loading");

    if (reportTimerRef.current) window.clearTimeout(reportTimerRef.current);
    reportTimerRef.current = window.setTimeout(() => {
      setReportStatus("done");
      success(t("tool.report.success"));

      reportTimerRef.current = window.setTimeout(() => {
        setReportOpen(false);
        setReportStatus("idle");
      }, 1500);
    }, 1000);
  }, [reportStatus, success, t]);

  useEffect(() => {
    if (!tool) {
      return;
    }

    addHistory({
      slug: tool.slug,
      name: t(tool.nameKey),
      ts: Date.now(),
    });
  }, [tool, t, addHistory]);

  useEffect(() => {
    return () => {
      setReportOpen(false);
      setReportStatus("idle");
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      if (shareTimerRef.current) window.clearTimeout(shareTimerRef.current);
      if (reportTimerRef.current) window.clearTimeout(reportTimerRef.current);
    };
  }, [resolvedSlug]);

  if (!tool) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center dark:bg-danger/10">
          <h1 className="text-xl font-bold text-ink-900 dark:text-ink-100">
            {t("tool.notFound") !== "tool.notFound" ? t("tool.notFound") : "Tool not found"}
          </h1>
          <Link to="/tools" className="btn-primary mt-6 inline-flex">
            {t("nav.tools") !== "nav.tools" ? t("nav.tools") : "Browse tools"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={seoTitle || t(tool.nameKey)}
        description={seoDescription || t(tool.descKey)}
        keywords={tool.keywords}
        image={`https://zidrotool.com${getToolImage(tool)}`}
        jsonLd={[toolJsonLd, ...(breadcrumbJsonLd ? [breadcrumbJsonLd] : []), ...(faqJsonLd ? [faqJsonLd] : [])]}
      />

      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            {
              label: t("breadcrumbs.tools"),
              to: "/tools",
            },
            ...(category
              ? [
                  {
                    label: t(category.nameKey),
                    to: `/category/${category.slug}`,
                  },
                ]
              : []),
            {
              label: t(tool.nameKey),
            },
          ]}
        />

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-sm sm:h-20 sm:w-32">
              {!imageFailed ? (
                <img
                  src={getToolImage(tool)}
                  alt={`${t(tool.nameKey)} illustration`}
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600 to-accent-600">
                  <Icon className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden="true" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/10">
                <Icon className="h-6 w-6 drop-shadow sm:h-7 sm:w-7" aria-hidden="true" />
              </div>
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
              type="button"
              onClick={() => {
                toggleFavorite(tool.slug);

                if (favorite) {
                  info(
                    `${t("tool.favorite")} — ${t("tool.removed")}`,
                  );
                } else {
                  success(t("tool.favorited"));
                }
              }}
              className={cn(
                "btn btn-sm",
                favorite
                  ? "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600"
                  : "btn-secondary btn-sm",
              )}
              aria-pressed={favorite}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  favorite && "fill-current",
                )}
              />

              <span className="hidden sm:inline">
                {t("tool.favorite")}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="btn-secondary btn-sm"
            >
              {shared ? (
                <Check className="h-4 w-4 text-success-700" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}

              <span className="hidden sm:inline">
                {shared
                  ? t("tool.share.copied")
                  : t("tool.share")}
              </span>
            </button>

            <div className="hidden items-center gap-1 rounded-xl border border-ink-200 bg-white/80 p-1 sm:flex dark:border-ink-800 dark:bg-ink-900/70" aria-label="Share tool">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Facebook"
                title="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-[#1877F2]/10 hover:text-[#1877F2] dark:text-ink-400"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(t(tool.nameKey))}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Telegram"
                title="Telegram"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-sky-500/10 hover:text-sky-500 dark:text-ink-400"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(t(tool.nameKey))}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
                title="X"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-black/5 hover:text-black dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary btn-sm"
            >
              <RotateCcw className="h-4 w-4" />

              <span className="hidden sm:inline">
                {t("tool.reset")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="btn-ghost btn-sm"
              aria-label={t("tool.report")}
            >
              <Flag className="h-4 w-4" />

              <span className="hidden sm:inline">
                {t("tool.report")}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="card p-6">
              {children}

              {output && (
                <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-ink-700 dark:text-ink-300">
                      {t("tool.output")}
                    </span>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn-secondary btn-sm"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}

                      {copied
                        ? t("tool.copied")
                        : t("tool.copy")}
                    </button>
                  </div>

                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm text-ink-700 dark:text-ink-300">
                    {output}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <AdSlot variant="sidebar" />

              {related.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                    {t("tool.related")}
                  </h3>

                  <div className="mt-3 space-y-2">
                    {related.map((relatedTool) => {
                      const RelatedIcon = getIcon(
                        relatedTool.icon,
                      );

                      return (
                        <Link
                          key={relatedTool.slug}
                          to={`/tools/${relatedTool.slug}`}
                          className="flex items-center gap-3 rounded-lg p-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                        >
                          <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
                            <img src={getToolImage(relatedTool)} alt="" loading="lazy" className="h-full w-full object-cover" />
                          </div>

                          <span className="truncate">
                            {t(relatedTool.nameKey)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {recentTools.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-ink-400" />

                    <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                      {t("tool.recentlyUsed")}
                    </h3>
                  </div>

                  <div className="mt-3 space-y-2">
                    {recentTools.map((recentTool) => {
                      if (!recentTool) {
                        return null;
                      }

                      const RecentIcon = getIcon(
                        recentTool.icon,
                      );

                      return (
                        <Link
                          key={recentTool.slug}
                          to={`/tools/${recentTool.slug}`}
                          className="flex items-center gap-3 rounded-lg p-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                            <RecentIcon className="h-4 w-4" />
                          </div>

                          <span className="truncate">
                            {t(recentTool.nameKey)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="card p-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-600 dark:text-brand-400" />

                  <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                    {t("tool.popular")}
                  </h3>
                </div>

                <div className="mt-3 space-y-2">
                  {popular
                    .filter(
                      (popularTool) =>
                        popularTool.slug !== tool.slug,
                    )
                    .slice(0, 4)
                    .map((popularTool) => {
                      const PopularIcon = getIcon(
                        popularTool.icon,
                      );

                      return (
                        <Link
                          key={popularTool.slug}
                          to={`/tools/${popularTool.slug}`}
                          className="flex items-center gap-3 rounded-lg p-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                            <PopularIcon className="h-4 w-4" />
                          </div>

                          <span className="truncate">
                            {t(popularTool.nameKey)}
                          </span>
                        </Link>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {howToSteps.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-brand-600 dark:text-brand-400" />

              <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">
                {t("tool.howto")}
              </h2>
            </div>

            <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {howToSteps.map((step, index) => (
                <li
                  key={`${step.titleKey}-${index}`}
                  className="card p-5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>

                  <h3 className="mt-4 font-semibold text-ink-900 dark:text-ink-100">
                    {t(step.titleKey)}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                    {t(step.descKey)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-brand-600 dark:text-brand-400" />

              <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">
                {t("tool.faq")}
              </h2>
            </div>

            <div className="mt-6 space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={`${faq.qKey}-${index}`}
                    className="overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaq(isOpen ? null : index)
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="font-medium text-ink-900 dark:text-ink-100">
                        {t(faq.qKey)}
                      </span>

                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-ink-400 transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-ink-100 px-5 py-4 dark:border-ink-800">
                        <p className="text-sm leading-6 text-ink-600 dark:text-ink-400">
                          {t(faq.aKey)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <ToolSEOContent tool={tool} />

        <div className="mt-8 flex flex-col items-center gap-3 border-y border-ink-100 py-6 dark:border-ink-800">
          <span className="text-sm font-semibold text-ink-700 dark:text-ink-300">Share this tool</span>
          <div className="flex items-center gap-2">
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2] text-white hover:opacity-90"><Facebook className="h-4 w-4" /></a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(t(tool.nameKey))}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white hover:opacity-90"><Twitter className="h-4 w-4" /></a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A66C2] text-white hover:opacity-90"><Linkedin className="h-4 w-4" /></a>
            <button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)} aria-label="Copy tool link" className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-700 text-white hover:opacity-90"><LinkIcon className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mt-12">
          <AdSlot variant="inline" />
        </div>
      </div>

      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="report-title"
                  className="text-lg font-bold text-ink-900 dark:text-ink-100"
                >
                  {t("tool.report")}
                </h2>

                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  {t("tool.report.desc")}{" "}
                  {t(tool.nameKey)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (reportStatus === "idle") {
                    setReportOpen(false);
                  }
                }}
                className="btn-ghost btn-sm"
                aria-label={t("tool.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reportStatus === "done" ? (
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-700 dark:bg-success-900/30">
                  <Check className="h-6 w-6" />
                </div>

                <p className="mt-4 font-semibold text-ink-900 dark:text-ink-100">
                  {t("tool.report.success")}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <label
                    htmlFor="report-type"
                    className="text-sm font-medium text-ink-700 dark:text-ink-300"
                  >
                    {t("tool.report.type")}
                  </label>

                  <select
                    id="report-type"
                    defaultValue="bug"
                    className="input mt-2 w-full"
                  >
                    <option value="bug">
                      {t("tool.report.bug")}
                    </option>

                    <option value="improvement">
                      {t("tool.report.improvement")}
                    </option>

                    <option value="other">
                      {t("tool.report.other")}
                    </option>
                  </select>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="report-message"
                    className="text-sm font-medium text-ink-700 dark:text-ink-300"
                  >
                    {t("tool.report.message")}
                  </label>

                  <textarea
                    id="report-message"
                    rows={4}
                    className="input mt-2 w-full resize-none"
                    placeholder={t("tool.report.placeholder")}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleReport}
                  disabled={reportStatus === "loading"}
                  className="btn-primary mt-5 w-full"
                >
                  {reportStatus === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("tool.report.send")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t("tool.report.send")}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}