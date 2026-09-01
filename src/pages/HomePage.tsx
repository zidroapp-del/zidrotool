import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  EyeOff,
  Gauge,
  Gift,
  Globe2,
  Heart,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wrench,
  Crown,
  FileText,
  Smartphone,
  LockKeyhole,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { ToolCard } from "@/components/ToolCard";
import { Newsletter } from "@/components/Newsletter";
import { AdSlot } from "@/components/AdSlot";
import { TOOLS, CATEGORIES } from "@/data/catalog";
import { BLOG_POSTS, getAuthor } from "@/data/blog";
import { getIcon } from "@/lib/icons";
import { formatDate, cn } from "@/lib/utils";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const popular = [...TOOLS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 10);
  const latestPosts = BLOG_POSTS.slice(0, 3);
  // Keep the hero stat intentionally focused: one strong proof point, as in the E design.
  const stats = [{ value: "161", labelKey: "hero.stat.tools" }];

  const faqs = [
    { qKey: "faq.general.q1", aKey: "faq.general.a1" },
    { qKey: "faq.general.q2", aKey: "faq.general.a2" },
    { qKey: "faq.general.q3", aKey: "faq.general.a3" },
    { qKey: "faq.general.q4", aKey: "faq.general.a4" },
  ];

  const workCards = [
    { icon: FileText, titleKey: "why.fast.title", descKey: "why.fast.desc" },
    { icon: Smartphone, titleKey: "why.open.title", descKey: "why.open.desc" },
    { icon: Wrench, titleKey: "why.quality.title", descKey: "why.quality.desc" },
    { icon: LockKeyhole, titleKey: "why.privacy.title", descKey: "why.privacy.desc" },
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

      {/* E-style directory hero */}
      <section className="zt-directory-hero relative overflow-hidden border-b border-orange-100 dark:border-ink-800">
        <div className="zt-paper-noise" aria-hidden="true" />
        <div className="zt-ambient-orb zt-ambient-orb-a" aria-hidden="true" />
        <div className="zt-ambient-orb zt-ambient-orb-b" aria-hidden="true" />
        <div className="zt-ambient-orb zt-ambient-orb-c" aria-hidden="true" />
        <div className="container-page relative py-14 sm:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_430px]">
            <div className="max-w-3xl">
              <span className="zt-warm-pill inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                {t("hero.badge")}
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.045em] text-ink-950 sm:text-5xl lg:text-[4.3rem] lg:leading-[1.02] dark:text-white">
                {t("hero.title")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg dark:text-ink-400">
                {t("hero.subtitle")}
              </p>

              <div className="zt-search-shell mt-8 max-w-2xl">
                <Search className="h-5 w-5 shrink-0 text-orange-500" />
                <Link to="/tools" className="flex min-w-0 flex-1 items-center text-sm text-ink-400 dark:text-ink-500">
                  {t("search.placeholder")}
                </Link>
                <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600 dark:bg-orange-950/50 dark:text-orange-300">⌘ K</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/tools" className="zt-category-pill is-active">{t("common.all")}</Link>
                {CATEGORIES.slice(0, 5).map((cat) => (
                  <Link key={cat.slug} to={`/category/${cat.slug}`} className="zt-category-pill">{t(cat.nameKey)}</Link>
                ))}
              </div>
            </div>

            <div className="zt-hero-collage" aria-hidden="true">
              <div className="zt-collage-blob" />
              <div className="zt-collage-main">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20"><Sparkles className="h-5 w-5" /></div>
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">ZidroTool</p><p className="mt-0.5 text-xl font-black text-ink-950">{TOOLS.length}+</p></div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {popular.slice(0, 3).map((tool) => {
                    const Icon = getIcon(tool.icon);
                    return <div key={tool.slug} className="flex h-16 items-center justify-center rounded-xl bg-white/80 text-orange-500 shadow-sm ring-1 ring-black/5"><Icon className="h-5 w-5" /></div>;
                  })}
                </div>
              </div>
              <div className="zt-float-card zt-float-a"><Gauge className="h-5 w-5" /><span>Fast</span></div>
              <div className="zt-float-card zt-float-b"><ShieldCheck className="h-5 w-5" /><span>Private</span></div>
              <div className="zt-float-card zt-float-c"><Globe2 className="h-5 w-5" /><span>Global</span></div>
            </div>
          </div>

          <div className="mt-12 flex justify-center sm:justify-start">
            {stats.map((stat) => (
              <div key={stat.labelKey} className="zt-stat-card w-full max-w-[260px] sm:max-w-[220px]">
                <span className="text-3xl font-black text-ink-950 sm:text-4xl dark:text-white">{stat.value}</span>
                <span className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">{t(stat.labelKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page pt-6"><AdSlot variant="header" /></div>

      {/* Directory */}
      <section className="section pt-12 sm:pt-16">
        <div className="container-page">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">ZidroTool directory</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-ink-950 dark:text-white">{t("section.popular")}</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-500 dark:text-ink-400">{t("section.popular.sub")}</p>
            </div>
            <Link to="/tools" className="zt-text-action">{t("section.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {popular.slice(0, 10).map((tool) => <ToolCard key={tool.slug} tool={tool} variant="directory" />)}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section bg-[#fffaf3] dark:bg-ink-900/40">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Explore</p><h2 className="mt-2 text-3xl font-black tracking-tight text-ink-950 dark:text-white">{t("section.categories")}</h2></div>
            <Link to="/tools" className="zt-text-action hidden sm:flex">{t("section.viewAll")} <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {CATEGORIES.map((cat) => {
              const Icon = getIcon(cat.icon);
              const count = TOOLS.filter((tool) => tool.category === cat.slug).length;
              return (
                <Link key={cat.slug} to={`/category/${cat.slug}`} className="zt-large-category group">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-transform group-hover:scale-105 dark:bg-orange-950/40 dark:text-orange-300"><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0"><strong>{t(cat.nameKey)}</strong><small>{count} {t("hero.stat.tools").toLowerCase()}</small></span>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-ink-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-500" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Work your way */}
      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Simple by design</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-ink-950 sm:text-4xl dark:text-white">{t("section.why")}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-500 dark:text-ink-400">{t("section.why.sub")}</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workCards.map((item) => (
              <div key={item.titleKey} className="zt-feature-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"><item.icon className="h-5 w-5" /></div>
                <h3 className="mt-5 font-bold text-ink-950 dark:text-white">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium */}
      <section className="section pt-0">
        <div className="container-page">
          <div className="zt-premium-banner">
            <div className="relative z-10 max-w-2xl">
              <span className="zt-premium-kicker"><Crown className="h-3.5 w-3.5" /> Premium</span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-ink-950 sm:text-4xl">{t("nav.getPremium")}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ink-600">{t("section.why.sub")}</p>
              <Link to="/pricing" className="btn-primary mt-6 bg-ink-950 hover:bg-ink-800"><Crown className="h-4 w-4" /> {t("nav.getPremium")}</Link>
            </div>
            <div className="zt-premium-art" aria-hidden="true">
              <div className="zt-premium-sheet"><div className="h-2 w-16 rounded-full bg-orange-300" /><div className="mt-4 h-2 w-28 rounded-full bg-ink-200" /><div className="mt-2 h-2 w-24 rounded-full bg-ink-100" /><div className="mt-8 h-14 w-20 rounded-xl bg-orange-100" /></div>
              <Crown className="zt-premium-crown" />
              <Sparkles className="zt-premium-spark" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust — qualitative, not another statistics block. */}
      <section className="border-y border-orange-100 bg-[#fffaf3] py-8 dark:border-ink-800 dark:bg-ink-900/40">
        <div className="container-page flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
          {[
            { icon: Wrench, label: t("trust.fast") },
            { icon: ShieldCheck, label: t("trust.privacy") },
            { icon: Globe2, label: t("trust.countries") },
            { icon: Star, label: t("trust.tools") },
          ].map((item) => (
            <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/80 px-4 py-2 text-xs font-bold text-ink-700 shadow-sm dark:border-ink-800 dark:bg-ink-900/70 dark:text-ink-200">
              <item.icon className="h-3.5 w-3.5 text-orange-600 dark:text-orange-300" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">FAQ</p><h2 className="mt-2 text-3xl font-black tracking-tight text-ink-950 dark:text-white">{t("section.faq")}</h2><p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("section.faq.sub")}</p></div>
            <div className="mt-8 space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-orange-50/50 dark:hover:bg-ink-800/40" aria-expanded={openFaq === i}>
                    <span className="font-semibold text-ink-950 dark:text-white">{t(faq.qKey)}</span>
                    <ChevronDown className={cn("h-5 w-5 shrink-0 text-ink-400 transition-transform", openFaq === i && "rotate-180")} />
                  </button>
                  {openFaq === i && <div className="border-t border-ink-100 px-5 py-4 text-sm leading-6 text-ink-600 dark:border-ink-800 dark:text-ink-400">{t(faq.aKey)}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="section bg-[#fffaf3] dark:bg-ink-900/40">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Journal</p><h2 className="mt-2 text-3xl font-black tracking-tight text-ink-950 dark:text-white">{t("section.blog")}</h2></div><Link to="/blog" className="zt-text-action">{t("section.viewAll")} <ArrowUpRight className="h-4 w-4" /></Link></div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {latestPosts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group overflow-hidden rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
                <div className="relative h-40 overflow-hidden bg-orange-50 dark:bg-ink-800">
                  <img
                    src={post.coverImage}
                    alt={t(post.titleKey)}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(event) => { event.currentTarget.src = "/blog-images/default-blog.png"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" aria-hidden="true" />
                </div>
                <div className="p-5"><span className="zt-warm-mini-badge">{t(`blog.cat.${post.category}`)}</span><h3 className="mt-3 font-bold text-ink-950 group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-300">{t(post.titleKey)}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-500 dark:text-ink-400">{t(post.excerptKey)}</p><div className="mt-4 flex items-center gap-2 text-[11px] text-ink-400"><span>{getAuthor(post.authorSlug)?.name}</span><span>·</span><span>{formatDate(post.date, i18n.language)}</span></div></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section"><div className="container-page"><Newsletter /></div></section>
      <div className="container-page pb-8"><AdSlot variant="footer" /></div>
    </>
  );
}
