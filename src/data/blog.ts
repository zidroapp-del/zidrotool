import type { BlogPost, BlogAuthor, BlogCategory } from "@/types";

export const BLOG_CATEGORIES: BlogCategory[] = [
  { slug: "ai", nameKey: "blog.cat.ai", descKey: "blog.cat.ai.desc", icon: "Sparkles", color: "brand" },
  { slug: "pdf", nameKey: "blog.cat.pdf", descKey: "blog.cat.pdf.desc", icon: "FileType", color: "danger" },
  { slug: "images", nameKey: "blog.cat.images", descKey: "blog.cat.images.desc", icon: "FileImage", color: "accent" },
  { slug: "developers", nameKey: "blog.cat.developers", descKey: "blog.cat.developers.desc", icon: "Code2", color: "brand" },
  { slug: "productivity", nameKey: "blog.cat.productivity", descKey: "blog.cat.productivity.desc", icon: "Wand2", color: "warning" },
  { slug: "finance", nameKey: "blog.cat.finance", descKey: "blog.cat.finance.desc", icon: "DollarSign", color: "success" },
  { slug: "health", nameKey: "blog.cat.health", descKey: "blog.cat.health.desc", icon: "HeartPulse", color: "danger" },
  { slug: "technology", nameKey: "blog.cat.technology", descKey: "blog.cat.technology.desc", icon: "Globe", color: "accent" },
  { slug: "tutorials", nameKey: "blog.cat.tutorials", descKey: "blog.cat.tutorials.desc", icon: "BookOpen", color: "brand" },
  { slug: "company", nameKey: "blog.cat.company", descKey: "blog.cat.company.desc", icon: "Bookmark", color: "warning" },
];

export const BLOG_AUTHORS: BlogAuthor[] = [
  { slug: "sarah-chen", name: "Sarah Chen", role: "Lead Engineer", bioKey: "blog.author.sarah.bio", avatar: "from-brand-500 to-accent-500", twitter: "sarahchen", github: "sarahchen", website: "sarahchen.dev" },
  { slug: "marcus-webb", name: "Marcus Webb", role: "Developer Advocate", bioKey: "blog.author.marcus.bio", avatar: "from-accent-500 to-brand-600", twitter: "marcuswebb", linkedin: "marcuswebb", website: "marcuswebb.io" },
  { slug: "priya-sharma", name: "Priya Sharma", role: "Product Designer", bioKey: "blog.author.priya.bio", avatar: "from-warning-600 to-danger", twitter: "priyadesigns", website: "priyasharma.design" },
  { slug: "james-okafor", name: "James Okafor", role: "Security Engineer", bioKey: "blog.author.james.bio", avatar: "from-success-600 to-brand-500", github: "jokafor", linkedin: "jamesokafor" },
  { slug: "elena-rossi", name: "Elena Rossi", role: "Content Strategist", bioKey: "blog.author.elena.bio", avatar: "from-danger to-accent-600", twitter: "elenawrites", linkedin: "elenarossi" },
  { slug: "zidrotool-team", name: "The ZidroTool Team", role: "Founders", bioKey: "blog.author.team.bio", avatar: "from-brand-600 to-success-600" },
];

const GRADIENTS: Record<string, string> = {
  brand: "from-brand-400 via-brand-600 to-accent-600",
  danger: "from-danger via-danger-600 to-warning-600",
  accent: "from-accent-400 via-accent-600 to-brand-600",
  warning: "from-warning-500 via-warning-600 to-danger",
  success: "from-success-600 via-success-700 to-brand-600",
};

function g(cat: string): string {
  return GRADIENTS[cat] || GRADIENTS.brand;
}

