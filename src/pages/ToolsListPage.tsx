import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search as SearchIcon,
  Filter,
  SearchX,
  Flame,
  TrendingUp,
  Star,
  Sparkles,
  RefreshCw,
  ArrowDown,
  X,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCard } from "@/components/ToolCard";
import { AdSlot } from "@/components/AdSlot";
import { EmptyState } from "@/components/EmptyState";
import { SearchSuggestBox } from "@/components/SearchSuggestBox";
import { TOOLS, CATEGORIES, getCategory } from "@/data/catalog";
import { buildIndex, didYouMean, runSearch, saveRecent } from "@/lib/toolSearch";
import { cn } from "@/lib/utils";

type SortMode = "newest" | "trending" | "updated" | "popular" | "editors";

export default function ToolsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  // The searched words live in the address (?q=...), so they stay after a refresh, the back button or a shared link.
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const setQuery = (value: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("q", value);
      else next.delete("q");
      return next;
    }, { replace: true });
  const [activeCat, setActiveCat] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [quickFilter, setQuickFilter] = useState("all");

  const sortTabs: { key: SortMode; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
    { key: "popular", icon: Flame, labelKey: "tools.tab.popular" },
    { key: "newest", icon: Sparkles, labelKey: "tools.tab.newest" },
    { key: "trending", icon: TrendingUp, labelKey: "tools.tab.trending" },
    { key: "updated", icon: RefreshCw, labelKey: "tools.tab.updated" },
    { key: "editors", icon: Star, labelKey: "tools.tab.editors" },
  ];

  const sorted = useMemo(() => {
    const list = [...TOOLS];
    switch (sortMode) {
      case "newest":
        return list.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
      case "trending":
        return list.filter((tool) => tool.trending);
      case "updated":
        return list.sort((a, b) => new Date(b.updatedAt || b.addedAt || 0).getTime() - new Date(a.updatedAt || a.addedAt || 0).getTime());
      case "editors":
        return list.filter((tool) => tool.editorsPick);
      case "popular":
      default:
        return list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
  }, [sortMode]);

  const index = useMemo(
    () => buildIndex(TOOLS, (k) => String(t(k)), (slug) => { const c = getCategory(slug); return c ? String(t(c.nameKey)) : ""; }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    const scores = q ? new Map(runSearch(index, q).map((h) => [h.tool.slug, h.score])) : null;
    const list = sorted.filter((tool) => {
      let matchCat = activeCat === "all" || tool.category === activeCat;
      if (quickFilter !== "all") {
        if (quickFilter === "audio") {
          matchCat = matchCat && ((tool.tags || []).includes("speech") || (tool.keywords || []).some((k) => k.includes("speech") || k.includes("audio")) || tool.category === "utilities");
        } else if (quickFilter === "pdf") {
          matchCat = matchCat && tool.category === "pdf";
        } else if (quickFilter === "images") {
          matchCat = matchCat && tool.category === "image";
        } else if (quickFilter === "dev") {
          matchCat = matchCat && tool.category === "dev";
        } else if (quickFilter === "calculators") {
          matchCat = matchCat && (tool.category === "finance" || tool.category === "converters" || (tool.tags || []).includes("calculator"));
        }
      }
      return matchCat && (!scores || scores.has(tool.slug));
    });
    // while searching, the best match comes first
    return scores ? list.sort((a, b) => (scores.get(b.slug) || 0) - (scores.get(a.slug) || 0)) : list;
  }, [sorted, query, activeCat, quickFilter, index]);

  const suggestion = useMemo(() => (query.trim() && filtered.length === 0 ? didYouMean(index, query) : null), [index, query, filtered.length]);

  // remember a search once the visitor stopped typing
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const id = window.setTimeout(() => saveRecent(q), 1500);
    return () => window.clearTimeout(id);
  }, [query]);

  return (
    <>
      <Seo title={t("nav.tools")} description="Browse all tools available on ZidroTool." />

      <section className="nv-dir-hero">
        <div className="nv-dir-aurora" aria-hidden="true"><i /><i /><i /></div>
        <div className="container-page relative py-14 sm:py-20">
          <Breadcrumbs items={[{ label: t("breadcrumbs.tools") }]} />

          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_360px]">
            <div className="max-w-3xl">
              <span className="nv-badge-lg nv-enter" style={{ "--d": "0ms" } as React.CSSProperties}>
                <span className="nv-live" />
                {t("hero.badge")}
              </span>
              <h1 className="nv-dir-title mt-5">
                <span className="nv-enter" style={{ "--d": "120ms" } as React.CSSProperties}>{t("section.featured")}</span>
                <br />
                <span className="nv-grad nv-enter" style={{ "--d": "260ms" } as React.CSSProperties}>{t("nav.tools")}</span>
              </h1>
              <p className="nv-enter mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg" style={{ "--d": "400ms" } as React.CSSProperties}>
                {t("hero.subtitle")}
              </p>

              <div className="nv-enter nv-search-wrap mt-8 !max-w-2xl" style={{ "--d": "520ms" } as React.CSSProperties}>
                <SearchSuggestBox
                  tone="dark"
                  value={query}
                  onChange={setQuery}
                  onSubmit={(v) => { setQuery(v); saveRecent(v); document.getElementById("tools-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  onPick={(tool) => { saveRecent(query); navigate(`/tools/${tool.slug}`); }}
                />
              </div>
            </div>

            <div className="nv-dir-art hidden lg:block" aria-hidden="true">
              <div className="nv-dir-ring" />
              <div className="nv-dir-ring nv-dir-ring-2" />
              <div className="nv-dir-stat"><Sparkles className="h-6 w-6" /><div><b>{TOOLS.length}+</b><small>{t("hero.stat.tools")}</small></div></div>
              <span className="nv-icon nv-dir-chip nv-dir-chip-1" style={{ "--k": 0 } as React.CSSProperties}><SearchIcon className="h-5 w-5" /></span>
              <span className="nv-icon nv-dir-chip nv-dir-chip-2" style={{ "--k": 2 } as React.CSSProperties}><Star className="h-5 w-5" /></span>
              <span className="nv-icon nv-dir-chip nv-dir-chip-3" style={{ "--k": 4 } as React.CSSProperties}><Flame className="h-5 w-5" /></span>
            </div>
          </div>

          <div className="nv-enter mt-10 flex flex-wrap gap-2" style={{ "--d": "640ms" } as React.CSSProperties}>
            <button onClick={() => setActiveCat("all")} className={cn("nv-cpill", activeCat === "all" && "is-active")}>{t("common.all")}</button>
            {CATEGORIES.slice(0, 7).map((cat) => (
              <button key={cat.slug} onClick={() => setActiveCat(cat.slug)} className={cn("nv-cpill", activeCat === cat.slug && "is-active")}>
                {t(cat.nameKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main id="tools-results" className="container-page scroll-mt-24 py-12 sm:py-16">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">ZidroTool directory</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{t("nav.tools")}</h2>
            <p className="mt-1 text-sm text-slate-400">{t("tool.results.count", { count: filtered.length })}</p>
            {query.trim() && (
              <button type="button" onClick={() => setQuery("")} className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1.5 text-xs font-bold text-indigo-200 transition hover:bg-indigo-400/20">
                <SearchIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">“{query.trim()}”</span>
                <X className="h-3.5 w-3.5 shrink-0" aria-label={t("search.clear", { defaultValue: "Clear" })} />
              </button>
            )}
          </div>

          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
            {sortTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSortMode(tab.key)}
                className={cn("nv-cpill nv-cpill-sm", sortMode === tab.key && "is-active")}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-ink-400"><Filter className="h-3.5 w-3.5" /> Quick</span>
          {[
            ["all", t("common.all")],
            ["images", "Images"],
            ["pdf", "PDF"],
            ["audio", "Audio"],
            ["dev", "Dev"],
            ["calculators", "Calculators"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setQuickFilter(key)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-all", quickFilter === key ? "border-indigo-400 bg-indigo-500 text-white shadow-sm" : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-indigo-400/60 hover:text-white")}>{label}</button>
          ))}
        </div>

        <div className="mt-7"><AdSlot variant="inline" /></div>

        {filtered.length === 0 ? (
          <EmptyState icon={SearchX} title={t("search.empty")} description={t("search.hint")} action={
            <div className="flex flex-col items-center gap-3">
              {suggestion && <button onClick={() => setQuery(suggestion)} className="text-sm font-bold text-indigo-300 underline-offset-2 hover:underline">{t("search.didYouMean", { name: suggestion, defaultValue: "Did you mean “{{name}}”?" })}</button>}
              <button onClick={() => { setQuery(""); setActiveCat("all"); setQuickFilter("all"); }} className="btn-primary">{t("common.all")}</button>
            </div>
          } className="mt-10" />
        ) : (
          <div className="nv-dgrid mt-8" onPointerMove={(e) => { const c = (e.target as HTMLElement).closest(".nv-dcard") as HTMLElement | null; if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", `${e.clientX - r.left}px`); c.style.setProperty("--my", `${e.clientY - r.top}px`); }}>
            {filtered.map((tool, i) => <div key={tool.slug} className="nv-dcell" style={{ "--i": Math.min(i, 14) } as React.CSSProperties}><ToolCard tool={tool} variant="nv" /></div>)}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <a href="#main-content" className="nv-btn nv-btn-ghost"><ArrowDown className="h-4 w-4" /> {t("section.viewAll")}</a>
        </div>
        <div className="mt-8 pb-4"><AdSlot variant="footer" /></div>
      </main>
    </>
  );
}
