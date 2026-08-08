import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon, Filter, ChevronLeft, ChevronRight, Star, SearchX, ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCard } from "@/components/ToolCard";
import { AdSlot } from "@/components/AdSlot";
import { EmptyState } from "@/components/EmptyState";
import { CATEGORIES, toolsByCategory, getCategory } from "@/data/catalog";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const PER_PAGE = 9;
const SORT_OPTIONS = ["popular", "recent", "alphabetical"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const category = getCategory(slug || "");
  const allTools = slug ? toolsByCategory(slug) : [];

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("popular");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = allTools;
    if (q) {
      result = result.filter((tool) => {
        const name = t(tool.nameKey) as string;
        const desc = t(tool.descKey) as string;
        const kw = tool.keywords?.join(" ").toLowerCase() || "";
        return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || kw.includes(q);
      });
    }
    const sorted = [...result];
    if (sort === "popular") sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    else if (sort === "recent") sorted.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
    else sorted.sort((a, b) => (t(a.nameKey) as string).localeCompare(t(b.nameKey) as string));
    return sorted;
  }, [allTools, query, sort, t]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const featured = allTools.filter((tool) => tool.featured).slice(0, 3);

  if (!category) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-ink-500">Category not found.</p>
        <Link to="/tools" className="btn-primary mt-4">Browse all tools</Link>
      </div>
    );
  }

  const Icon = getIcon(category.icon);
  const colorMap: Record<string, string> = {
    brand: "from-brand-500 to-brand-600",
    accent: "from-accent-500 to-accent-600",
    success: "from-success-600 to-success-700",
    warning: "from-warning-600 to-warning-700",
    danger: "from-danger to-danger-600",
  };

  const resetFilters = () => {
    setQuery("");
    setSort("popular");
    setPage(1);
  };

  return (
    <>
      <Seo title={t(category.nameKey)} description={t(category.descKey)} />
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: t("breadcrumbs.tools"), to: "/tools" },
            { label: t(category.nameKey) },
          ]}
        />

        {/* Category hero */}
        <div className="mt-6 flex items-center gap-4 animate-slide-up">
          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", colorMap[category.color] || colorMap.brand)}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">
              {t(category.nameKey)}
            </h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t(category.descKey)}</p>
          </div>
        </div>

        {/* Category pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/tools"
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
          >
            {t("common.all")}
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
                c.slug === slug
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
              )}
            >
              {t(c.nameKey)}
            </Link>
          ))}
        </div>

        {/* Featured tools */}
        {featured.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                {t("category.featured")}
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        )}

        {/* Search + filters */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={t("search.placeholder")}
              className="input pl-10"
              aria-label={t("common.search")}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="input py-2 text-sm"
              aria-label="Sort by"
            >
              <option value="popular">{t("category.sort.popular")}</option>
              <option value="recent">{t("category.sort.recent")}</option>
              <option value="alphabetical">{t("category.sort.alphabetical")}</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {t("tool.results.count", { count: filtered.length })}
          </p>
        </div>

        {/* Tools grid */}
        {paginated.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t("search.empty")}
            description={t("search.hint")}
            action={
              <button onClick={resetFilters} className="btn-primary">
                {t("category.clearFilters")}
              </button>
            }
            className="mt-6"
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t("common.previous")}</span>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  "h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200",
                  currentPage === i + 1
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              <span className="hidden sm:inline">{t("common.next")}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Sidebar ad */}
        <div className="mt-8">
          <AdSlot variant="footer" />
        </div>

        {/* Explore other categories */}
        <div className="mt-12">
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("category.explore")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.filter((c) => c.slug !== slug).map((c) => {
              const CIcon = getIcon(c.icon);
              return (
                <Link
                  key={c.slug}
                  to={`/category/${c.slug}`}
                  className="card card-hover group flex flex-col items-center gap-2 p-4 text-center"
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", colorMap[c.color] ? `bg-gradient-to-br ${colorMap[c.color]} text-white` : "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400")}>
                    <CIcon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-ink-700 dark:text-ink-300">{t(c.nameKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
