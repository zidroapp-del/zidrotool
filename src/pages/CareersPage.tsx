import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPostBySlug, getRelatedPosts, getAuthor } from "@/data/blog";
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

// 1. خريطة الأدوات مع تحديد مسار كل أداة
const TOOL_MAP: Record<
  string,
  { name: string; path: string; desc: string; icon: React.ElementType }
> = {
  stt: {
    name: "Speech to Text",
    path: "/tools/speech-to-text",
    desc: "Convert your voice into written text in real-time.",
    icon: Mic,
  },
  speech: {
    name: "Speech to Text",
    path: "/tools/speech-to-text",
    desc: "Convert your voice into written text in real-time.",
    icon: Mic,
  },
  tts: {
    name: "Text to Speech",
    path: "/tools/text-to-speech",
    desc: "Convert written text into natural spoken audio.",
    icon: Volume2,
  },
  pdf: {
    name: "PDF to Text",
    path: "/tools/pdf-to-text",
    desc: "Extract text directly from PDF documents.",
    icon: FileText,
  },
  ocr: {
    name: "Image to Text (OCR)",
    path: "/tools/image-to-text-ocr",
    desc: "Extract editable text directly from images.",
    icon: ImageIcon,
  },
};

const DEFAULT_TOOL = {
  name: "Speech to Text",
  path: "/tools/speech-to-text",
  desc: "Explore ZidroTool's free browser utilities.",
  icon: Wrench,
};

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const post = slug ? getPostBySlug(slug) : undefined;
  const author = post ? getAuthor(post.authorSlug) : undefined;
  const relatedPosts = post ? getRelatedPosts(post, 3) : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
        <Link to="/blog" className="text-blue-600 underline">Back to Blog</Link>
      </div>
    );
  }

  // 2. كشف لغة المقال من النهاية الخاصة بـ Slug (مثلاً: -ar أو -fr أو en)
  const isArabic = post.slug.endsWith("-ar") || post.tags?.includes("arabic");
  const isFrench = post.slug.endsWith("-fr") || post.tags?.includes("french");
  const isGerman = post.slug.endsWith("-de") || post.tags?.includes("german");

  let targetLang = "en";
  if (isArabic) targetLang = "ar";
  if (isFrench) targetLang = "fr";
  if (isGerman) targetLang = "de";

  // 3. مطابقة الأداة
  const matchedTag = post.tags?.find((tag) => TOOL_MAP[tag.toLowerCase()]);
  const activeTool = matchedTag ? TOOL_MAP[matchedTag.toLowerCase()] : DEFAULT_TOOL;
  const ToolIcon = activeTool.icon;

  // إعداد رابط الأداة مع تحديد اللغة تلقائياً في URL
  const toolTargetUrl = `${activeTool.path}?lang=${targetLang}`;

  return (
    <article className="container-page py-12 max-w-4xl mx-auto px-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <header className="mb-8">
        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full uppercase tracking-wider mb-4 inline-block">
          {post.category}
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          {post.titleKey}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b pb-6 border-gray-100">
          {author && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-700">{author.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{post.readingTime} min read</span>
          </div>
        </div>
      </header>

      {/* 4. محتوى المقال النصي يظهر كما هو دون تغيير */}
      <div className="prose prose-lg max-w-none mb-12 text-gray-800 leading-relaxed">
        <p className="text-xl text-gray-600 font-medium mb-8 leading-normal border-l-4 border-blue-500 pl-4 py-1">
          {post.excerptKey}
        </p>
        <div className="whitespace-pre-line text-gray-700">
          {post.bodyKey}
        </div>
      </div>

      {/* 5. البنر الذي يحول باللغة الصحيحة تلقائياً */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white my-12 text-center shadow-lg">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
          <ToolIcon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3">
          Try Our Free {activeTool.name} Tool
        </h3>
        <p className="mb-6 text-blue-100 max-w-xl mx-auto">
          {activeTool.desc}
        </p>
        <Link
          to={toolTargetUrl}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
        >
          Open {activeTool.name} <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Tags */}
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

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-gray-200 pt-12 mt-12">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">
            Related Articles
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                to={`/blog/${related.slug}`}
                className="group p-5 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-2">
                    {related.category}
                  </span>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                    {related.titleKey}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {related.excerptKey}
                  </p>
                </div>
                <div className="flex items-center text-xs text-gray-400 gap-1 pt-2 border-t border-gray-50">
                  <Clock className="w-3 h-3" /> {related.readingTime} min read
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}