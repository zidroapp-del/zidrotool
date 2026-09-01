export type Lang = "en" | "fr" | "de" | "es" | "it" | "ar";
export type ThemeMode = "light" | "dark" | "system";

export interface ToolKeyword {
  word: string;
  lang?: Lang;
}

export interface Tool {
  slug: string;
  nameKey: string;
  descKey: string;
  seoTitleKey: string;
  seoDescKey: string;
  category: string;
  icon: string;
  keywords?: string[];
  tags?: string[];
  relatedSlugs?: string[];
  component: string;
  implemented?: boolean;
  premium?: boolean;
  trending?: boolean;
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
  addedAt?: string;
  updatedAt?: string;
  editorsPick?: boolean;
  popularity?: number;
}

export interface Category {
  slug: string;
  nameKey: string;
  descKey: string;
  icon: string;
  color: string;
}

export interface BlogAuthor {
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

export interface BlogCategory {
  slug: string;
  nameKey: string;
  descKey: string;
  icon: string;
  color: string;
}

export interface BlogPost {
  slug: string;
  titleKey: string;
  excerptKey: string;
  bodyKey: string;
  category: string;
  authorSlug: string;
  date: string;
  readingTime: number;
  cover: string;
  coverGradient: string;
  featured?: boolean;
  tags: string[];
  seoTitleKey?: string;
  seoDescKey?: string;
}

export interface FaqItem {
  qKey: string;
  aKey: string;
}

export interface HowToStep {
  titleKey: string;
  descKey: string;
}
