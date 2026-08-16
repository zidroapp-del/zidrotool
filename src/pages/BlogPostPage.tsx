import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPostBySlug, getRelatedPosts, getAuthor } from "@/data/blog";
import { useTranslation } from "react-i18next";

import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Tag,
  ArrowRight,
  Mic,
  Volume2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

/* =========================================================
   TOOL CONFIGURATION
========================================================= */

type ToolConfig = {
  name: string;
  path: string;
  desc: string;
  icon: React.ElementType;
  keywords: string[];
};

const TOOLS: ToolConfig[] = [
  {
    name: "Speech to Text",
    path: "/tools/speech-to-text",
    desc: "Convert your voice into written text in real-time.",
    icon: Mic,
    keywords: ["stt", "speech", "speech-to-text", "voice to text", "transcription"],
  },
  {
    name: "Text to Speech",
    path: "/tools/text-to-speech",
    desc: "Convert written text into natural spoken audio.",
    icon: Volume2,
    keywords: ["tts", "text-to-speech", "voice generator", "speech synthesis"],
  },
  {
    name: "PDF to Text",
    path: "/tools/pdf-to-text",
    desc: "Extract text directly from PDF documents.",
    icon: FileText,
    keywords: ["pdf", "pdf-to-text", "pdf text", "pdf converter"],
  },
  {
    name: "Image to Text (OCR)",
    path: "/tools/image-to-text-ocr",
    desc: "Extract editable text directly from images.",
    icon: ImageIcon,
    keywords: ["ocr", "image-to-text", "photo to text"],
  },
];

const DEFAULT_TOOL = TOOLS[0];

/* =========================================================
   NORMALIZE TEXT & TOOLS MATCHING
========================================================= */

function normalizeText(value: unknown): string {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ");
}

function findTool(tags: string[] | undefined, slug: string, title: string): ToolConfig {
  const normalizedTags = (tags || []).map(normalizeText);
  const normalizedSlug = normalizeText(slug);
  const normalizedTitle = normalizeText(title);

  for (const tag of normalizedTags) {
    for (const tool of TOOLS) {
      if (tool.keywords.some((kw) => tag.includes(normalizeText(kw)))) return tool;
    }
  }

  for (const tool of TOOLS) {
    if (tool.keywords.some((kw) => normalizedSlug.includes(normalizeText(kw)))) return tool;
  }

  for (const tool of TOOLS) {
    if (tool.keywords.some((kw) => normalizedTitle.includes(normalizeText(kw)))) return tool;
  }

  return DEFAULT_TOOL;
}

function detectLanguage(post: { slug: string; tags?: string[] }): string {
  const slug = post.slug.toLowerCase();
  const tags = (post.tags || []).join(" ").toLowerCase();
  const combined = `${slug} ${tags}`;

  if (combined.includes("-ar") || combined.includes("arabic")) return "ar";
  if (combined.includes("-fr") || combined.includes("french")) return "fr";
  if (combined.includes("-de") || combined.includes("german")) return "de";
  if (combined.includes("-es") || combined.includes("spanish")) return "es";
  return "en";
}

/* =========================================================
   ROBUST TEXT RESOLVER (Direct Text OR Translation Fallback)
========================================================= */

function resolveContent(
  directContent: any,
  translationKey: string | undefined,
  t: (key: string) => string
): string {
  // 1. إذا كان النص المباشر موجـوداً كـ string
  if (typeof directContent === "string" && directContent.trim() !== "") {
    return directContent;
  }

  // 2. إذا لم يوجد، نفحص مفتاح الترجمة
  if (translationKey) {
    const translated = t(translationKey);
    if (typeof translated === "string" && translated !== translationKey && translated.trim() !== "") {
      return translated;
    }
  }

  return "";
}

