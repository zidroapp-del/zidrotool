import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon, Clock, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { Newsletter } from "@/components/Newsletter";
import { EmptyState } from "@/components/EmptyState";
import { BLOG_CATEGORIES, getBlogCategory, postsByCategory, getCategoryPostCount } from "@/data/blog";
import { getAuthor } from "@/data/blog";
import { getIcon } from "@/lib/icons";
import { formatDate, cn } from "@/lib/utils";

const PER_PAGE = 9;

export default function BlogCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const category = getBlogCategory(slug || "");
  const allPosts = slug ? postsByCategory(slug) : [];

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPosts;
    return allPosts.filter((p) => {
      const tags = p.tags.join(" ").toLowerCase();
      return p.slug.includes(q) || tags.includes(q);
    });
  }, [allPosts, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  if (!category) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-ink-500">{t("blog.category.notFound")}</p>
        <Link to="/blog" className="btn-primary mt-4">{t("blog.back")}</Link>
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
  const postCount = getCategoryPostCount(slug!);

  return (
    <>
      <Seo title={t(category.nameKey)} description={t(category.descKey)} />
      <div className="container-page py-8">
        <Breadcrumbs items={[
          { label: t("breadcrumbs.blog"), to: "/blog" },
          { label: t(category.nameKey) },
        ]} />

        {/* Category hero */}
        <div className="mt-6 flex items-center gap-4 animate-slide-up">
          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", colorMap[category.color] || colorMap.brand)}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t(category.nameKey)}</h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t(category.descKey)}</p>
          </div>
        </div>

        {/* Category pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/blog" className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300">
            {t("blog.allCategories")}
          </Link>
          {BLOG_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/blog/category/${c.slug}`}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
                c.slug === slug ? "bg-brand-600 text-white shadow-sm" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
              )}
            >
              {t(c.nameKey)}
            </Link>
          ))}
        </div>

        {/* Search */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={t("blog.search")}
              className="input pl-10"
              aria-label={t("blog.search")}
            />
          </div>
          <p className="shrink-0 text-sm text-ink-500 dark:text-ink-400">
            {postCount} {t("blog.articles")}
          </p>
        </div>

        <div className="mt-4"><AdSlot variant="inline" /></div>

        {/* Posts grid */}
        {paginated.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t("blog.empty")}
            description={t("search.hint")}
            action={<button onClick={() => setQuery("")} className="btn-primary">{t("category.clearFilters")}</button>}
            className="mt-6"
          />
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((post) => {
              const author = getAuthor(post.authorSlug);
              return (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="card card-hover group overflow-hidden">
                  <div className={cn("h-40 bg-gradient-to-br", post.coverGradient)} />
                  <div className="p-5">
                    <span className="badge-neutral">{t(category.nameKey)}</span>
                    <h3 className="mt-3 font-semibold text-ink-900 group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400">
                      {t(post.titleKey)}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{t(post.excerptKey)}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-ink-400 dark:text-ink-500">
                      {author && (
                        <Link to={`/blog/author/${author.slug}`} className="flex items-center gap-1 hover:text-brand-600" onClick={(e) => e.stopPropagation()}>
                          <div className={cn("flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white", author.avatar)}>
                            {author.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          {author.name}
                        </Link>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime}m</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="btn-secondary btn-sm disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn("h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200",
                  currentPage === i + 1 ? "bg-brand-600 text-white shadow-sm" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
                )}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="btn-secondary btn-sm disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-12">
          <Newsletter />
        </div>
      </div>
    </>
  );
}
