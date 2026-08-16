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
  Wrench,
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
    keywords: [
      "stt",
      "speech",
      "speech-to-text",
      "speech to text",
      "speech recognition",
      "voice to text",
      "voice-to-text",
      "transcription",
      "transcribe",
      "audio to text",
    ],
  },

  {
    name: "Text to Speech",
    path: "/tools/text-to-speech",
    desc: "Convert written text into natural spoken audio.",
    icon: Volume2,
    keywords: [
      "tts",
      "text-to-speech",
      "text to speech",
      "voice",
      "audio",
      "text to voice",
      "text-to-voice",
      "voice generator",
      "speech synthesis",
    ],
  },

  {
    name: "PDF to Text",
    path: "/tools/pdf-to-text",
    desc: "Extract text directly from PDF documents.",
    icon: FileText,
    keywords: [
      "pdf",
      "pdf-to-text",
      "pdf to text",
      "pdf text",
      "pdf converter",
      "document",
      "documents",
    ],
  },

  {
    name: "Image to Text (OCR)",
    path: "/tools/image-to-text-ocr",
    desc: "Extract editable text directly from images.",
    icon: ImageIcon,
    keywords: [
      "ocr",
      "image",
      "image-to-text",
      "image to text",
      "image text",
      "photo to text",
      "picture to text",
      "text from image",
    ],
  },
];

const DEFAULT_TOOL: ToolConfig = {
  name: "Speech to Text",
  path: "/tools/speech-to-text",
  desc: "Convert your voice into written text in real-time.",
  icon: Mic,
  keywords: [],
};

/* =========================================================
   NORMALIZE TEXT
========================================================= */

function normalizeText(value: unknown): string {
  if (!value) return "";

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ");
}

/* =========================================================
   FIND TOOL FROM TAGS / SLUG / TITLE
========================================================= */

function findTool(
  tags: string[] | undefined,
  slug: string,
  titleKey: string
): ToolConfig {
  const normalizedTags = (tags || []).map(normalizeText);

  const normalizedSlug = normalizeText(slug);
  const normalizedTitle = normalizeText(titleKey);

  /* -------------------------------------------------------
     1. Check exact / partial tags first
  ------------------------------------------------------- */

  for (const tag of normalizedTags) {
    for (const tool of TOOLS) {
      const matched = tool.keywords.some((keyword) => {
        const normalizedKeyword = normalizeText(keyword);

        return (
          tag === normalizedKeyword ||
          tag.includes(normalizedKeyword) ||
          normalizedKeyword.includes(tag)
        );
      });

      if (matched) {
        return tool;
      }
    }
  }

  /* -------------------------------------------------------
     2. Check slug
  ------------------------------------------------------- */

  for (const tool of TOOLS) {
    const matched = tool.keywords.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword);

      return (
        normalizedSlug.includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalizedSlug)
      );
    });

    if (matched) {
      return tool;
    }
  }

  /* -------------------------------------------------------
     3. Check title key
  ------------------------------------------------------- */

  for (const tool of TOOLS) {
    const matched = tool.keywords.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword);

      return normalizedTitle.includes(normalizedKeyword);
    });

    if (matched) {
      return tool;
    }
  }

  /* -------------------------------------------------------
     4. Manual priority detection
        Important because "voice" can sometimes appear
        in unrelated articles.
  ------------------------------------------------------- */

  const combinedText = `${normalizedSlug} ${normalizedTitle}`;

  if (
    combinedText.includes("text to speech") ||
    combinedText.includes("text-to-speech") ||
    combinedText.includes("tts")
  ) {
    return TOOLS[1];
  }

  if (
    combinedText.includes("pdf") ||
    combinedText.includes("pdf to text") ||
    combinedText.includes("pdf-to-text")
  ) {
    return TOOLS[2];
  }

  if (
    combinedText.includes("ocr") ||
    combinedText.includes("image to text") ||
    combinedText.includes("image-to-text")
  ) {
    return TOOLS[3];
  }

  if (
    combinedText.includes("speech to text") ||
    combinedText.includes("speech-to-text") ||
    combinedText.includes("voice to text") ||
    combinedText.includes("voice-to-text") ||
    combinedText.includes("transcription")
  ) {
    return TOOLS[0];
  }

  return DEFAULT_TOOL;
}

/* =========================================================
   LANGUAGE DETECTION
========================================================= */

function detectLanguage(post: any): string {
  const slug = normalizeText(post.slug);

  const tags = (post.tags || [])
    .map((tag: string) => normalizeText(tag))
    .join(" ");

  const combined = `${slug} ${tags}`;

  if (
    combined.includes("-ar") ||
    combined.includes(" arabic") ||
    combined.includes(" arab")
  ) {
    return "ar";
  }

  if (
    combined.includes("-fr") ||
    combined.includes(" french") ||
    combined.includes(" français") ||
    combined.includes("francais")
  ) {
    return "fr";
  }

  if (
    combined.includes("-de") ||
    combined.includes(" german") ||
    combined.includes(" deutsch")
  ) {
    return "de";
  }

  if (
    combined.includes("-es") ||
    combined.includes(" spanish") ||
    combined.includes(" español") ||
    combined.includes("espanol")
  ) {
    return "es";
  }

  return "en";
}

