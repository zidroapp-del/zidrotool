import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, ChevronLeft, Share2, Check, Twitter, Linkedin, ArrowLeft, ArrowRight } from "lucide-react";
import { Seo } from "../components/Seo";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { getPost, getRelatedPosts, getAuthor, getBlogCategory } from "../data/blog";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const post = slug ? getPost(slug) : undefined;
  const [shared, setShared] = useState(false);

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-ink-900 dark:text-ink-100 mb-4">404</h1>
        <p className="text-lg text-ink-600 dark:text-ink-400 mb-6">
          {t("blog.articleNotFound") || "المقال غير موجود."}
        </p>
        <Link
          to="/blog"
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t("blog.back") || "العودة للمدونة"}
        </Link>
      </div>
    );
  }

  const author = getAuthor(post.authorSlug);
  const category = getBlogCategory(post.category);
  const related = getRelatedPosts(post, 3);

  const getPostTitle = (titleKey: string, slug: string) => {
    const val = t(titleKey);
    if (val && val !== titleKey) return val;
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getPostExcerpt = (excerptKey: string) => {
    const val = t(excerptKey);
    if (val && val !== excerptKey) return val;
    return "Click to read the full article and explore more details about this topic.";
  };

  const getPostBody = (bodyKey: string) => {
    const val = t(bodyKey);
    if (val && val !== bodyKey) return val;
    return "<p>Full article content is not available in the selected language.</p>";
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <>
      <Seo
        title={t(post.seoTitleKey || post.titleKey) !== (post.seoTitleKey || post.titleKey) ? t(post.seoTitleKey || post.titleKey) : getPostTitle(post.titleKey, post.slug)}
        description={t(post.seoDescKey || post.excerptKey) !== (post.seoDescKey || post.excerptKey) ? t(post.seoDescKey || post.excerptKey) : getPostExcerpt(post.excerptKey)}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/blog")}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 dark:text-ink-400 hover:text-primary-600 mb-6"
        >
          {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {t("blog.back") || "العودة للمدونة"}
        </button>

        {category && (
          <div className="mb-3">
            <Link
              to={`/blog/category/${category.slug}`}
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300"
            >
              {t(category.nameKey)}
            </Link>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 dark:text-ink-100 mb-4">
          {getPostTitle(post.titleKey, post.slug)}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-ink-500 dark:text-ink-400 mb-6 pb-4 border-b border-ink-100 dark:border-ink-800">
          {author && <span className="font-medium text-ink-700 dark:text-ink-300">{author.name}</span>}
          <span>•</span>
          <span>{post.date}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.readingTime} min read
          </span>
        </div>

        {post.coverImage && (
          <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-8">
            <img src={post.coverImage} alt={t(post.titleKey)} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none mb-10 text-ink-800 dark:text-ink-200">
          <p className="text-lg font-semibold leading-relaxed mb-4">{getPostExcerpt(post.excerptKey)}</p>
          <div dangerouslySetInnerHTML={{ __html: getPostBody(post.bodyKey) }} />
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-ink-50 dark:bg-ink-900 mb-12">
          <button onClick={handleShare} className="px-4 py-2 bg-white dark:bg-ink-800 border rounded-lg text-sm font-medium flex items-center gap-2">
            {shared ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
            {shared ? "تم النسخ" : "مشاركة"}
          </button>
        </div>

        {related.length > 0 && (
          <div className="pt-8 border-t border-ink-100 dark:border-ink-800">
            <h3 className="text-xl font-bold text-ink-900 dark:text-ink-100 mb-4">مقالات ذات صلة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((rel) => (
                <Link key={rel.slug} to={`/blog/${rel.slug}`} className="p-4 rounded-xl border bg-white dark:bg-ink-900 hover:shadow-md transition">
                  <h4 className="font-bold text-sm text-ink-900 dark:text-ink-100 line-clamp-2">{t(rel.titleKey)}</h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}