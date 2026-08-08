import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, ChevronLeft, Share2, Check, Twitter, Linkedin, ListOrdered, ArrowUp } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { Newsletter } from "@/components/Newsletter";
import { getPost, getRelatedPosts, getAuthor, getBlogCategory } from "@/data/blog";
import { formatDate, copyToClipboard, cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function generateToc(bodyHtml: string): TocItem[] {
  const headings = bodyHtml.match(/<h([23])[^>]*>(.*?)<\/h\1>/gi);
  if (!headings) return [];
  return headings.map((h, i) => {
    const levelMatch = h.match(/<h([23])/i);
    const textMatch = h.match(/>(.*?)</);
    const level = levelMatch ? parseInt(levelMatch[1]) : 2;
    const text = textMatch ? textMatch[1].replace(/<[^>]+>/g, "") : "";
    return { id: `heading-${i}`, text, level };
  });
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const post = slug ? getPost(slug) : undefined;
  const [shared, setShared] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
      setShowBackToTop(scrollTop > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const bodyHtml = useMemo(() => {
    if (!post) return "";
    return (t(post.bodyKey) as string).replace(/\n/g, "<br/>");
  }, [post, t]);

  const tocItems = useMemo(() => generateToc(bodyHtml), [bodyHtml]);

  useEffect(() => {
    if (tocItems.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHeading(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [tocItems]);

  if (!post) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-ink-500">{t("blog.article.notFound")}</p>
        <Link to="/blog" className="btn-primary mt-4">{t("blog.back")}</Link>
      </div>
    );
  }

  const author = getAuthor(post.authorSlug);
  const category = getBlogCategory(post.category);
  const related = getRelatedPosts(post, 3);

  const handleShare = async () => {
    if (await copyToClipboard(window.location.href)) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t(post.titleKey),
    description: t(post.excerptKey),
    author: author ? { "@type": "Person", name: author.name, jobTitle: author.role } : undefined,
    datePublished: post.date,
    publisher: { "@type": "Organization", name: "ZidroTool" },
    articleSection: category ? t(category.nameKey) : undefined,
    keywords: post.tags.join(", "),
  };

  const seoTitle = post.seoTitleKey ? (t(post.seoTitleKey) as string) : (t(post.titleKey) as string);
  const seoDesc = post.seoDescKey ? (t(post.seoDescKey) as string) : (t(post.excerptKey) as string);

  return (
    <>
      <Seo title={seoTitle} description={seoDesc} type="article" jsonLd={articleJsonLd} />

      {/* Reading progress bar */}
      <div className="fixed left-0 top-0 z-50 h-1 bg-brand-600 transition-all duration-150" style={{ width: `${readingProgress}%` }} />

      <div className="container-page py-8">
        <Breadcrumbs items={[
          { label: t("breadcrumbs.blog"), to: "/blog" },
          ...(category ? [{ label: t(category.nameKey), to: `/blog/category/${category.slug}` }] : []),
          { label: t(post.titleKey) },
        ]} />

        <Link to="/blog" className="mt-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400">
          <ChevronLeft className="h-4 w-4" />
          {t("blog.back")}
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Main article */}
          <article ref={articleRef} className="lg:col-span-8">
            {category && <Link to={`/blog/category/${category.slug}`} className="badge-brand">{t(category.nameKey)}</Link>}
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100">
              {t(post.titleKey)}
            </h1>

            {/* Author + meta */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-400 dark:text-ink-500">
              {author && (
                <Link to={`/blog/author/${author.slug}`} className="flex items-center gap-2 hover:text-brand-600">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white", author.avatar)}>
                    {author.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className="font-medium text-ink-700 dark:text-ink-300">{author.name}</span>
                  <span className="text-xs text-ink-400">{author.role}</span>
                </Link>
              )}
              <span>·</span>
              <span>{formatDate(post.date, i18n.language)}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t("blog.readingTime", { count: post.readingTime })}</span>
            </div>

            {/* Share buttons */}
            <div className="mt-4 flex items-center gap-2">
              <button onClick={handleShare} className="btn-secondary btn-sm">
                {shared ? <Check className="h-4 w-4 text-success-700" /> : <Share2 className="h-4 w-4" />}
                {shared ? t("tool.share.copied") : t("blog.share")}
              </button>
              {author?.twitter && (
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(t(post.titleKey) + " — ZidroTool")}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-sm"
                >
                  <Twitter className="h-4 w-4" />
                  Tweet
                </a>
              )}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-sm"
              >
                <Linkedin className="h-4 w-4" />
                Share
              </a>
            </div>

            {/* Cover */}
            <div className={cn("mt-6 h-64 rounded-2xl bg-gradient-to-br", post.coverGradient)} />

            {/* Excerpt */}
            <p className="mt-8 text-lg font-medium leading-relaxed text-ink-700 dark:text-ink-300">{t(post.excerptKey)}</p>

            {/* Body */}
            <div className="prose-zt mt-6">
              <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            </div>

            <div className="my-8"><AdSlot variant="inline" /></div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="badge-neutral">#{tag}</span>
                ))}
              </div>
            )}

            {/* Author card */}
            {author && (
              <Link to={`/blog/author/${author.slug}`} className="card card-hover mt-8 flex items-center gap-4 p-5">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white", author.avatar)}>
                  {author.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-ink-900 dark:text-ink-100">{author.name}</p>
                  <p className="text-xs text-brand-600 dark:text-brand-400">{author.role}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-ink-500 dark:text-ink-400">{t(author.bioKey)}</p>
                </div>
              </Link>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Table of contents */}
              {tocItems.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{t("blog.toc")}</h3>
                  </div>
                  <nav className="mt-3 space-y-1">
                    {tocItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "block py-1 text-sm transition-colors",
                          item.level === 3 ? "pl-4" : "",
                          activeHeading === item.id
                            ? "font-medium text-brand-600 dark:text-brand-400"
                            : "text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-200",
                        )}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              <AdSlot variant="sidebar" />

              {/* Related posts */}
              {related.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{t("blog.related")}</h3>
                  <div className="mt-3 space-y-3">
                    {related.map((p) => {
                      const rCat = getBlogCategory(p.category);
                      return (
                        <Link key={p.slug} to={`/blog/${p.slug}`} className="block group">
                          <span className="text-[10px] font-medium text-ink-400">{rCat && t(rCat.nameKey)}</span>
                          <p className="mt-0.5 text-sm font-medium text-ink-700 transition-colors group-hover:text-brand-600 dark:text-ink-300 dark:group-hover:text-brand-400">
                            {t(p.titleKey)}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-400">{formatDate(p.date, i18n.language)} · {p.readingTime}m</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Related posts grid */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-ink-200 pt-12 dark:border-ink-800">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-100">{t("blog.related")}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => {
                const rCat = getBlogCategory(p.category);
                return (
                  <Link key={p.slug} to={`/blog/${p.slug}`} className="card card-hover group overflow-hidden">
                    <div className={cn("h-32 bg-gradient-to-br", p.coverGradient)} />
                    <div className="p-4">
                      {rCat && <span className="badge-neutral text-[10px]">{t(rCat.nameKey)}</span>}
                      <h3 className="mt-2 font-semibold text-ink-900 group-hover:text-brand-600 dark:text-ink-100">{t(p.titleKey)}</h3>
                      <p className="mt-2 text-xs text-ink-400">{formatDate(p.date, i18n.language)} · {t("blog.readingTime", { count: p.readingTime })}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-12">
          <Newsletter />
        </div>
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95 animate-fade-in"
          aria-label={t("blog.backToTop")}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