export const BLOG_POSTS: BlogPost[] = [
  // ── AI ──
  { slug: "ai-tools-transforming-productivity", titleKey: "blog.ai-productivity.title", excerptKey: "blog.ai-productivity.excerpt", bodyKey: "blog.ai-productivity.body", category: "ai", authorSlug: "elena-rossi", date: "2026-07-28", readingTime: 8, cover: "gradient", coverGradient: g("brand"), featured: true, tags: ["ai", "productivity", "automation"], seoTitleKey: "blog.ai-productivity.seoTitle", seoDescKey: "blog.ai-productivity.seoDesc" },
  { slug: "understanding-llms-beginners-guide", titleKey: "blog.llm-guide.title", excerptKey: "blog.llm-guide.excerpt", bodyKey: "blog.llm-guide.body", category: "ai", authorSlug: "sarah-chen", date: "2026-07-20", readingTime: 10, cover: "gradient", coverGradient: g("brand"), tags: ["ai", "llm", "machine-learning"], seoTitleKey: "blog.llm-guide.seoTitle", seoDescKey: "blog.llm-guide.seoDesc" },
  { slug: "ai-content-rewriting-ethics", titleKey: "blog.ai-ethics.title", excerptKey: "blog.ai-ethics.excerpt", bodyKey: "blog.ai-ethics.body", category: "ai", authorSlug: "elena-rossi", date: "2026-07-10", readingTime: 6, cover: "gradient", coverGradient: g("brand"), tags: ["ai", "ethics", "content"], seoTitleKey: "blog.ai-ethics.seoTitle", seoDescKey: "blog.ai-ethics.seoDesc" },

  // ── PDF ──
  { slug: "pdf-merging-best-practices", titleKey: "blog.pdf-merge.title", excerptKey: "blog.pdf-merge.excerpt", bodyKey: "blog.pdf-merge.body", category: "pdf", authorSlug: "marcus-webb", date: "2026-07-25", readingTime: 5, cover: "gradient", coverGradient: g("danger"), featured: true, tags: ["pdf", "merge", "guide"], seoTitleKey: "blog.pdf-merge.seoTitle", seoDescKey: "blog.pdf-merge.seoDesc" },
  { slug: "compress-pdfs-without-quality-loss", titleKey: "blog.pdf-compress.title", excerptKey: "blog.pdf-compress.excerpt", bodyKey: "blog.pdf-compress.body", category: "pdf", authorSlug: "marcus-webb", date: "2026-07-15", readingTime: 7, cover: "gradient", coverGradient: g("danger"), tags: ["pdf", "compress", "optimization"], seoTitleKey: "blog.pdf-compress.seoTitle", seoDescKey: "blog.pdf-compress.seoDesc" },

  // ── Images ──
  { slug: "image-optimization-web-guide", titleKey: "blog.image-opt.title", excerptKey: "blog.image-opt.excerpt", bodyKey: "blog.image-opt.body", category: "images", authorSlug: "priya-sharma", date: "2026-07-22", readingTime: 9, cover: "gradient", coverGradient: g("accent"), featured: true, tags: ["images", "optimization", "webp"], seoTitleKey: "blog.image-opt.seoTitle", seoDescKey: "blog.image-opt.seoDesc" },
  { slug: "choosing-right-image-format", titleKey: "blog.image-formats.title", excerptKey: "blog.image-formats.excerpt", bodyKey: "blog.image-formats.body", category: "images", authorSlug: "priya-sharma", date: "2026-07-08", readingTime: 6, cover: "gradient", coverGradient: g("accent"), tags: ["images", "png", "jpg", "webp"], seoTitleKey: "blog.image-formats.seoTitle", seoDescKey: "blog.image-formats.seoDesc" },

  // ── Developers ──
  { slug: "json-formatting-why-it-matters", titleKey: "blog.json-format.title", excerptKey: "blog.json-format.excerpt", bodyKey: "blog.json-format.body", category: "developers", authorSlug: "sarah-chen", date: "2026-07-18", readingTime: 7, cover: "gradient", coverGradient: g("brand"), tags: ["json", "developer", "api"], seoTitleKey: "blog.json-format.seoTitle", seoDescKey: "blog.json-format.seoDesc" },
  { slug: "jwt-security-best-practices", titleKey: "blog.jwt-security.title", excerptKey: "blog.jwt-security.excerpt", bodyKey: "blog.jwt-security.body", category: "developers", authorSlug: "james-okafor", date: "2026-07-12", readingTime: 11, cover: "gradient", coverGradient: g("brand"), featured: true, tags: ["jwt", "security", "authentication"], seoTitleKey: "blog.jwt-security.seoTitle", seoDescKey: "blog.jwt-security.seoDesc" },
  { slug: "regex-cheat-sheet-for-developers", titleKey: "blog.regex-cheat.title", excerptKey: "blog.regex-cheat.excerpt", bodyKey: "blog.regex-cheat.body", category: "developers", authorSlug: "marcus-webb", date: "2026-06-28", readingTime: 8, cover: "gradient", coverGradient: g("brand"), tags: ["regex", "developer", "reference"], seoTitleKey: "blog.regex-cheat.seoTitle", seoDescKey: "blog.regex-cheat.seoDesc" },
  { slug: "base64-encoding-explained", titleKey: "blog.base64-explained.title", excerptKey: "blog.base64-explained.excerpt", bodyKey: "blog.base64-explained.body", category: "developers", authorSlug: "sarah-chen", date: "2026-06-20", readingTime: 5, cover: "gradient", coverGradient: g("brand"), tags: ["base64", "encoding", "developer"], seoTitleKey: "blog.base64-explained.seoTitle", seoDescKey: "blog.base64-explained.seoDesc" },

  // ── Productivity ──
  { slug: "pomodoro-technique-complete-guide", titleKey: "blog.pomodoro.title", excerptKey: "blog.pomodoro.excerpt", bodyKey: "blog.pomodoro.body", category: "productivity", authorSlug: "elena-rossi", date: "2026-07-05", readingTime: 6, cover: "gradient", coverGradient: g("warning"), tags: ["productivity", "pomodoro", "focus"], seoTitleKey: "blog.pomodoro.seoTitle", seoDescKey: "blog.pomodoro.seoDesc" },
  { slug: "developer-productivity-tools-2026", titleKey: "blog.dev-productivity.title", excerptKey: "blog.dev-productivity.excerpt", bodyKey: "blog.dev-productivity.body", category: "productivity", authorSlug: "marcus-webb", date: "2026-06-25", readingTime: 9, cover: "gradient", coverGradient: g("warning"), tags: ["productivity", "developer", "tools"], seoTitleKey: "blog.dev-productivity.seoTitle", seoDescKey: "blog.dev-productivity.seoDesc" },

  // ── Finance ──
  { slug: "compound-interest-explained", titleKey: "blog.compound-interest.title", excerptKey: "blog.compound-interest.excerpt", bodyKey: "blog.compound-interest.body", category: "finance", authorSlug: "elena-rossi", date: "2026-07-01", readingTime: 7, cover: "gradient", coverGradient: g("success"), tags: ["finance", "investing", "savings"], seoTitleKey: "blog.compound-interest.seoTitle", seoDescKey: "blog.compound-interest.seoDesc" },
  { slug: "understanding-loan-amortization", titleKey: "blog.loan-amort.title", excerptKey: "blog.loan-amort.excerpt", bodyKey: "blog.loan-amort.body", category: "finance", authorSlug: "elena-rossi", date: "2026-06-18", readingTime: 8, cover: "gradient", coverGradient: g("success"), tags: ["finance", "loans", "mortgage"], seoTitleKey: "blog.loan-amort.seoTitle", seoDescKey: "blog.loan-amort.seoDesc" },

  // ── Health ──
  { slug: "bmi-and-what-it-really-means", titleKey: "blog.bmi-guide.title", excerptKey: "blog.bmi-guide.excerpt", bodyKey: "blog.bmi-guide.body", category: "health", authorSlug: "priya-sharma", date: "2026-06-22", readingTime: 5, cover: "gradient", coverGradient: g("danger"), tags: ["health", "bmi", "fitness"], seoTitleKey: "blog.bmi-guide.seoTitle", seoDescKey: "blog.bmi-guide.seoDesc" },
  { slug: "daily-water-intake-guide", titleKey: "blog.water-intake.title", excerptKey: "blog.water-intake.excerpt", bodyKey: "blog.water-intake.body", category: "health", authorSlug: "priya-sharma", date: "2026-06-10", readingTime: 4, cover: "gradient", coverGradient: g("danger"), tags: ["health", "hydration", "wellness"], seoTitleKey: "blog.water-intake.seoTitle", seoDescKey: "blog.water-intake.seoDesc" },

  // ── Technology ──
  { slug: "browser-based-tools-future", titleKey: "blog.browser-tools.title", excerptKey: "blog.browser-tools.excerpt", bodyKey: "blog.browser-tools.body", category: "technology", authorSlug: "sarah-chen", date: "2026-07-03", readingTime: 8, cover: "gradient", coverGradient: g("accent"), featured: true, tags: ["technology", "browser", "wasm"], seoTitleKey: "blog.browser-tools.seoTitle", seoDescKey: "blog.browser-tools.seoDesc" },
  { slug: "privacy-first-web-apps", titleKey: "blog.privacy-first.title", excerptKey: "blog.privacy-first.excerpt", bodyKey: "blog.privacy-first.body", category: "technology", authorSlug: "james-okafor", date: "2026-06-15", readingTime: 7, cover: "gradient", coverGradient: g("accent"), tags: ["privacy", "security", "web"], seoTitleKey: "blog.privacy-first.seoTitle", seoDescKey: "blog.privacy-first.seoDesc" },

  // ── Tutorials ──
  { slug: "how-to-use-json-formatter", titleKey: "blog.tut-json.title", excerptKey: "blog.tut-json.excerpt", bodyKey: "blog.tut-json.body", category: "tutorials", authorSlug: "marcus-webb", date: "2026-07-08", readingTime: 4, cover: "gradient", coverGradient: g("brand"), tags: ["tutorial", "json", "beginner"], seoTitleKey: "blog.tut-json.seoTitle", seoDescKey: "blog.tut-json.seoDesc" },
  { slug: "how-to-generate-secure-passwords", titleKey: "blog.tut-passwords.title", excerptKey: "blog.tut-passwords.excerpt", bodyKey: "blog.tut-passwords.body", category: "tutorials", authorSlug: "james-okafor", date: "2026-06-12", readingTime: 5, cover: "gradient", coverGradient: g("brand"), tags: ["tutorial", "password", "security"], seoTitleKey: "blog.tut-passwords.seoTitle", seoDescKey: "blog.tut-passwords.seoDesc" },

  // ── Company ──
  { slug: "welcome-to-zidrotool", titleKey: "blog.welcome.title", excerptKey: "blog.welcome.excerpt", bodyKey: "blog.welcome.body", category: "company", authorSlug: "zidrotool-team", date: "2026-08-10", readingTime: 4, cover: "gradient", coverGradient: g("warning"), featured: true, tags: ["announcement", "product"], seoTitleKey: "blog.welcome.seoTitle", seoDescKey: "blog.welcome.seoDesc" },
  { slug: "zidrotool-hits-100-tools", titleKey: "blog.100-tools.title", excerptKey: "blog.100-tools.excerpt", bodyKey: "blog.100-tools.body", category: "company", authorSlug: "zidrotool-team", date: "2026-07-30", readingTime: 3, cover: "gradient", coverGradient: g("warning"), tags: ["milestone", "product", "announcement"], seoTitleKey: "blog.100-tools.seoTitle", seoDescKey: "blog.100-tools.seoDesc" },
  { slug: "changelog-july-2026", titleKey: "blog.changelog-july.title", excerptKey: "blog.changelog-july.excerpt", bodyKey: "blog.changelog-july.body", category: "company", authorSlug: "zidrotool-team", date: "2026-07-31", readingTime: 3, cover: "gradient", coverGradient: g("warning"), tags: ["changelog", "update"], seoTitleKey: "blog.changelog-july.seoTitle", seoDescKey: "blog.changelog-july.seoDesc" },
];

