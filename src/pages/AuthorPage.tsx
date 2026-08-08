import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Globe, Github, Twitter, Linkedin, ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Newsletter } from "@/components/Newsletter";
import { EmptyState } from "@/components/EmptyState";
import { getAuthor, postsByAuthor, getBlogCategory, getAuthorPostCount } from "@/data/blog";
import { getIcon } from "@/lib/icons";
import { formatDate, cn } from "@/lib/utils";

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const author = slug ? getAuthor(slug) : undefined;

  if (!author) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-ink-500">{t("blog.author.notFound")}</p>
        <Link to="/blog" className="btn-primary mt-4">{t("blog.back")}</Link>
      </div>
    );
  }

  const posts = postsByAuthor(author.slug);
  const postCount = getAuthorPostCount(author.slug);

  const socialLinks = [
    author.twitter && { icon: Twitter, url: `https://twitter.com/${author.twitter}`, label: "Twitter" },
    author.github && { icon: Github, url: `https://github.com/${author.github}`, label: "GitHub" },
    author.linkedin && { icon: Linkedin, url: `https://linkedin.com/in/${author.linkedin}`, label: "LinkedIn" },
    author.website && { icon: Globe, url: `https://${author.website}`, label: "Website" },
  ].filter(Boolean) as { icon: typeof Twitter; url: string; label: string }[];

  return (
    <>
      <Seo title={author.name} description={t(author.bioKey) as string} />
      <div className="container-page py-8">
        <Breadcrumbs items={[
          { label: t("breadcrumbs.blog"), to: "/blog" },
          { label: author.name },
        ]} />

        <Link to="/blog" className="mt-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400">
          <ArrowLeft className="h-4 w-4" />
          {t("blog.back")}
        </Link>

        {/* Author hero */}
        <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center animate-slide-up">
          <div className={cn("flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl font-bold text-white shadow-lg", author.avatar)}>
            {author.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{author.name}</h1>
            <p className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-400">{author.role}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">{t(author.bioKey)}</p>
            {socialLinks.length > 0 && (
              <div className="mt-4 flex gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500 transition-all hover:bg-brand-50 hover:text-brand-600 dark:bg-ink-800 dark:text-ink-400 dark:hover:bg-brand-900/40 dark:hover:text-brand-400"
                    aria-label={s.label}
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0 rounded-2xl border border-ink-200 px-5 py-3 text-center dark:border-ink-800">
            <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{postCount}</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">{t("blog.author.articles")}</p>
          </div>
        </div>

        {/* Posts by author */}
        <h2 className="mt-12 text-xl font-bold text-ink-900 dark:text-ink-100">{t("blog.author.postsBy")}</h2>
        {posts.length === 0 ? (
          <EmptyState icon={Clock} title={t("blog.author.noPosts")} className="mt-4" />
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
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
                    <div className="mt-3 flex items-center gap-2 text-xs text-ink-400 dark:text-ink-500">
                      <span>{formatDate(post.date, i18n.language)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t("blog.readingTime", { count: post.readingTime })}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12">
          <Newsletter />
        </div>
      </div>
    </>
  );
}
