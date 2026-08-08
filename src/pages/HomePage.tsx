import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  EyeOff,
  Gauge,
  Gift,
  Globe2,
  Heart,
  Sparkles,
  ChevronDown,
  HelpCircle,
  Flame,
  Clock,
  TrendingUp,
  Star,
  ShieldCheck,
  Languages,
  Users,
  Wrench,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { SectionHeader } from "@/components/SectionHeader";
import { ToolCard } from "@/components/ToolCard";
import { Newsletter } from "@/components/Newsletter";
import { AdSlot } from "@/components/AdSlot";
import { TOOLS, CATEGORIES } from "@/data/catalog";
import { BLOG_POSTS, getAuthor } from "@/data/blog";
import { getIcon } from "@/lib/icons";
import { formatDate, cn } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const popular = [...TOOLS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 8);
  const trending = TOOLS.filter((tool) => tool.trending).slice(0, 4);
  const recent = [...TOOLS]
    .sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime())
    .slice(0, 4);
  const latestPosts = BLOG_POSTS.slice(0, 3);

  const faqs = [
    { qKey: "faq.general.q1", aKey: "faq.general.a1" },
    { qKey: "faq.general.q2", aKey: "faq.general.a2" },
    { qKey: "faq.general.q3", aKey: "faq.general.a3" },
    { qKey: "faq.general.q4", aKey: "faq.general.a4" },
  ];

  const whyItems = [
    { icon: Gauge, titleKey: "why.fast.title", descKey: "why.fast.desc", color: "text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400" },
    { icon: EyeOff, titleKey: "why.privacy.title", descKey: "why.privacy.desc", color: "text-accent-600 bg-accent-50 dark:bg-accent-900/30 dark:text-accent-400" },
    { icon: Gift, titleKey: "why.free.title", descKey: "why.free.desc", color: "text-success-700 bg-success-50 dark:bg-success-700/20 dark:text-success-600" },
    { icon: EyeOff, titleKey: "why.noice.title", descKey: "why.noice.desc", color: "text-warning-700 bg-warning-50 dark:bg-warning-700/20 dark:text-warning-600" },
    { icon: Globe2, titleKey: "why.open.title", descKey: "why.open.desc", color: "text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400" },
    { icon: Heart, titleKey: "why.quality.title", descKey: "why.quality.desc", color: "text-danger bg-danger-50 dark:bg-danger-700/20 dark:text-danger-600" },
  ];

  const stats = [
  { value: "70+", labelKey: "hero.stat.tools" },
  { value: "13", labelKey: "hero.stat.categories" },
  { value: "6", labelKey: "hero.stat.languages" },
  { value: "100%", labelKey: "hero.stat.free" },
];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ZidroTool",
    url: "https://zidrotool.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://zidrotool.com/tools?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: t(f.qKey),
      acceptedAnswer: { "@type": "Answer", text: t(f.aKey) },
    })),
  };

  return (
    <>
      <Seo jsonLd={[jsonLd, faqJsonLd]} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-200/60 dark:border-ink-800/60">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/50 via-white to-white dark:from-ink-900 dark:via-ink-950 dark:to-ink-950" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.15] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(59 130 246) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="container-page py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700 animate-slide-down dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.badge")}
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl lg:text-6xl dark:text-ink-100 animate-slide-up">
              {t("hero.title").split(" ").slice(0, -2).join(" ")}{" "}
              <span className="text-gradient">{t("hero.title").split(" ").slice(-2).join(" ")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-600 dark:text-ink-400 animate-slide-up">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-slide-up">
              <Link to="/tools" className="btn-primary btn-lg w-full sm:w-auto">
                {t("hero.cta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/pricing" className="btn-secondary btn-lg w-full sm:w-auto">
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.labelKey} className={`text-center animate-stagger-${i + 1}`}>
                <p className="text-3xl font-bold text-ink-900 dark:text-ink-100">{s.value}</p>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="border-b border-ink-200/60 bg-white py-6 dark:border-ink-800/60 dark:bg-ink-950">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: Wrench, label: t("trust.tools"), value: SITE_CONFIG.stats.tools },
              { icon: Star, label: t("trust.categories"), value: SITE_CONFIG.stats.categories },
              { icon: Globe2, label: t("trust.countries"), value: SITE_CONFIG.stats.countries },
              { icon: Languages, label: t("trust.languages"), value: SITE_CONFIG.stats.languages },
              { icon: Gauge, label: t("trust.fast"), value: t("trust.fastValue") },
              { icon: ShieldCheck, label: t("trust.privacy"), value: t("trust.privacyValue") },
              { icon: Globe2, label: t("trust.crossPlatform"), value: t("trust.crossPlatformValue") },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 hover:bg-ink-50 dark:hover:bg-ink-900`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900 dark:text-ink-100">{item.value}</p>
                  <p className="truncate text-xs text-ink-500 dark:text-ink-400">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Header ad slot */}
      <div className="container-page pt-6">
        <AdSlot variant="header" />
      </div>

      {/* Trending Tools */}
      <section className="section pt-12">
        <div className="container-page">
          <SectionHeader
            titleKey="section.trending"
            subKey="section.trending.sub"
            viewAllTo="/tools"
          />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Recently Added */}
      <section className="section bg-ink-50/50 dark:bg-ink-900/30">
        <div className="container-page">
          <SectionHeader
            titleKey="section.recent"
            subKey="section.recent.sub"
            viewAllTo="/tools"
          />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Most Popular */}
      <section className="section">
        <div className="container-page">
          <SectionHeader
            titleKey="section.popular"
            subKey="section.popular.sub"
            viewAllTo="/tools"
          />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Inline ad */}
      <div className="container-page">
        <AdSlot variant="inline" />
      </div>

      {/* Featured Categories */}
      <section className="section bg-ink-50/50 dark:bg-ink-900/30">
        <div className="container-page">
          <SectionHeader titleKey="section.categories" subKey="section.categories.sub" />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const Icon = getIcon(cat.icon);
              const count = TOOLS.filter((tool) => tool.category === cat.slug).length;
              return (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="card card-hover group p-5"
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 ease-smooth-out group-hover:scale-110",
                      cat.color === "brand" && "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400",
                      cat.color === "accent" && "bg-accent-50 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400",
                      cat.color === "success" && "bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-600",
                      cat.color === "warning" && "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600",
                      cat.color === "danger" && "bg-danger-50 text-danger dark:bg-danger/15 dark:text-danger",
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-ink-900 transition-colors group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400">
                    {t(cat.nameKey)}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{t(cat.descKey)}</p>
                  <p className="mt-3 text-xs font-medium text-ink-400 dark:text-ink-500">
                    {count} {t("hero.stat.tools").toLowerCase()}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose ZidroTool + Sidebar Ad */}
      <section className="section">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-9">
              <SectionHeader titleKey="section.why" subKey="section.why.sub" />
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {whyItems.map((item) => (
                  <div key={item.titleKey} className="card card-hover p-5">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 hover:scale-105", item.color)}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-ink-900 dark:text-ink-100">
                      {t(item.titleKey)}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                      {t(item.descKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <AdSlot variant="sidebar" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-ink-50/50 dark:bg-ink-900/30">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <SectionHeader titleKey="section.faq" subKey="section.faq.sub" className="text-center" />
            <div className="mt-8 space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-ink-50/50 dark:hover:bg-ink-800/30"
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-medium text-ink-900 dark:text-ink-100">
                      {t(faq.qKey)}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-ink-400 transition-transform duration-300",
                        openFaq === i && "rotate-180",
                      )}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-600 dark:border-ink-800 dark:text-ink-400 animate-slide-down">
                      {t(faq.aKey)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="border-y border-ink-200 bg-gradient-to-r from-brand-600 to-accent-600 py-12 dark:border-ink-800">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-6 text-center text-white sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.labelKey} className="transition-transform hover:scale-105">
                <p className="text-3xl font-bold sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-white/80">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Articles */}
      <section className="section">
        <div className="container-page">
          <SectionHeader titleKey="section.blog" subKey="section.blog.sub" viewAllTo="/blog" />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="card card-hover group overflow-hidden"
              >
                <div className="h-40 overflow-hidden bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500">
                  <div className="h-full w-full bg-gradient-to-br from-brand-400/80 to-accent-500/80 transition-transform duration-500 ease-smooth-out group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <span className="badge-brand">{t(`blog.cat.${post.category}`)}</span>
                  <h3 className="mt-3 font-semibold text-ink-900 transition-colors group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400">
                    {t(post.titleKey)}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">
                    {t(post.excerptKey)}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-ink-400 dark:text-ink-500">
                    <span>{getAuthor(post.authorSlug)?.name}</span>
                    <span>·</span>
                    <span>{formatDate(post.date, i18n.language)}</span>
                    <span>·</span>
                    <span>{t("blog.readingTime", { count: post.readingTime })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section">
        <div className="container-page">
          <Newsletter />
        </div>
      </section>

      {/* Footer ad */}
      <div className="container-page pb-8">
        <AdSlot variant="footer" />
      </div>
    </>
  );
}