// ═══════════════════════════════════════════════════════════
//  O(1) lookups — scalable to thousands of posts
// ═══════════════════════════════════════════════════════════

const POST_MAP: ReadonlyMap<string, BlogPost> = new Map(BLOG_POSTS.map((p) => [p.slug, p]));
const AUTHOR_MAP: ReadonlyMap<string, BlogAuthor> = new Map(BLOG_AUTHORS.map((a) => [a.slug, a]));
const CATEGORY_MAP: ReadonlyMap<string, BlogCategory> = new Map(BLOG_CATEGORIES.map((c) => [c.slug, c]));
const POSTS_BY_CATEGORY: ReadonlyMap<string, BlogPost[]> = new Map(
  BLOG_CATEGORIES.map((c) => [c.slug, BLOG_POSTS.filter((p) => p.category === c.slug).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())]),
);
const POSTS_BY_AUTHOR: ReadonlyMap<string, BlogPost[]> = new Map(
  BLOG_AUTHORS.map((a) => [a.slug, BLOG_POSTS.filter((p) => p.authorSlug === a.slug).sort((a2, b) => new Date(b.date).getTime() - new Date(a2.date).getTime())]),
);

export function getPost(slug: string): BlogPost | undefined {
  return POST_MAP.get(slug);
}

export function getAuthor(slug: string): BlogAuthor | undefined {
  return AUTHOR_MAP.get(slug);
}

