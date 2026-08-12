import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon, Clock, ChevronLeft, ChevronRight, SearchX, Folder } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { Newsletter } from "@/components/Newsletter";
import { EmptyState } from "@/components/EmptyState";
import { 
  BLOG_CATEGORIES, 
  getBlogCategory, 
  getAuthor, 
  getCategoryPostCount, 
  BLOG_POSTS, 
  BlogPost 
} from "@/data/blog";
import { formatDate, cn } from "@/lib/utils";

const PER_PAGE = 9;

function PostCover({ post }: { post: BlogPost }) {
  const { t } = useTranslation();
  const defaultImage = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80";
  const imageSrc = post.coverImage || defaultImage;

  return (
    <div className="relative w-full h-40 overflow-hidden bg-ink-100 dark:bg-ink-800">
      <img
        src={imageSrc}
        alt={t(post.titleKey)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = defaultImage;
        }}
      />
    </div>
  );
}

export default function BlogCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();

  const category = slug ? getBlogCategory(slug) : undefined;
  
  // حماية: جلب المقالات المتوافقة مع هذا القسم بأمان
  const allPosts = useMemo(() => {
    if (!slug) return [];
    return BLOG_POSTS.filter((p) => p.category === slug);
  }, [slug]);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPosts;
    return allPosts.filter((p) => {
      const title = (t(p.titleKey) || "").toLowerCase();
      const tags = (p.tags || []).join(" ").toLowerCase();
      return title.includes(q) || tags.includes(q) || p.slug.includes(q);
    });
  }, [allPosts, query, t]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  if (!category) {
    return (
      <div className="container-page py-20 text-center">
        <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mb-2">
          {t("blog.category.notFound") || "القسم غير موجود"}
        </h2>
        <p className="text-ink-500 mb-6">لم يتم العثور على القسم المطلوب.</p>
        <Link to="/blog" className="btn-primary inline-flex">
          {t("blog.back") || "العودة للمدونة"}
        </Link>
      </div>
    );
  }

  const postCount = slug ? getCategoryPostCount(slug) : 0;

  return (
    <>
      <Seo 
        title={t(category.nameKey)} 
        description={category.descKey ? t(category.descKey) : t(category.nameKey)} 
      />

      <div className="container-page py-8 max-w-6xl mx-auto px-4">
        <Breadcrumbs items={[
          { label: t("breadcrumbs.blog") || "Blog", to: "/blog" },
          { label: t(category.nameKey) },
        ]} />

        {/* Category Header */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
            <Folder className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">
              {t(category.nameKey)}
            </h1>
            {category.descKey && (
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {t(category.descKey)}
              </p>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link 
            to="/blog" 
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
          >
            {t("blog.allCategories") || "جميع الأقسام"}
          </Link>

          {BLOG_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/blog/category/${c.slug}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                c.slug === slug 
                  ? "bg-brand-600 text-white shadow-sm" 
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
              )}
            >
              {t(c.nameKey)}
            </Link>
          ))}
        </div>

        {/* Search & Count */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={t("search.placeholder") || "بحث في المقالات..."}
              className="input pl-10 w-full"
            />
          </div>
          <p className="shrink-0 text-sm text-ink-500 dark:text-ink-400">
            {postCount} {t("hero.stat.tools") || "مقالات"}
          </p>
        </div>

        <div className="mt-4">
          <AdSlot variant="inline" />
        </div>

        {/* Posts Grid */}
        {paginated.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t("search.empty") || "لا توجد نتائج"}
            description={t("search.hint") || "جرّب البحث بكلمة أخرى."}
            action={
              <button onClick={() => setQuery("")} className="btn-primary">
                إعادة التعيين
              </button>
            }
            className="mt-8"
          />
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((post) => {
              const author = getAuthor(post.authorSlug);

              return (
                <Link 
                  key={post.slug} 
                  to={`/blog/${post.slug}`} 
                  className="card card-hover group overflow-hidden border border-ink-100 dark:border-ink-800 rounded-xl"
                >
                  <PostCover post={post} />

                  <div className="p-5">
                    <span className="badge-neutral text-[11px] px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300">
                      {t(category.nameKey)}
                    </span>

                    <h3 className="mt-3 font-semibold text-ink-900 group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400 line-clamp-2">
                      {t(post.titleKey)}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">
                      {t(post.excerptKey)}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-xs text-ink-400 dark:text-ink-500 pt-3 border-t border-ink-50 dark:border-ink-800">
                      {author && (
                        <span className="font-medium text-ink-700 dark:text-ink-300">
                          {author.name}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readingTime} min
                      </span>
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
            <button 
              onClick={() => setPage(Math.max(1, currentPage - 1))} 
              disabled={currentPage === 1} 
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  "h-9 w-9 rounded-lg text-sm font-medium transition-all",
                  currentPage === i + 1 
                    ? "bg-brand-600 text-white shadow-sm" 
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
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