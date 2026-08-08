import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon, Clock, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { Newsletter } from "@/components/Newsletter";
import { EmptyState } from "@/components/EmptyState";
import { BLOG_POSTS, BLOG_CATEGORIES, getFeaturedPosts, getRecentPosts, getAuthor, getBlogCategory, getCategoryPostCount } from "@/data/blog";
import { getIcon } from "@/lib/icons";
import { formatDate, cn } from "@/lib/utils";

export default function BlogPage() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");

  const featured = getFeaturedPosts(3);
  const recent = getRecentPosts(6);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return BLOG_POSTS.filter((p) => {
      const tags = p.tags.join(" ").toLowerCase();
      const cat = getBlogCategory(p.category);
      const catName = cat ? (t(cat.nameKey) as string).toLowerCase() : "";
      return p.slug.includes(q) || tags.includes(q) || catName.includes(q);
    }).slice(0, 12);
  }, [query, t]);

  const showSearch = query.trim().length > 0;

  return (
    <>
      <Seo title={t("blog.title")} description={t("blog.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("breadcrumbs.blog") }]} />

        {/* Blog hero */}
        <div className="mt-6 text-center animate-slide-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t("blog.subtitle")}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl dark:text-ink-100">
            {t("blog.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-500 dark:text-ink-400">
            {t("blog.hero.desc")}
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto mt-8 max-w-xl">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("blog.search")}
              className="input pl-10"
              aria-label={t("blog.search")}
            />
          </div>
        </div>

        {/* Search results */}
        {showSearch && (
          <div className="mt-8">
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {t("blog.searchResults")}: {filtered.length}
            </p>
            {filtered.length === 0 ? (
              <EmptyState icon={SearchIcon} title={t("blog.empty")} description={t("search.hint")} className="mt-4" />
            ) : (
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((post) => {
                  const cat = getBlogCategory(post.category);
                  return (
                    <Link key={post.slug} to={`/blog/${post.slug}`} className="card card-hover group overflow-hidden">
                      <div className={cn("h-32 bg-gradient-to-br", post.coverGradient)} />
                      <div className="p-5">
                        {cat && <span className="badge-neutral">{t(cat.nameKey)}</span>}
                        <h3 className="mt-2 font-semibold text-ink-900 group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400">
                          {t(post.titleKey)}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{t(post.excerptKey)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Normal blog content (hidden during search) */}
        {!showSearch && (
          <>
            {/* Categories grid */}
            <div className="mt-12">
              <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("blog.categories")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {BLOG_CATEGORIES.map((cat) => {
                  const Icon = getIcon(cat.icon);
                  const count = getCategoryPostCount(cat.slug);
                  const colorMap: Record<string, string> = {
                    brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400",
                    accent: "bg-accent-50 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400",
                    success: "bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-600",
                    warning: "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600",
                    danger: "bg-danger-50 text-danger dark:bg-danger/15 dark:text-danger",
                  };
                  return (
                    <Link
                      key={cat.slug}
                      to={`/blog/category/${cat.slug}`}
                      className="card card-hover group flex flex-col items-center gap-2 p-4 text-center"
                    >
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", colorMap[cat.color] || colorMap.brand)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-ink-700 dark:text-ink-300">{t(cat.nameKey)}</span>
                      <span className="text-[10px] text-ink-400 dark:text-ink-500">{count} {t("blog.articles")}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Featured posts */}
            {featured.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("blog.featured")}</h2>
                </div>
                <div className="mt-4 grid gap-6 lg:grid-cols-3">
                  {featured.map((post) => {
                    const cat = getBlogCategory(post.category);
                    const author = getAuthor(post.authorSlug);
                    return (
                      <Link key={post.slug} to={`/blog/${post.slug}`} className="card card-hover group overflow-hidden">
                        <div className={cn("h-44 bg-gradient-to-br", post.coverGradient)} />
                        <div className="p-5">
                          <div className="flex items-center gap-2">
                            {cat && <span className="badge-brand">{t(cat.nameKey)}</span>}
                            <span className="badge-neutral">{t("blog.featured")}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-ink-900 group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400">
                            {t(post.titleKey)}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{t(post.excerptKey)}</p>
                          <div className="mt-4 flex items-center gap-2 text-xs text-ink-400 dark:text-ink-500">
                            {author && <span>{author.name}</span>}
                            <span>·</span>
                            <span>{formatDate(post.date, i18n.language)}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime}m</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8"><AdSlot variant="inline" /></div>

            {/* Recent posts */}
            <div className="mt-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("blog.latest")}</h2>
                </div>
                <Link to="/blog/category/tutorials" className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
                  {t("section.viewAll")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((post) => {
                  const cat = getBlogCategory(post.category);
                  const author = getAuthor(post.authorSlug);
                  return (
                    <Link key={post.slug} to={`/blog/${post.slug}`} className="card card-hover group overflow-hidden">
                      <div className={cn("h-40 bg-gradient-to-br", post.coverGradient)} />
                      <div className="p-5">
                        {cat && <span className="badge-neutral">{t(cat.nameKey)}</span>}
                        <h3 className="mt-3 font-semibold text-ink-900 group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400">
                          {t(post.titleKey)}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{t(post.excerptKey)}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-ink-400 dark:text-ink-500">
                          {author && (
                            <Link to={`/blog/author/${author.slug}`} className="flex items-center gap-1.5 hover:text-brand-600" onClick={(e) => e.stopPropagation()}>
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
            </div>
          </>
        )}

        <div className="mt-12">
          <Newsletter />
        </div>
      </div>
    </>
  );
}
