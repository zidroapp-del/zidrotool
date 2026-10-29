import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import "@/nv.css";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Crown,
  FileText,
  LockKeyhole,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { Newsletter } from "@/components/Newsletter";
import { AdSlot } from "@/components/AdSlot";
import { HeroCanvas } from "@/components/home/HeroCanvas";
import { SearchSuggestBox } from "@/components/SearchSuggestBox";
import { saveRecent } from "@/lib/toolSearch";
import { HeroWindows } from "@/components/home/HeroWindows";
import { CountUp, Reveal, ScrollProgress, tiltHandlers } from "@/components/home/motion";
import { TOOLS, CATEGORIES, getCategory } from "@/data/catalog";
import { BLOG_POSTS, getAuthor } from "@/data/blog";
import { getIcon } from "@/lib/icons";
import { formatDate, cn } from "@/lib/utils";
import type { Tool } from "@/types";

function MarqueeRow({ tools, reverse, label }: { tools: Tool[]; reverse?: boolean; label: string }) {
  const { t } = useTranslation();
  const items = [...tools, ...tools];
  return (
    <div className="nv-marquee" aria-label={label}>
      <div className={cn("nv-marquee-track", reverse && "is-reverse")}>
        {items.map((tool, i) => {
          const Icon = getIcon(tool.icon);
          const dup = i >= tools.length;
          return (
            <Link key={`${tool.slug}-${i}`} to={`/tools/${tool.slug}`} className="nv-pill" tabIndex={dup ? -1 : undefined} aria-hidden={dup ? true : undefined}>
              <Icon className="h-4 w-4" />
              {t(tool.nameKey)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function HomeToolCard({ tool }: { tool: Tool }) {
  const { t } = useTranslation();
  const Icon = getIcon(tool.icon);
  const cat = getCategory(tool.category);
  return (
    <Link to={`/tools/${tool.slug}`} className="nv-card group" {...tiltHandlers()}>
      <span className="nv-card-glow" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="nv-icon"><Icon className="h-6 w-6" /></span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {tool.isNew && <span className="nv-badge nv-badge-new"><Sparkles className="h-3 w-3" />{t("tool.new.badge")}</span>}
          {tool.popular && !tool.isNew && <span className="nv-badge">{t("tool.popular.badge")}</span>}
        </div>
      </div>
      <h3 className="relative mt-5 text-lg font-bold tracking-tight text-white">{t(tool.nameKey)}</h3>
      <p className="relative mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{t(tool.descKey)}</p>
      <div className="relative mt-auto flex items-center justify-between pt-5 text-xs font-bold">
        <span className="uppercase tracking-[0.14em] text-slate-500">{cat ? t(cat.nameKey) : ""}</span>
        <span className="inline-flex items-center gap-1 text-blue-300 transition-transform duration-300 group-hover:translate-x-1">
          Open <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);

  const popular = [...TOOLS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 10);
  const latestPosts = BLOG_POSTS.slice(0, 3);
  const live = TOOLS.filter((x) => x.implemented !== false);
  const rowA = live.filter((_, i) => i % 2 === 0).slice(0, 22);
  const rowB = live.filter((_, i) => i % 2 === 1).slice(0, 22);
  const titleWords = t("hero.title").split(/\s+/).filter(Boolean);

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

  // hero content drifts up and fades while you scroll away from it
  useEffect(() => {
    const el = heroRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = Math.min(window.scrollY, 900);
      el.style.setProperty("--sy", String(y));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="nv-home">
      <Seo jsonLd={[jsonLd, faqJsonLd]} />
      <ScrollProgress />

      {/* ───────── Hero ───────── */}
      <section className="nv-hero relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10"><HeroCanvas /></div>
        <div className="nv-vignette" aria-hidden="true" />
        <div ref={heroRef} className="container-page nv-hero-inner relative grid grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]">
          <div className="nv-hero-copy">
            <span className="nv-enter nv-badge-lg" style={{ "--d": "0ms" } as CSSProperties}>
              <span className="nv-live" />
              {t("hero.badge")}
            </span>

            <h1 className="nv-title mt-6" aria-label={t("hero.title")}>
              {titleWords.map((word, i) => (
                <Fragment key={i}>
                  <span className="nv-word" aria-hidden="true">
                    <span className={cn(i >= Math.ceil(titleWords.length / 2) && "nv-grad")} style={{ "--i": i } as CSSProperties}>{word}</span>
                  </span>{" "}
                </Fragment>
              ))}
            </h1>

            <p className="nv-enter mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg" style={{ "--d": "650ms" } as CSSProperties}>
              {t("hero.subtitle")}
            </p>

            <div className="nv-enter nv-search-wrap mt-8" style={{ "--d": "780ms" } as CSSProperties}>
              <SearchSuggestBox
                tone="dark"
                value={heroQuery}
                onChange={setHeroQuery}
                onSubmit={(v) => { const q = v.trim(); if (q) saveRecent(q); navigate(q ? `/tools?q=${encodeURIComponent(q)}` : "/tools"); }}
                onPick={(tool) => { if (heroQuery.trim()) saveRecent(heroQuery.trim()); navigate(`/tools/${tool.slug}`); }}
              />
            </div>

            <div className="nv-enter mt-6 flex flex-wrap items-center gap-3" style={{ "--d": "900ms" } as CSSProperties}>
              <Link to="/tools" className="nv-btn nv-btn-primary">{t("hero.cta")} <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/pricing" className="nv-btn nv-btn-ghost"><Sparkles className="h-4 w-4" />{t("hero.ctaSecondary")}</Link>
            </div>

            <div className="nv-enter mt-7 flex flex-wrap gap-2" style={{ "--d": "1020ms" } as CSSProperties}>
              {CATEGORIES.slice(0, 5).map((cat) => (
                <Link key={cat.slug} to={`/category/${cat.slug}`} className="nv-chip-link">{t(cat.nameKey)}</Link>
              ))}
            </div>
          </div>

          <div className="nv-enter" style={{ "--d": "500ms" } as CSSProperties}><HeroWindows /></div>
        </div>
        <a href="#nv-directory" className="nv-scroll-cue" aria-label="Scroll"><span /></a>
      </section>

      {/* ───────── Moving tool strip ───────── */}
      <section className="nv-strip" aria-label={t("section.popular")}>
        <MarqueeRow tools={rowA} label={t("section.popular")} />
        <MarqueeRow tools={rowB} reverse label={t("section.popular")} />
      </section>

      <div className="container-page pt-6"><AdSlot variant="header" /></div>

      {/* ───────── Numbers ───────── */}
      <section className="nv-section pb-0">
        <div className="container-page">
          <Reveal>
            <div className="nv-stats">
              <div><strong><CountUp to={TOOLS.length} suffix="+" /></strong><span>{t("hero.stat.tools")}</span></div>
              <div><strong><CountUp to={CATEGORIES.length} /></strong><span>{t("hero.stat.categories")}</span></div>
              <div><strong><CountUp to={6} /></strong><span>{t("hero.stat.languages")}</span></div>
              <div><strong><CountUp to={100} suffix="%" /></strong><span>{t("hero.stat.free")}</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Popular tools ───────── */}
      <section id="nv-directory" className="nv-section">
        <div className="container-page">
          <Reveal>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="nv-kicker">ZidroTool directory</p>
                <h2 className="nv-h2">{t("section.popular")}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{t("section.popular.sub")}</p>
              </div>
              <Link to="/tools" className="nv-link">{t("section.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </Reveal>
          <div className="nv-grid mt-10">
            {popular.map((tool, i) => (
              <Reveal key={tool.slug} delay={(i % 5) * 70}><HomeToolCard tool={tool} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Categories ───────── */}
      <section className="nv-section nv-section-alt">
        <div className="container-page">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div><p className="nv-kicker">Explore</p><h2 className="nv-h2">{t("section.categories")}</h2></div>
              <Link to="/tools" className="nv-link hidden sm:inline-flex">{t("section.viewAll")} <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CATEGORIES.map((cat, i) => {
              const Icon = getIcon(cat.icon);
              const count = TOOLS.filter((x) => x.category === cat.slug).length;
              return (
                <Reveal key={cat.slug} delay={(i % 4) * 60}>
                  <Link to={`/category/${cat.slug}`} className="nv-cat group" {...tiltHandlers()}>
                    <span className="nv-card-glow" aria-hidden="true" />
                    <span className="nv-icon nv-icon-sm relative"><Icon className="h-5 w-5" /></span>
                    <span className="relative min-w-0"><strong>{t(cat.nameKey)}</strong><small>{count} {t("hero.stat.tools").toLowerCase()}</small></span>
                    <ArrowUpRight className="relative ml-auto h-4 w-4 text-slate-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-300" />
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── Why ───────── */}
      <section className="nv-section">
        <div className="container-page">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="nv-kicker">Simple by design</p>
              <h2 className="nv-h2">{t("section.why")}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{t("section.why.sub")}</p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workCards.map((item, i) => (
              <Reveal key={item.titleKey} delay={i * 90}>
                <div className="nv-feature" {...tiltHandlers()}>
                  <span className="nv-card-glow" aria-hidden="true" />
                  <span className="nv-icon relative"><item.icon className="h-5 w-5" /></span>
                  <h3 className="relative mt-5 font-bold text-white">{t(item.titleKey)}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-slate-400">{t(item.descKey)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Premium ───────── */}
      <section className="nv-section pt-0">
        <div className="container-page">
          <Reveal>
            <div className="nv-premium">
              <div className="nv-premium-bg" aria-hidden="true" />
              <div className="relative z-10 max-w-2xl">
                <span className="nv-badge-lg"><Crown className="h-3.5 w-3.5" /> Premium</span>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">{t("nav.getPremium")}</h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">{t("section.why.sub")}</p>
                <Link to="/pricing" className="nv-btn nv-btn-primary mt-7"><Crown className="h-4 w-4" /> {t("nav.getPremium")}</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="nv-section">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="text-center"><p className="nv-kicker">FAQ</p><h2 className="nv-h2">{t("section.faq")}</h2><p className="mt-3 text-sm text-slate-400">{t("section.faq.sub")}</p></div>
            </Reveal>
            <div className="mt-10 space-y-3">
              {faqs.map((faq, i) => (
                <Reveal key={i} delay={i * 70}>
                  <div className={cn("nv-faq", openFaq === i && "is-open")}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left" aria-expanded={openFaq === i}>
                      <span className="font-semibold text-white">{t(faq.qKey)}</span>
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300" />
                    </button>
                    <div className="nv-faq-a"><div><p className="px-5 pb-5 text-sm leading-6 text-slate-400">{t(faq.aKey)}</p></div></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Blog ───────── */}
      <section className="nv-section nv-section-alt">
        <div className="container-page">
          <Reveal>
            <div className="flex items-end justify-between gap-4"><div><p className="nv-kicker">Journal</p><h2 className="nv-h2">{t("section.blog")}</h2></div><Link to="/blog" className="nv-link">{t("section.viewAll")} <ArrowUpRight className="h-4 w-4" /></Link></div>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {latestPosts.map((post, i) => (
              <Reveal key={post.slug} delay={i * 100}>
                <Link to={`/blog/${post.slug}`} className="nv-post group">
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={post.coverImage}
                      alt={t(post.titleKey)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
                      onError={(event) => { event.currentTarget.src = "/blog-images/default-blog.png"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent" aria-hidden="true" />
                  </div>
                  <div className="p-5">
                    <span className="nv-badge">{t(`blog.cat.${post.category}`)}</span>
                    <h3 className="mt-3 font-bold text-white transition-colors group-hover:text-blue-300">{t(post.titleKey)}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{t(post.excerptKey)}</p>
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500"><span>{getAuthor(post.authorSlug)?.name}</span><span>·</span><span>{formatDate(post.date, i18n.language)}</span></div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="nv-section"><div className="container-page"><Reveal><Newsletter /></Reveal></div></section>
      <div className="container-page pb-8"><AdSlot variant="footer" /></div>
    </div>
  );
}