/* =========================================================
   BLOG POST PAGE
========================================================= */

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const post = slug ? getPostBySlug(slug) : undefined;

  const author = post
    ? getAuthor(post.authorSlug)
    : undefined;

  const relatedPosts = post
    ? getRelatedPosts(post, 3)
    : [];

  /* -------------------------------------------------------
     Scroll to top when article changes
  ------------------------------------------------------- */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [slug]);

  /* -------------------------------------------------------
     Post not found
  ------------------------------------------------------- */

  if (!post) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">
          Post Not Found
        </h1>

        <p className="text-gray-600 mb-8">
          The article you are looking for does not exist
          or has been moved.
        </p>

        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>
    );
  }

  /* =======================================================
     LANGUAGE
  ======================================================= */

  const targetLang = detectLanguage(post);

  /* =======================================================
     ACTIVE TOOL
  ======================================================= */

  const activeTool = findTool(
    post.tags,
    post.slug,
    post.titleKey
  );

  const ToolIcon = activeTool.icon;

  /* -------------------------------------------------------
     Tool URL
     
     We preserve the current article language and also
     preserve the detected language.
  ------------------------------------------------------- */

  const toolTargetUrl =
    `${activeTool.path}?lang=${encodeURIComponent(targetLang)}`;

  /* =======================================================
     TRANSLATED CONTENT
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * post.titleKey / excerptKey / bodyKey may be translation
   * keys such as:
   *
   * blog.article.title
   * blog.article.body
   *
   * Therefore we try i18next first.
   */

  const translateContent = (
    key: unknown,
    fallback = ""
  ): string => {
    if (!key) return fallback;

    const value = String(key);

    /*
     * Try translating the key.
     */

    const translated = t(value);

    /*
     * If i18next does not find the key, it normally returns
     * the key itself. In that case use the original value.
     */

    if (translated && translated !== value) {
      return translated;
    }

    return fallback || value;
  };

  const title = translateContent(
    post.titleKey,
    String(post.titleKey || "")
  );

  const excerpt = translateContent(
    post.excerptKey,
    String(post.excerptKey || "")
  );

  const body = translateContent(
    post.bodyKey,
    ""
  );

  /* =======================================================
     DIRECTION
  ======================================================= */

  const isRTL =
    targetLang === "ar" ||
    i18n.language?.startsWith("ar");

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <article
      className="container-page py-12 max-w-4xl mx-auto px-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ===================================================
          BACK BUTTON
      =================================================== */}

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />

        {isRTL ? "رجوع" : "Back"}
      </button>

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="mb-8">
        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full uppercase tracking-wider mb-4 inline-block">
          {post.category}
        </span>

        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          {title}
        </h1>

        {/* Metadata */}

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b pb-6 border-gray-100">
          {author && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />

              <span className="font-medium text-gray-700">
                {author.name}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />

            <span>
              {post.date}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />

            <span>
              {post.readingTime} min read
            </span>
          </div>
        </div>
      </header>

      {/* ===================================================
          ARTICLE CONTENT
      =================================================== */}

      <div className="prose prose-lg max-w-none mb-12 text-gray-800 leading-relaxed">

        {/* Excerpt */}

        {excerpt && (
          <p
            className="
              text-xl
              text-gray-600
              font-medium
              leading-normal
              border-l-4
              border-blue-500
              pl-4
              py-1
              mb-8
            "
          >
            {excerpt}
          </p>
        )}

        {/* Body */}

        {body && body !== String(post.bodyKey || "") ? (
          <div
            className="
              text-gray-700
              text-lg
              leading-relaxed
              whitespace-pre-line
              space-y-6
            "
          >
            {body}
          </div>
        ) : post.bodyKey ? (
          <div
            className="
              text-gray-700
              text-lg
              leading-relaxed
              whitespace-pre-line
              space-y-6
            "
          >
            {String(post.bodyKey)}
          </div>
        ) : (
          <div className="text-gray-500 text-base py-6">
            {isRTL
              ? "محتوى المقال غير متوفر حالياً."
              : "Article content is not available yet."}
          </div>
        )}
      </div>

      {/* ===================================================
          TOOL CTA BANNER
      =================================================== */}

      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white my-12 text-center shadow-lg">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
          <ToolIcon className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-2xl font-bold mb-3">
          {isRTL
            ? `جرّب أداة ${activeTool.name} المجانية`
            : `Try Our Free ${activeTool.name} Tool`}
        </h3>

        <p className="mb-6 text-blue-100 max-w-xl mx-auto">
          {activeTool.desc}
        </p>

        <Link
          to={toolTargetUrl}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
        >
          {isRTL
            ? `فتح ${activeTool.name}`
            : `Open ${activeTool.name}`}

          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ===================================================
          TAGS
      =================================================== */}

      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-12 pt-6 border-t border-gray-100">
          <Tag className="w-4 h-4 text-gray-400" />

          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ===================================================
          RELATED POSTS
      =================================================== */}

      {relatedPosts.length > 0 && (
        <section className="border-t border-gray-200 pt-12 mt-12">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">
            {isRTL
              ? "مقالات ذات صلة"
              : "Related Articles"}
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((related) => {
              const relatedTitle = translateContent(
                related.titleKey,
                String(related.titleKey || "")
              );

              const relatedExcerpt = translateContent(
                related.excerptKey,
                String(related.excerptKey || "")
              );

              return (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  className="
                    group
                    p-5
                    border
                    border-gray-100
                    rounded-xl
                    hover:shadow-md
                    transition-shadow
                    bg-white
                    flex
                    flex-col
                    justify-between
                  "
                >
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-2">
                      {related.category}
                    </span>

                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                      {relatedTitle}
                    </h4>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {relatedExcerpt}
                    </p>
                  </div>

                  <div className="flex items-center text-xs text-gray-400 gap-1 pt-2 border-t border-gray-50">
                    <Clock className="w-3 h-3" />

                    {related.readingTime} min read
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}