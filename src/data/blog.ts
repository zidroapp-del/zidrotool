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
    nameKey: "blog.categories.seo",
    coverImage: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=400&q=80"
  },
  {
    slug: "web-development",
    nameKey: "blog.categories.webDev",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80"
  },
  {
    slug: "text-utilities",
    nameKey: "blog.categories.textTools",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80"
  }
];

export const AUTHORS: Author[] = [
  {
    slug: "zidro-team",
    name: "ZidroTool Team",
    role: "Core Developers",
    bioKey: "blog.authors.zidroTeamBio",
    avatar: "from-blue-500 to-indigo-600",
    twitter: "https://twitter.com"
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-optimize-seo-tools",
    // Use existing blog translation keys present in locales to avoid missing-key rendering
    titleKey: "blog.welcome.title",
    excerptKey: "blog.welcome.excerpt",
    bodyKey: "blog.welcome.body",
    category: "seo-analytics",
    authorSlug: "zidro-team",
    date: "2026-08-01",
    readingTime: 5,
    tags: ["SEO", "Web", "Analytics"],
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
  }
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getPost(slug);
}

export function getRelatedPosts(currentPostOrSlug: BlogPost | string, limit = 3): BlogPost[] {
  const currentSlug = typeof currentPostOrSlug === 'string' ? currentPostOrSlug : currentPostOrSlug.slug;
  const currentCategory = typeof currentPostOrSlug === 'string' 
    ? getPost(currentPostOrSlug)?.category 
    : currentPostOrSlug.category;

  return BLOG_POSTS.filter(
    (p) => p.slug !== currentSlug && (!currentCategory || p.category === currentCategory)
  ).slice(0, limit);
}

export function getAuthor(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}

export function getBlogCategory(slug: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryPostCount(categorySlug: string): number {
  return BLOG_POSTS.filter((p) => p.category === categorySlug).length;
}

export function postsByAuthor(authorSlug: string) {
  return BLOG_POSTS.filter((p) => p.authorSlug === authorSlug);
}

export function getAuthorPostCount(authorSlug: string) {
  return BLOG_POSTS.filter((p) => p.authorSlug === authorSlug).length;
}