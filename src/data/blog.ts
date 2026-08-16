export interface BlogPost {
  slug: string;
  titleKey: string;
  excerptKey: string;
  bodyKey: string;
  category: string;
  authorSlug: string;
  date: string;
  readingTime: number;
  tags: string[];
  coverImage?: string;
  seoTitleKey?: string;
  seoDescKey?: string;
  // الخصائص المباشرة للتوافق
  title?: string;
  excerpt?: string;
  body?: string;
  content?: string;
}

export interface BlogCategory {
  slug: string;
  nameKey: string;
  descKey?: string;
  coverImage?: string;
}

export interface Author {
  slug: string;
  name: string;
  role: string;
  bioKey: string;
  avatar: string;
  twitter?: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "seo-analytics",
    nameKey: "SEO & Analytics",
    descKey: "SEO guides, analytics tips, and website optimization articles.",
    coverImage:
      "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "web-development",
    nameKey: "Web Development",
    descKey: "Modern web development guides, tutorials, and practical tips.",
    coverImage:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "text-utilities",
    nameKey: "Text Utilities",
    descKey:
      "Guides about speech, text, PDF, OCR, productivity, privacy, and browser tools.",
    coverImage:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
  },
];

export const AUTHORS: Author[] = [
  {
    slug: "zidro-team",
    name: "ZidroTool Team",
    role: "Core Developers",
    bioKey: "ZidroTool Content & Engineering Team",
    avatar: "from-blue-500 to-indigo-600",
    twitter: "https://twitter.com",
  },
];

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80";

// جلب ملفات Markdown كمحتوى نصي خام خام مباشرة عبر Vite
const markdownFiles = import.meta.glob("/content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parseRawMarkdown(rawContent: string) {
  let title = "";
  let excerpt = "";
  let body = rawContent;

  if (rawContent.startsWith("---")) {
    const parts = rawContent.split("---");
    if (parts.length >= 3) {
      const header = parts[1];
      body = parts.slice(2).join("---").trim();

      const titleMatch = header.match(/title:\s*["']?([^"'\n]+)["']?/);
      if (titleMatch) title = titleMatch[1];

      const excerptMatch = header.match(/excerpt:\s*["']?([^"'\n]+)["']?/);
      if (excerptMatch) excerpt = excerptMatch[1];
    }
  }

  return { title, excerpt, body };
}

function loadPostsFromMarkdown(): BlogPost[] {
  const posts: BlogPost[] = [];

  for (const path in markdownFiles) {
    const rawContent = markdownFiles[path];
    const fileName = path.split("/").pop()?.replace(".md", "") || "";
    
    // تنظيف اسم الملف لاستخراج الـ Slug الحقيقي (مثال: 02-speech-to-text-mobile-tips -> speech-to-text-mobile-tips)
    const cleanSlug = fileName.replace(/^\d+-/, "");
    const { title, excerpt, body } = parseRawMarkdown(rawContent);

    const displayTitle = title || cleanSlug.replace(/-/g, " ").toUpperCase();
    const displayExcerpt = excerpt || body.slice(0, 150) + "...";

    posts.push({
      slug: cleanSlug,
      titleKey: displayTitle,
      excerptKey: displayExcerpt,
      bodyKey: body,
      title: displayTitle,
      excerpt: displayExcerpt,
      body: body,
      content: body,
      category: "text-utilities",
      authorSlug: "zidro-team",
      date: "2026-08-15",
      readingTime: Math.max(1, Math.ceil(body.split(/\s+/).length / 200)),
      tags: [cleanSlug.split("-")[0] || "utility"],
      coverImage: DEFAULT_COVER,
    });
  }

  return posts;
}

const DYNAMIC_POSTS = loadPostsFromMarkdown();

export const BLOG_POSTS: BlogPost[] = DYNAMIC_POSTS.length > 0 ? DYNAMIC_POSTS : [
  {
    slug: "how-to-optimize-seo-tools",
    titleKey: "Welcome to ZidroTool",
    excerptKey: "We're excited to launch ZidroTool — a growing collection of smart, free online tools.",
    bodyKey: "Welcome to ZidroTool, your go-to hub for free, fast, and local-first online web utilities.",
    category: "seo-analytics",
    authorSlug: "zidro-team",
    date: "2026-08-01",
    readingTime: 5,
    tags: ["seo", "web", "analytics"],
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  }
];

export function getPost(slug: string): BlogPost | undefined {
  if (!slug) return undefined;
  const target = slug.toLowerCase().trim();

  return BLOG_POSTS.find((post) => {
    const currentSlug = post.slug.toLowerCase();
    return currentSlug === target || currentSlug.replace(/^\d+-/, "") === target;
  });
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getPost(slug);
}

export function getRelatedPosts(
  currentPostOrSlug: BlogPost | string,
  limit = 3
): BlogPost[] {
  const currentPost =
    typeof currentPostOrSlug === "string"
      ? getPost(currentPostOrSlug)
      : currentPostOrSlug;

  if (!currentPost) return [];

  return BLOG_POSTS.filter(
    (post) =>
      post.slug !== currentPost.slug &&
      post.category === currentPost.category
  ).slice(0, limit);
}

export function getAuthor(slug: string): Author | undefined {
  return AUTHORS.find((author) => author.slug === slug);
}

export function getBlogCategory(slug: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((category) => category.slug === slug);
}

export function getCategoryPostCount(categorySlug: string): number {
  return BLOG_POSTS.filter((post) => post.category === categorySlug).length;
}

export function postsByAuthor(authorSlug: string): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.authorSlug === authorSlug);
}

export function getAuthorPostCount(authorSlug: string): number {
  return postsByAuthor(authorSlug).length;
}