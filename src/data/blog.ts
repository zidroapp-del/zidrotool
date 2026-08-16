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
    nameKey: "SEO & Analytics",
    coverImage: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=400&q=80"
  },
  {
    slug: "web-development",
    nameKey: "Web Development",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80"
  },
  {
    slug: "text-utilities",
    nameKey: "Text Utilities",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80"
  }
];

export const AUTHORS: Author[] = [
  {
    slug: "zidro-team",
    name: "ZidroTool Team",
    role: "Core Developers",
    bioKey: "ZidroTool Content & Engineering Team",
    avatar: "from-blue-500 to-indigo-600",
    twitter: "https://twitter.com"
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-optimize-seo-tools",
    titleKey: "Welcome to ZidroTool",
    excerptKey: "We're excited to launch ZidroTool — a growing collection of smart, free online tools.",
    bodyKey: "Welcome to ZidroTool, your go-to hub for free, fast, and local-first online web utilities.",
    category: "seo-analytics",
    authorSlug: "zidro-team",
    date: "2026-08-01",
    readingTime: 5,
    tags: ["SEO", "Web", "Analytics"],
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
  }
];

const additionalPosts: BlogPost[] = [
  // STT Articles
  { slug: "speech-to-text-benefits", titleKey: "Speech To Text Benefits", excerptKey: "Explore how speech to text technology boosts daily workflow.", bodyKey: "Speech to text tools allow users to transcribe voice into text instantly...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["speech-to-text", "speech", "stt"] },
  { slug: "speech-to-text-mobile-tips", titleKey: "Speech To Text Mobile Tips", excerptKey: "Tips and tricks for using voice recognition on mobile devices.", bodyKey: "Using voice recognition on mobile devices requires clear audio input...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["speech-to-text", "mobile", "stt"] },
  { slug: "stt-privacy-guide", titleKey: "STT Privacy Guide", excerptKey: "Understanding privacy in browser-based voice transcription.", bodyKey: "Privacy is critical when dealing with voice recordings...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["speech-to-text", "privacy", "stt"] },
  { slug: "voice-productivity", titleKey: "Voice Productivity", excerptKey: "How voice input speeds up writing and documentation.", bodyKey: "Writing with your voice can increase productivity by up to 3x...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["speech-to-text", "productivity", "voice"] },
  { slug: "stt-multilingual", titleKey: "STT Multilingual Support", excerptKey: "Transcribing audio across multiple languages accurately.", bodyKey: "Modern Web Speech APIs support over 80 languages...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["speech-to-text", "multilingual", "stt"] },

  // TTS Articles
  { slug: "tts-accessibility-fundamentals", titleKey: "TTS Accessibility Fundamentals", excerptKey: "Improving web accessibility through Text To Speech engines.", bodyKey: "Text to Speech technology enables visually impaired users to consume digital content easily...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["text-to-speech", "tts", "accessibility"] },
  { slug: "tts-content-creation", titleKey: "TTS in Content Creation", excerptKey: "Creating voiceovers and audio guides automatically with TTS.", bodyKey: "Generative AI and web speech synthesis allow automated audio creation...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["text-to-speech", "tts", "content"] },
  { slug: "tts-elevenlabs-guide", titleKey: "TTS AI Voice Guide", excerptKey: "Exploring natural AI voices for digital web applications.", bodyKey: "AI voice technology brings high fidelity and realistic speech synthesis...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 5, tags: ["text-to-speech", "tts", "ai"] },
  { slug: "tts-best-practices", titleKey: "TTS Integration Best Practices", excerptKey: "Optimal configurations for browser audio playback engines.", bodyKey: "Integrating browser-native Web Speech API vs external AI services...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["text-to-speech", "tts", "best-practices"] },
  { slug: "tts-education-accessibility", titleKey: "TTS in Modern Education", excerptKey: "How synthetic speech aids e-learning platforms and students.", bodyKey: "E-learning systems benefit heavily from audio feedback and reading tools...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["text-to-speech", "tts", "education"] },

  // PDF Articles
  { slug: "pdf-browser-processing", titleKey: "PDF Browser Processing", excerptKey: "Secure in-browser client-side PDF document manipulation.", bodyKey: "Processing PDF files directly in the user browser guarantees maximum security...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["pdf-to-text", "pdf", "privacy"] },
  { slug: "pdf-to-text-workflow", titleKey: "PDF to Text Workflow", excerptKey: "Extracting readable text structures from complex PDF files.", bodyKey: "Extracting clean text from unstructured PDF documents is vital for searchability...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["pdf-to-text", "pdf", "workflow"] },
  { slug: "pdf-ocr-guide", titleKey: "PDF OCR Extraction Guide", excerptKey: "Optical character recognition directly inside modern browsers.", bodyKey: "Optical character recognition converts scanned PDF documents into selectable text...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["image-to-text", "ocr", "pdf"] },
  { slug: "pdf-format-conversion", titleKey: "PDF Format Conversion", excerptKey: "Converting web formats to clean PDF files on demand.", bodyKey: "Converting web formats into PDF allows seamless document archiving...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 4, tags: ["pdf-to-text", "pdf", "conversion"] },
  { slug: "pdf-automation-webworkers", titleKey: "PDF Web Workers Automation", excerptKey: "Offloading heavy document parsing using background threads.", bodyKey: "Web Workers prevent the UI thread from freezing when parsing massive PDF files...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["pdf-to-text", "pdf", "webworkers"] },

  // Arabic / Privacy Articles
  { slug: "privacy-local-first-webtools-ar", titleKey: "أدوات الويب المحلية وحماية الخصوصية", excerptKey: "دليل حماية البيانات الشخصية عبر معالجة الصور والمستندات محلياً.", bodyKey: "تعتبر المعالجة المحلية للبيانات هي الضمان الأول لحماية خصوصيتك في عصر الإنترنت...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy", "arabic", "pdf-to-text"] },
  { slug: "privacy-browser-security-ar", titleKey: "أمان المتصفح وتشفير الأدوات", excerptKey: "كيف تضمن معالجة بياناتك داخل المتصفح دون رفعه للسيرفرات.", bodyKey: "عند استخدام أدوات المعالجة داخل المتصفح، تظل كافة ملفاتك مخزنة محلياً...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy", "security", "arabic"] },
  { slug: "privacy-creator-tips-ar", titleKey: "نصائح حماية بيانات صناع المحتوى", excerptKey: "أهم الممارسات الأمنية لإدارة الملفات والمستندات الرقمية.", bodyKey: "صناع المحتوى يحتاجون حماية ملكيتهم الفكرية وملفاتهم من التسريب...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy", "creators", "arabic"] },
  { slug: "privacy-saas-trust-ar", titleKey: "بناء الثقة في أدوات الساس المستقلة", excerptKey: "لماذا تعد معمارية Local-First المستقبل الحقيقي لأدوات الويب.", bodyKey: "الشركات الناشئة تتوجه نحو أدوات معالجة النصوص الصوتية والمستندات بدون خوادم...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy", "saas", "arabic"] },
  { slug: "privacy-local-first-ar", titleKey: "المعالجة المحلية أولاً للمستندات", excerptKey: "تحليل تقني لكيفية عمل تحويل النصوص والصوتيات بدون إنترنت.", bodyKey: "تقنيات Wasm و Web Speech تتيح تحويل الصوت إلى نص مباشرة في متصفحك...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-14", readingTime: 3, tags: ["privacy", "local", "arabic"] },

  // Multilingual International Articles
  { slug: "voice-ai-productivity", titleKey: "Voice AI Productivity Solutions", excerptKey: "Optimizing audio generation workflows for modern web platforms.", bodyKey: "Voice AI solutions reduce manual transcription times and streamline content production...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-15", readingTime: 4, tags: ["speech-to-text", "voice", "ai"] },
  { slug: "tts-accessibility-de", titleKey: "Barrierefreiheit durch Text-to-Speech", excerptKey: "Digitale Barrierefreiheit mit modernen Synthesizer-Tools steigern.", bodyKey: "Text-to-Speech-Technologie ermöglicht بارrierefreien Zugang zu Webinhalten...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-15", readingTime: 4, tags: ["text-to-speech", "tts", "german"] },
  { slug: "pdf-browser-security-de", titleKey: "PDF-Sicherheit im Browser", excerptKey: "Lokale Dokumentenverarbeitung ohne Server-Uploads erklärt.", bodyKey: "Sichere PDF-Konvertierung direkt im Browser schützt sensible Firmendaten...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-15", readingTime: 4, tags: ["pdf-to-text", "pdf", "german"] },
  { slug: "modern-web-utilities-de", titleKey: "Moderne Web-Utilitäter für Entwickler", excerptKey: "Effiziente Online-Werkzeuge für produktive digitale Arbeitsabläufe.", bodyKey: "Entwickler profitieren von schnellen Browser-Tools für Konvertierung und Audio...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-15", readingTime: 4, tags: ["tools", "german"] },
  { slug: "speech-to-text-productivity-fr", titleKey: "Améliorer sa productivité avec Speech-to-Text", excerptKey: "Découvrez comment la transcription vocale transforme le travail.", bodyKey: "La reconnaissance vocale moderne permet de saisir des textes à une vitesse impressionnante...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-15", readingTime: 4, tags: ["speech-to-text", "stt", "french"] },
  { slug: "text-to-speech-accessibility-fr", titleKey: "Synthèse vocale et accessibilité web", excerptKey: "Guide complet sur l'intégration du Text-to-Speech sur le web.", bodyKey: "La synthèse vocale (Text-to-Speech) est un pilier essentiel de l'accessibilité web moderne. Elle permet de convertir tout texte écrit en un flux audio naturel.", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-15", readingTime: 4, tags: ["text-to-speech", "tts", "french"] },
  { slug: "conversion-audio-texte-fr", titleKey: "Guide de la conversion Audio en Texte", excerptKey: "Optimisez vos flux de transcription directement en ligne.", bodyKey: "Convertir l'audio en texte automatiquement enregistre un gain de temps considérable...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-15", readingTime: 4, tags: ["speech-to-text", "audio", "french"] },
  { slug: "confidentialite-donnees-outils-locaux-fr", titleKey: "Confidentialité et utilitaires web locaux", excerptKey: "Pourquoi la confidentialité Client-Side est primordiale aujourd'hui.", bodyKey: "Traiter vos données directement dans le navigateur sans transfert vers un serveur distant est la meilleure garantie de confidentialité...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-15", readingTime: 4, tags: ["privacy", "french"] },
  { slug: "meilleurs-outils-web-createurs-contenu-fr", titleKey: "Les meilleurs utilitaires web pour les créateurs", excerptKey: "Outils essentiels pour gagner du temps et améliorer votre productivité.", bodyKey: "Les créateurs de contenu bénéficient grandement d'outils web rapides pour la génération de texte et l'extraction de fichiers...", category: "text-utilities", authorSlug: "zidro-team", date: "2026-08-15", readingTime: 5, tags: ["creators", "french"] }
];

BLOG_POSTS.push(...additionalPosts);

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
  return BLOG_POSTS.filter((p) => p.authorSlug === authorSlug);
}