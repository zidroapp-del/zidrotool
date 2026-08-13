import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon, Filter, SearchX, Clock, Flame, TrendingUp, Star, Sparkles, RefreshCw } from "lucide-react";
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
  const [quickFilter, setQuickFilter] = useState<string>("all");

  const sortTabs: { key: SortMode; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
    { key: "popular", icon: Flame, labelKey: "tools.tab.popular" },
    { key: "newest", icon: Sparkles, labelKey: "tools.tab.newest" },
    { key: "trending", icon: TrendingUp, labelKey: "tools.tab.trending" },
    { key: "updated", icon: RefreshCw, labelKey: "tools.tab.updated" },
    { key: "editors", icon: Star, labelKey: "tools.tab.editors" },
  ];

  const sorted = useMemo(() => {
    let list = [...TOOLS];
    switch (sortMode) {
      case "newest":
        list.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
        break;
      case "trending":
        list = list.filter((tool) => tool.trending);
        break;
      case "updated":
        list.sort((a, b) => new Date(b.updatedAt || b.addedAt || 0).getTime() - new Date(a.updatedAt || a.addedAt || 0).getTime());
        break;
      case "popular":
        list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case "editors":
        list = list.filter((tool) => tool.editorsPick);
        break;
    }
    return list;
  }, [sortMode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((tool) => {
      let matchCat = activeCat === "all" || tool.category === activeCat;
      if (quickFilter && quickFilter !== "all") {
        switch (quickFilter) {
          case "audio":
            matchCat = matchCat && ((tool.tags || []).includes("speech") || (tool.keywords || []).some((k) => k.includes("speech") || k.includes("audio")) || tool.category === "utilities");
            break;
          case "pdf":
            matchCat = matchCat && tool.category === "pdf";
            break;
          case "images":
            matchCat = matchCat && tool.category === "image";
            break;
          case "dev":
            matchCat = matchCat && tool.category === "dev";
            break;
          case "calculators":
            matchCat = matchCat && (tool.category === "finance" || tool.category === "converters" || (tool.tags || []).includes("calculator"));
            break;
          default:
            break;
        }
      }
      const name = t(tool.nameKey) as string;
      const desc = t(tool.descKey) as string;
      const matchQuery = !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || (tool.keywords || []).some((k) => k.includes(q));
      return matchCat && matchQuery;
    });
  }, [sorted, query, activeCat, t, quickFilter]);

  return (
    <>
      <Seo title={t("nav.tools")} description="Browse all tools available on ZidroTool." />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("breadcrumbs.tools") }]} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("nav.tools")}</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("tool.results.count", { count: TOOLS.length })}</p>
        </div>

        {/* Sort tabs */}
        <div className="mt-6 flex items-center gap-1 overflow-x-auto border-b border-ink-200 dark:border-ink-800">
          {sortTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSortMode(tab.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-200",
                sortMode === tab.key
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {t(tab.labelKey)}
              {sortMode === tab.key && <span className="ml-1 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{filtered.length}</span>}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search.placeholder")} className="input pl-10" aria-label={t("common.search")} />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-4 w-4 shrink-0 text-ink-400" />
            <button onClick={() => setActiveCat("all")} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95", activeCat === "all" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300")}>{t("common.all")}</button>
            {CATEGORIES.map((cat) => (
              <button key={cat.slug} onClick={() => setActiveCat(cat.slug)} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95", activeCat === cat.slug ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300")}>{t(cat.nameKey)}</button>
            ))}
          </div>
        </div>

        <div className="mt-4"><AdSlot variant="inline" /></div>

        {filtered.length === 0 ? (
          <EmptyState icon={SearchX} title={t("search.empty")} description={t("search.hint")} action={<button onClick={() => { setQuery(""); setActiveCat("all"); }} className="btn-primary">{t("common.all")}</button>} className="mt-8" />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
          </div>
        )}

        <div className="mt-8 pb-4"><AdSlot variant="footer" /></div>
      </div>
    </>
  );
}
