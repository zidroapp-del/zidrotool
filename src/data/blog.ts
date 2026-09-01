import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  titleKey: string;
  excerptKey: string;
  bodyKey: string;
  category: string;
  authorSlug: string;
  date: string;
  dateModified?: string;
  readingTime: number;
  tags: string[];
  coverImage?: string;
  coverGradient: string;
  seoTitleKey?: string;
  seoDescKey?: string;
  seoTitle?: string;
  seoDesc?: string;
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
  linkedin?: string;
  github?: string;
  website?: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "seo-analytics",
    nameKey: "SEO & Analytics",
    descKey: "SEO guides, analytics tips, and website optimization articles.",
    coverImage: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "web-development",
    nameKey: "Web Development",
    descKey: "Modern web development guides, tutorials, and practical tips.",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "text-utilities",
    nameKey: "Text Utilities",
    descKey: "Guides about speech, text, PDF, OCR, productivity, privacy, and browser tools.",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
  },
];

export const AUTHORS: Author[] = [
  {
    slug: "zidro-team",
    name: "ZidroTool Team",
    role: "Core Developers",
    bioKey: "ZidroTool Content & Engineering Team",
    avatar: "from-blue-500 to-indigo-600",
    twitter: "https://twitter.com/zidrotool",
    github: "https://github.com/zidrotool",
  },
];

const DEFAULT_COVER = "/blog-images/default-blog.png";

/** Local, stable cover art for every article. This avoids remote-image failures
 * and gives Blog listing, category pages, article pages and OG metadata the
 * same reliable asset. */
export function getBlogCoverImage(slug: string): string {
  const clean = String(slug || "").replace(/^\/+|\/+$/g, "");
  return clean ? `/blog-images/${clean}.png` : DEFAULT_COVER;
}

const markdownFiles = import.meta.glob("/content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(rawContent: string) {
  // A few legacy posts contain a stray "Markdown" marker before the YAML fence.
  // Normalize it so every post gets the same metadata pipeline.
  const normalized = rawContent.replace(/^\uFEFF/, "").replace(/^Markdown\s*\n(?=---)/i, "");

  try {
    const { data, content } = matter(normalized);
    return {
      data: data as Record<string, unknown>,
      content: content.trim(),
    };
  } catch {
    return { data: {} as Record<string, unknown>, content: normalized.trim() };
  }
}

function asString(data: Record<string, unknown>, key: string, fallback = "") {
  const value = data[key];
  return typeof value === "string" ? value.trim() : fallback;
}

function asArray(data: Record<string, unknown>, key: string) {
  const value = data[key];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeBlogCategory(category: string): string {
  const value = category.toLowerCase().trim();
  if (["seo", "seo-analytics", "analytics"].includes(value)) return "seo-analytics";
  if (["development", "web-development", "dev"].includes(value)) return "web-development";
  return "text-utilities";
}

function coverGradientForCategory(category: string): string {
  switch (category) {
    case "seo-analytics":
      return "from-blue-500 to-cyan-600";
    case "web-development":
      return "from-violet-500 to-indigo-600";
    default:
      return "from-emerald-500 to-teal-600";
  }
}

function loadPostsFromMarkdown(): BlogPost[] {
  const posts: BlogPost[] = [];

  for (const filePath in markdownFiles) {
    const rawContent = markdownFiles[filePath];
    const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") || "";
    const cleanSlug = fileName.replace(/^\d+-/, "");
    const { data, content } = parseFrontmatter(rawContent);

    const title = asString(data, "title", cleanSlug.replace(/-/g, " "));
    const excerpt = asString(data, "excerpt", asString(data, "summary", content.slice(0, 180)));
    const category = normalizeBlogCategory(asString(data, "category", "text-utilities"));
    const author = asString(data, "author", "ZidroTool Team");
    const date = asString(data, "date", "");
    const dateModified = asString(data, "lastModified", asString(data, "dateModified", date));
    const coverImage = getBlogCoverImage(cleanSlug);
    const seoTitle = asString(data, "seoTitle", title);
    const seoDesc = asString(data, "seoDescription", excerpt);
    const tags = asArray(data, "tags");
    const fallbackTag = cleanSlug.split("-")[0];
    const words = content.replace(/[`*_#>\[\]()]/g, " ").split(/\s+/).filter(Boolean).length;

    posts.push({
      slug: cleanSlug,
      titleKey: title,
      excerptKey: excerpt,
      bodyKey: content,
      title,
      excerpt,
      body: content,
      content,
      category,
      authorSlug: author.toLowerCase().includes("zidro") ? "zidro-team" : "zidro-team",
      date,
      dateModified: dateModified || undefined,
      readingTime: Math.max(1, Math.ceil(words / 220)),
      tags: tags.length ? tags : [fallbackTag],
      coverImage,
      coverGradient: coverGradientForCategory(category),
      seoTitle,
      seoDesc,
    });
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

function applyBrowserBlogOverrides(posts: BlogPost[]): BlogPost[] {
  if (typeof window === "undefined") return posts;
  try {
    const raw = localStorage.getItem("zidrotool.blog.overrides");
    if (!raw) return posts;
    const overrides = JSON.parse(raw) as Record<string, any>;
    const merged = posts.map((post) => {
      const o = overrides[post.slug];
      if (!o) return post;
      return { ...post, ...o, coverImage: getBlogCoverImage(post.slug), seoDesc: o.seoDescription || o.seoDesc || post.seoDesc, body: o.content || post.body, content: o.content || post.content, titleKey: o.title || post.titleKey, excerptKey: o.excerpt || post.excerptKey };
    });
    const known = new Set(merged.map((p) => p.slug));
    for (const key of Object.keys(overrides)) {
      if (known.has(key)) continue;
      const o = overrides[key];
      const content = String(o.content || "");
      merged.push({
        slug: key, titleKey: o.title || key, excerptKey: o.excerpt || content.slice(0,180), bodyKey: content,
        title: o.title || key, excerpt: o.excerpt || content.slice(0,180), body: content, content,
        category: normalizeBlogCategory(o.category || "text-utilities"), authorSlug: "zidro-team", date: o.date || new Date().toISOString().slice(0,10),
        readingTime: Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length/220)), tags: o.tags || [], coverImage: getBlogCoverImage(key),
        coverGradient: coverGradientForCategory(normalizeBlogCategory(o.category || "text-utilities")), seoTitle: o.seoTitle || o.title || key, seoDesc: o.seoDescription || o.excerpt || "",
      });
    }
    return merged.sort((a,b)=>b.date.localeCompare(a.date));
  } catch { return posts; }
}

export const BLOG_POSTS: BlogPost[] = applyBrowserBlogOverrides(loadPostsFromMarkdown());

export function getPost(slug: string): BlogPost | undefined {
  if (!slug) return undefined;
  const target = slug.toLowerCase().trim();
  return BLOG_POSTS.find((post) => post.slug.toLowerCase() === target);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getPost(slug);
}

export function getRelatedPosts(currentPostOrSlug: BlogPost | string, limit = 3): BlogPost[] {
  const currentPost = typeof currentPostOrSlug === "string" ? getPost(currentPostOrSlug) : currentPostOrSlug;
  if (!currentPost) return [];

  const currentTags = new Set(currentPost.tags.map((tag) => tag.toLowerCase()));
  return BLOG_POSTS
    .filter((post) => post.slug !== currentPost.slug)
    .map((post) => ({
      post,
      score:
        (post.category === currentPost.category ? 3 : 0) +
        post.tags.reduce((score, tag) => score + (currentTags.has(tag.toLowerCase()) ? 2 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
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
