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

// Add generated markdown-based posts into the index so BlogPage can list them
const additionalPosts = [
  // refer to files created by the content task; readingTime approximated
  { slug: "01-speech-to-text-benefits", titleKey: "", excerptKey: "", bodyKey: "01-speech-to-text-benefits", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["speech","stt"] },
  { slug: "02-speech-to-text-mobile-tips", titleKey: "", excerptKey: "", bodyKey: "02-speech-to-text-mobile-tips", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["mobile","stt"] },
  { slug: "03-stt-privacy-guide", titleKey: "", excerptKey: "", bodyKey: "03-stt-privacy-guide", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy","stt"] },
  { slug: "04-voice-productivity", titleKey: "", excerptKey: "", bodyKey: "04-voice-productivity", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["productivity","voice"] },
  { slug: "05-stt-multilingual", titleKey: "", excerptKey: "", bodyKey: "05-stt-multilingual", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["multilingual","stt"] },
  { slug: "06-tts-accessibility-1", titleKey: "", excerptKey: "", bodyKey: "06-tts-accessibility-1", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["tts","accessibility"] },
  { slug: "07-tts-content-creation", titleKey: "", excerptKey: "", bodyKey: "07-tts-content-creation", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["tts","content"] },
  { slug: "08-tts-elevenlabs-guide", titleKey: "", excerptKey: "", bodyKey: "08-tts-elevenlabs-guide", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 5, tags: ["tts","elevenlabs"] },
  { slug: "09-tts-best-practices", titleKey: "", excerptKey: "", bodyKey: "09-tts-best-practices", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["tts","best-practices"] },
  { slug: "10-tts-education-accessibility", titleKey: "", excerptKey: "", bodyKey: "10-tts-education-accessibility", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["tts","education"] },
  { slug: "11-pdf-browser-processing", titleKey: "", excerptKey: "", bodyKey: "11-pdf-browser-processing", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["pdf","privacy"] },
  { slug: "12-pdf-to-text-workflow", titleKey: "", excerptKey: "", bodyKey: "12-pdf-to-text-workflow", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["pdf","workflow"] },
  { slug: "13-pdf-ocr-guide", titleKey: "", excerptKey: "", bodyKey: "13-pdf-ocr-guide", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["ocr","pdf"] },
  { slug: "14-pdf-format-conversion", titleKey: "", excerptKey: "", bodyKey: "14-pdf-format-conversion", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["pdf","conversion"] },
  { slug: "15-pdf-automation-webworkers", titleKey: "", excerptKey: "", bodyKey: "15-pdf-automation-webworkers", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["pdf","webworkers"] },
  { slug: "16-privacy-local-first-webtools-ar", titleKey: "", excerptKey: "", bodyKey: "16-privacy-local-first-webtools-ar", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy","local"] },
  { slug: "17-privacy-browser-security-ar", titleKey: "", excerptKey: "", bodyKey: "17-privacy-browser-security-ar", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy","security"] },
  { slug: "18-privacy-creator-tips-ar", titleKey: "", excerptKey: "", bodyKey: "18-privacy-creator-tips-ar", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy","creators"] },
  { slug: "19-privacy-saas-trust-ar", titleKey: "", excerptKey: "", bodyKey: "19-privacy-saas-trust-ar", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy","saas"] },
  { slug: "20-privacy-local-first-ar", titleKey: "", excerptKey: "", bodyKey: "20-privacy-local-first-ar", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy","local"] },
];

// Append additional posts to the site index
BLOG_POSTS.push(...(additionalPosts as any));

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