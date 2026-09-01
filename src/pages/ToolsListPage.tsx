import { useMemo, useState } from "react";
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
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCard } from "@/components/ToolCard";
import { AdSlot } from "@/components/AdSlot";
import { EmptyState } from "@/components/EmptyState";
import { TOOLS, CATEGORIES } from "@/data/catalog";
import { cn } from "@/lib/utils";

type SortMode = "newest" | "trending" | "updated" | "popular" | "editors";

export default function ToolsListPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((tool) => {
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

      const name = String(t(tool.nameKey));
      const desc = String(t(tool.descKey));
      const matchQuery = !q || name.toLocaleLowerCase().includes(q) || desc.toLocaleLowerCase().includes(q) || tool.slug.toLocaleLowerCase().includes(q) || (tool.keywords || []).some((k) => k.toLocaleLowerCase().includes(q)) || (tool.tags || []).some((tag) => tag.toLocaleLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [sorted, query, activeCat, t, quickFilter]);

  return (
    <>
      <Seo title={t("nav.tools")} description="Browse all tools available on ZidroTool." />

      <section className="zt-tools-hero border-b border-orange-100/80 dark:border-ink-800">
        <div className="container-page relative py-14 sm:py-20">
          <Breadcrumbs items={[{ label: t("breadcrumbs.tools") }]} />

          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_340px]">
            <div className="max-w-3xl">
              <span className="zt-warm-pill inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                {t("hero.badge")}
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-ink-950 sm:text-5xl lg:text-6xl dark:text-white">
                {t("section.featured")}
                <br />
                <span className="zt-warm-gradient">{t("nav.tools")}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg dark:text-ink-400">
                {t("hero.subtitle")}
              </p>

              <div className="zt-search-shell mt-8 max-w-2xl">
                <SearchIcon className="h-5 w-5 shrink-0 text-orange-500" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search.placeholder")}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-white"
                  aria-label={t("common.search")}
                />
                <span className="hidden rounded-lg bg-ink-100 px-2 py-1 font-mono text-[10px] text-ink-500 sm:block dark:bg-ink-800 dark:text-ink-400">⌘K</span>
              </div>
            </div>

            <div className="zt-hero-art hidden lg:block" aria-hidden="true">
              <div className="zt-art-orb" />
              <div className="zt-art-card zt-art-card-main">
                <div className="h-9 w-9 rounded-xl bg-orange-100 p-2 text-orange-600"><Sparkles className="h-full w-full" /></div>
                <div><span>277</span><small>{t("hero.stat.tools")}</small></div>
              </div>
              <div className="zt-art-card zt-art-card-small zt-art-one"><SearchIcon /></div>
              <div className="zt-art-card zt-art-card-small zt-art-two"><Star /></div>
              <div className="zt-art-card zt-art-card-small zt-art-three"><ArrowDown /></div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            <button onClick={() => setActiveCat("all")} className={cn("zt-category-pill", activeCat === "all" && "is-active")}>{t("common.all")}</button>
            {CATEGORIES.slice(0, 7).map((cat) => (
              <button key={cat.slug} onClick={() => setActiveCat(cat.slug)} className={cn("zt-category-pill", activeCat === cat.slug && "is-active")}>
                {t(cat.nameKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="container-page py-12 sm:py-16">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">ZidroTool directory</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-ink-950 sm:text-3xl dark:text-white">{t("nav.tools")}</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t("tool.results.count", { count: filtered.length })}</p>
          </div>

          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
            {sortTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSortMode(tab.key)}
                className={cn("zt-sort-pill", sortMode === tab.key && "is-active")}
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
            <button key={key} onClick={() => setQuickFilter(key)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-all", quickFilter === key ? "border-orange-500 bg-orange-500 text-white shadow-sm" : "border-ink-200 bg-white text-ink-500 hover:border-orange-200 hover:text-orange-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400")}>{label}</button>
          ))}
        </div>

        <div className="mt-7"><AdSlot variant="inline" /></div>

        {filtered.length === 0 ? (
          <EmptyState icon={SearchX} title={t("search.empty")} description={t("search.hint")} action={<button onClick={() => { setQuery(""); setActiveCat("all"); setQuickFilter("all"); }} className="btn-primary">{t("common.all")}</button>} className="mt-10" />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((tool) => <ToolCard key={tool.slug} tool={tool} variant="directory" />)}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <a href="#main-content" className="zt-scroll-cue"><ArrowDown className="h-4 w-4" /> {t("section.viewAll")}</a>
        </div>
        <div className="mt-8 pb-4"><AdSlot variant="footer" /></div>
      </main>
    </>
  );
}
