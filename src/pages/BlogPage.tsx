import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, BookOpen, Search, SearchX } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BLOG_CATEGORIES, BLOG_POSTS, getAuthor, getBlogCategory } from "@/data/blog";
import { EmptyState } from "@/components/EmptyState";

export default function BlogPage() {
  const { t } = useTranslation();
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getPostTitle = (titleKey: string, slug: string) => {
    const val = t(titleKey);
    if (val && val !== titleKey) return val;
    return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getPostExcerpt = (excerptKey: string) => {
    const val = t(excerptKey);
    if (val && val !== excerptKey) return val;
    return "Click to read the full article and explore more details about this topic.";
  };

  // فلترة المقالات حسب التصنيف والبحث
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchCat = selectedCat === "all" || post.category === selectedCat;
      const title = getPostTitle(post.titleKey, post.slug).toLowerCase();
      const matchSearch = !searchQuery || title.includes(searchQuery.toLowerCase()) || post.slug.includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, searchQuery, t]);

  return (
    <>
      <Seo 
        title={t("breadcrumbs.blog") || "Blog"} 
        description={t("hero.subtitle") || "Blog articles and guides"} 
      />

      <div className="container-page py-8 max-w-6xl mx-auto px-4">
        <Breadcrumbs items={[{ label: t("breadcrumbs.blog") || "Blog" }]} />

        <div className="mt-6 pb-6 border-b border-ink-100 dark:border-ink-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-brand-600" />
              <h1 className="text-3xl font-bold text-ink-900 dark:text-ink-100">
                {t("breadcrumbs.blog") || "Blog"}
              </h1>
            </div>
            <p className="text-sm text-ink-500 mt-1">
              {t("section.blog.sub") || "Articles, tutorials and updates"} ({filteredPosts.length})
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search.placeholder") || "Search..."}
              className="input pl-9 w-full text-sm"
            />
          </div>
        </div>

        {/* تصنيفات المدونة */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedCat === "all"
                ? "bg-brand-600 text-white"
                : "bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200"
            }`}
          >
            {t("common.all") || "ALL"}
          </button>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCat(cat.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCat === cat.slug
                  ? "bg-brand-600 text-white"
                  : "bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200"
              }`}
            >
              {t(cat.nameKey) !== cat.nameKey ? t(cat.nameKey) : cat.slug.toUpperCase()}
            </button>
          ))}
        </div>

        {/* عرض المقالات الـ 24 */}
        {filteredPosts.length === 0 ? (
          <EmptyState icon={SearchX} title={t("blog.empty") || "No articles found."} description={t("search.hint") || "Try a different search or clear filters."} className="mt-8" />
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
            const author = getAuthor(post.authorSlug);
            const category = getBlogCategory(post.category);
            const title = getPostTitle(post.titleKey, post.slug);
            const excerpt = getPostExcerpt(post.excerptKey);

            return (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="card border border-ink-100 dark:border-ink-800 rounded-xl overflow-hidden bg-white dark:bg-ink-900 flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-ink-100 dark:bg-ink-800">
                    <img
                      src={post.coverImage || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80"}
                      alt={title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-5">
                    {category && (
                      <span className="inline-block mb-2 text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase">
                        {t(category.nameKey) !== category.nameKey ? t(category.nameKey) : category.slug}
                      </span>
                    )}

                    <h3 className="font-bold text-ink-900 dark:text-ink-100 line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">
                      {excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between text-xs text-ink-400">
                  <span className="font-medium text-ink-700 dark:text-ink-300">
                    {author?.name || "ZidroTool Team"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime} min
                  </span>
                </div>
              </Link>
            );
          })}
          </div>
        )}
      </div>
    </>
  );
}