/* =========================================================
   BLOG POST PAGE
========================================================= */

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const post: any = slug ? getPostBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  if (!post) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">
          {t("blog.postNotFound") !== "blog.postNotFound" ? t("blog.postNotFound") : "Post Not Found"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("blog.postNotFoundDescription") !== "blog.postNotFoundDescription"
            ? t("blog.postNotFoundDescription")
            : "The article you are looking for does not exist."}
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("blog.backToBlog") !== "blog.backToBlog" ? t("blog.backToBlog") : "Back to Blog"}
        </Link>
      </div>
    );
  }

  const author = getAuthor(post.authorSlug);
  const relatedPosts = getRelatedPosts(post, 3);

  // استخراج العناوين والمحتوى بمرونة (يدعم post.title, post.body, post.content, post.bodyKey)
  const title = resolveContent(post.title, post.titleKey, t) || post.slug;
  const excerpt = resolveContent(post.excerpt, post.excerptKey, t);
  const body = resolveContent(post.body || post.content, post.bodyKey, t);

  const targetLang = detectLanguage(post);
  const activeTool = findTool(post.tags, post.slug, title);
  const ToolIcon = activeTool.icon;
  const toolTargetUrl = `${activeTool.path}?lang=${encodeURIComponent(targetLang)}`;

  const isRTL = i18n.language?.startsWith("ar") || targetLang === "ar";

  return (
    <article className="container-page py-12 max-w-4xl mx-auto px-4" dir={isRTL ? "rtl" : "ltr"}>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-8 transition-colors"
      >
        <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
        {t("common.back") !== "common.back" ? t("common.back") : isRTL ? "رجوع" : "Back"}
      </button>

      <header className="mb-8">
        {post.category && (
          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-4 inline-block">
            {post.category.replace(/-/g, " ")}
          </span>
        )}

        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 border-b pb-6 border-gray-100 dark:border-gray-800">
          {author && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{author.name}</span>
            </div>
          )}

          {post.date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{post.date}</span>
            </div>
          )}

          {post.readingTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {post.readingTime} {t("blog.minRead") !== "blog.minRead" ? t("blog.minRead") : "min read"}
              </span>
            </div>
          )}
        </div>
      </header>

      {post.coverImage && (
        <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-10 bg-gray-100 dark:bg-gray-800">
          <img src={post.coverImage} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
        {excerpt && (
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium border-l-4 border-blue-500 pl-4 py-1 mb-8">
            {excerpt}
          </p>
        )}

        {body ? (
          <div className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">
            {body}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            {isRTL ? "محتوى المقال غير متوفر حالياً." : "Article content is not available yet."}
          </p>
        )}
      </div>

      {/* Tool Callout */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white my-12 text-center shadow-lg">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
          <ToolIcon className="w-6 h-6 text-white" />
        </div>

        <h2 className="text-2xl font-bold mb-3">
          {isRTL ? `جرّب أداة ${activeTool.name} المجانية` : `Try Our Free ${activeTool.name} Tool`}
        </h2>

        <p className="mb-6 text-blue-100 max-w-xl mx-auto">{activeTool.desc}</p>

        <Link
          to={toolTargetUrl}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-md"
        >
          {isRTL ? `فتح ${activeTool.name}` : `Open ${activeTool.name}`}
          <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
        </Link>
      </section>

      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-12 pt-6 border-t border-gray-100 dark:border-gray-800">
          <Tag className="w-4 h-4 text-gray-400" />
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {relatedPosts.length > 0 && (
        <section className="border-t border-gray-200 dark:border-gray-800 pt-12 mt-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            {isRTL ? "مقالات ذات صلة" : "Related Articles"}
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((related: any) => {
              const relatedTitle = resolveContent(related.title, related.titleKey, t) || related.slug;
              const relatedExcerpt = resolveContent(related.excerpt, related.excerptKey, t);

              return (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  className="group p-5 border border-gray-100 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-gray-900 flex flex-col justify-between"
                >
                  <div>
                    {related.category && (
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-2">
                        {related.category.replace(/-/g, " ")}
                      </span>
                    )}

                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                      {relatedTitle}
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                      {relatedExcerpt}
                    </p>
                  </div>

                  {related.readingTime && (
                    <div className="flex items-center text-xs text-gray-400 gap-1 pt-2 border-t border-gray-50 dark:border-gray-800">
                      <Clock className="w-3 h-3" />
                      {related.readingTime} min read
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}