export function getBlogCategory(slug: string): BlogCategory | undefined {
  return CATEGORY_MAP.get(slug);
}

export function postsByCategory(cat: string): BlogPost[] {
  return POSTS_BY_CATEGORY.get(cat) ?? [];
}

export function postsByAuthor(authorSlug: string): BlogPost[] {
  return POSTS_BY_AUTHOR.get(authorSlug) ?? [];
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const sameCat = postsByCategory(post.category).filter((p) => p.slug !== post.slug);
  if (sameCat.length >= limit) return sameCat.slice(0, limit);
  const others = BLOG_POSTS
    .filter((p) => p.slug !== post.slug && p.category !== post.category)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return [...sameCat, ...others].slice(0, limit);
}

export function getFeaturedPosts(limit = 3): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.featured).slice(0, limit);
}

export function getRecentPosts(limit = 6): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
}

export function getPopularPosts(limit = 5): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.readingTime - a.readingTime).slice(0, limit);
}

export function searchPosts(query: string, limit = 20): BlogPost[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return BLOG_POSTS.filter((p) => {
    const tags = p.tags.join(" ").toLowerCase();
    return p.slug.includes(q) || tags.includes(q);
  }).slice(0, limit);
}

export function getCategoryPostCount(slug: string): number {
  return (POSTS_BY_CATEGORY.get(slug) ?? []).length;
}

export function getAuthorPostCount(slug: string): number {
  return (POSTS_BY_AUTHOR.get(slug) ?? []).length;
}
