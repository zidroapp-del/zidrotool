import type { Category, Tool } from "@/types";

export const CATEGORIES: Category[] = [
  { slug: "image", nameKey: "category.image.name", descKey: "category.image.desc", icon: "FileImage", color: "brand" },
  { slug: "pdf", nameKey: "category.pdf.name", descKey: "category.pdf.desc", icon: "FileType", color: "danger" },
  { slug: "text", nameKey: "category.text.name", descKey: "category.text.desc", icon: "Type", color: "accent" },
  { slug: "dev", nameKey: "category.dev.name", descKey: "category.dev.desc", icon: "Code2", color: "brand" },
  { slug: "seo", nameKey: "category.seo.name", descKey: "category.seo.desc", icon: "Search", color: "accent" },
  { slug: "ai", nameKey: "category.ai.name", descKey: "category.ai.desc", icon: "Sparkles", color: "warning" },
  { slug: "finance", nameKey: "category.finance.name", descKey: "category.finance.desc", icon: "DollarSign", color: "success" },
  { slug: "health", nameKey: "category.health.name", descKey: "category.health.desc", icon: "HeartPulse", color: "danger" },
  { slug: "converters", nameKey: "category.converters.name", descKey: "category.converters.desc", icon: "ArrowLeftRight", color: "accent" },
  { slug: "utilities", nameKey: "category.utilities.name", descKey: "category.utilities.desc", icon: "Globe", color: "brand" },
  { slug: "security", nameKey: "category.security.name", descKey: "category.security.desc", icon: "Shield", color: "success" },
  { slug: "social", nameKey: "category.social.name", descKey: "category.social.desc", icon: "Share2", color: "warning" },
  { slug: "creator", nameKey: "category.creator.name", descKey: "category.creator.desc", icon: "Video", color: "danger" },
];

const n = (slug: string) => `tool.${slug}.name`;
const d = (slug: string) => `tool.${slug}.desc`;
const st = (slug: string) => `tool.${slug}.seoTitle`;
const sd = (slug: string) => `tool.${slug}.seoDesc`;

export const TOOLS: Tool[] = [
  // ═══════════════════════════════════════════════════════════
  //  TEXT TOOLS (10)
  // ═══════════════════════════════════════════════════════════
  { slug: "case-converter", nameKey: n("case-converter"), descKey: d("case-converter"), seoTitleKey: st("case-converter"), seoDescKey: sd("case-converter"), category: "text", icon: "CaseSensitive", keywords: ["uppercase","lowercase","title","camel","snake","kebab"], tags: ["text","case","format"], relatedSlugs: ["word-counter","text-reverser","lorem-ipsum","markdown-preview"], component: "tools/CaseConverter", implemented: true, featured: true, trending: true, popular: true, popularity: 95, addedAt: "2025-01-10" },
  { slug: "word-counter", nameKey: n("word-counter"), descKey: d("word-counter"), seoTitleKey: st("word-counter"), seoDescKey: sd("word-counter"), category: "text", icon: "CaseUpper", keywords: ["count","words","characters","sentences","paragraphs"], tags: ["text","counting","writing"], relatedSlugs: ["case-converter","lorem-ipsum","text-reverser","twitter-counter"], component: "tools/WordCounter", implemented: true, popular: true, popularity: 90, addedAt: "2025-01-12" },
  { slug: "lorem-ipsum", nameKey: n("lorem-ipsum"), descKey: d("lorem-ipsum"), seoTitleKey: st("lorem-ipsum"), seoDescKey: sd("lorem-ipsum"), category: "text", icon: "AlignLeft", keywords: ["placeholder","dummy","text","generator"], tags: ["text","generator","design"], relatedSlugs: ["word-counter","case-converter","markdown-preview","text-reverser"], component: "tools/LoremIpsum", implemented: true, trending: true, popularity: 70, addedAt: "2025-02-01" },
  { slug: "text-reverser", nameKey: n("text-reverser"), descKey: d("text-reverser"), seoTitleKey: st("text-reverser"), seoDescKey: sd("text-reverser"), category: "text", icon: "FlipHorizontal", keywords: ["reverse","backwards","mirror"], tags: ["text","reverse","fun"], relatedSlugs: ["case-converter","word-counter","lorem-ipsum","twitter-counter"], component: "tools/TextReverser", implemented: true, popularity: 40, addedAt: "2025-02-20" },
  { slug: "markdown-preview", nameKey: n("markdown-preview"), descKey: d("markdown-preview"), seoTitleKey: st("markdown-preview"), seoDescKey: sd("markdown-preview"), category: "text", icon: "FileText", keywords: ["markdown","md","preview","render"], tags: ["text","markdown","html"], relatedSlugs: ["case-converter","word-counter","lorem-ipsum","html-encoder"], component: "tools/MarkdownPreview", implemented: true, popular: true, popularity: 72, addedAt: "2025-02-15" },
  { slug: "text-diff-checker", nameKey: n("text-diff-checker"), descKey: d("text-diff-checker"), seoTitleKey: st("text-diff-checker"), seoDescKey: sd("text-diff-checker"), category: "text", icon: "FileDiff", keywords: ["diff","compare","text","difference"], tags: ["text","compare","diff"], relatedSlugs: ["word-counter","case-converter","markdown-preview","text-reverser"], component: "tools/TextDiffChecker", isNew: true, popularity: 65, addedAt: "2025-06-01" },
  { slug: "text-repeater", nameKey: n("text-repeater"), descKey: d("text-repeater"), seoTitleKey: st("text-repeater"), seoDescKey: sd("text-repeater"), category: "text", icon: "Repeat2", keywords: ["repeat","duplicate","multiply","text"], tags: ["text","repeat"], relatedSlugs: ["text-reverser","case-converter","lorem-ipsum","word-counter"], component: "tools/TextRepeater", popularity: 35, addedAt: "2025-06-03" },
  { slug: "remove-line-breaks", nameKey: n("remove-line-breaks"), descKey: d("remove-line-breaks"), seoTitleKey: st("remove-line-breaks"), seoDescKey: sd("remove-line-breaks"), category: "text", icon: "AlignLeft", keywords: ["line breaks","remove","clean","text"], tags: ["text","formatting","clean"], relatedSlugs: ["case-converter","word-counter","text-reverser","text-repeater"], component: "tools/RemoveLineBreaks", popularity: 48, addedAt: "2025-06-05" },
  { slug: "find-and-replace", nameKey: n("find-and-replace"), descKey: d("find-and-replace"), seoTitleKey: st("find-and-replace"), seoDescKey: sd("find-and-replace"), category: "text", icon: "Search", keywords: ["find","replace","text","search"], tags: ["text","search","replace"], relatedSlugs: ["word-counter","case-converter","text-diff-checker","remove-line-breaks"], component: "tools/FindAndReplace", popularity: 62, isNew: true, addedAt: "2025-06-07" },
  { slug: "whitespace-remover", nameKey: n("whitespace-remover"), descKey: d("whitespace-remover"), seoTitleKey: st("whitespace-remover"), seoDescKey: sd("whitespace-remover"), category: "text", icon: "Eraser", keywords: ["whitespace","trim","clean","spaces"], tags: ["text","clean","formatting"], relatedSlugs: ["remove-line-breaks","case-converter","word-counter","text-repeater"], component: "tools/WhitespaceRemover", popularity: 38, addedAt: "2025-06-09" },

  // ═══════════════════════════════════════════════════════════
  //  IMAGE TOOLS (10)
  // ═══════════════════════════════════════════════════════════
  { slug: "image-to-base64", nameKey: n("image-to-base64"), descKey: d("image-to-base64"), seoTitleKey: st("image-to-base64"), seoDescKey: sd("image-to-base64"), category: "image", icon: "ImagePlus", keywords: ["image","base64","convert","data uri"], tags: ["image","base64","encoding"], relatedSlugs: ["image-resizer","image-compressor","image-converter","image-cropper"], component: "tools/ImageToBase64", implemented: true, featured: true, popular: true, popularity: 68, addedAt: "2025-02-22" },
  { slug: "image-resizer", nameKey: n("image-resizer"), descKey: d("image-resizer"), seoTitleKey: st("image-resizer"), seoDescKey: sd("image-resizer"), category: "image", icon: "Crop", keywords: ["image","resize","scale","dimensions"], tags: ["image","resize","dimensions"], relatedSlugs: ["image-compressor","image-to-base64","image-converter","social-image-resizer"], component: "tools/ImageResizer", featured: true, trending: true, popular: true, popularity: 85, addedAt: "2025-03-01" },
  { slug: "image-compressor", nameKey: n("image-compressor"), descKey: d("image-compressor"), seoTitleKey: st("image-compressor"), seoDescKey: sd("image-compressor"), category: "image", icon: "Eraser", keywords: ["image","compress","optimize","reduce size"], tags: ["image","compress","optimize"], relatedSlugs: ["image-resizer","image-to-base64","image-converter","image-cropper"], component: "tools/ImageCompressor", featured: true, popular: true, popularity: 88, addedAt: "2025-03-05" },
  { slug: "image-converter", nameKey: n("image-converter"), descKey: d("image-converter"), seoTitleKey: st("image-converter"), seoDescKey: sd("image-converter"), category: "image", icon: "Layers", keywords: ["image","convert","png","jpg","webp"], tags: ["image","convert","format"], relatedSlugs: ["image-to-base64","image-resizer","image-compressor","image-cropper"], component: "tools/ImageConverter", popularity: 65, addedAt: "2025-03-10" },
  { slug: "image-cropper", nameKey: n("image-cropper"), descKey: d("image-cropper"), seoTitleKey: st("image-cropper"), seoDescKey: sd("image-cropper"), category: "image", icon: "Crop", keywords: ["image","crop","trim","cut"], tags: ["image","crop","edit"], relatedSlugs: ["image-resizer","image-compressor","image-converter","image-to-base64"], component: "tools/ImageCropper", popularity: 60, addedAt: "2025-03-12" },
  { slug: "image-rotator", nameKey: n("image-rotator"), descKey: d("image-rotator"), seoTitleKey: st("image-rotator"), seoDescKey: sd("image-rotator"), category: "image", icon: "RotateCw", keywords: ["image","rotate","flip","orientation"], tags: ["image","rotate","edit"], relatedSlugs: ["image-cropper","image-resizer","image-converter","image-compressor"], component: "tools/ImageRotator", popularity: 45, addedAt: "2025-06-01" },
  { slug: "image-filter", nameKey: n("image-filter"), descKey: d("image-filter"), seoTitleKey: st("image-filter"), seoDescKey: sd("image-filter"), category: "image", icon: "Wand2", keywords: ["image","filter","effects","enhance"], tags: ["image","filter","effects"], relatedSlugs: ["image-rotator","image-cropper","image-converter","image-resizer"], component: "tools/ImageFilter", popularity: 52, isNew: true, addedAt: "2025-06-03" },
  { slug: "image-metadata-remover", nameKey: n("image-metadata-remover"), descKey: d("image-metadata-remover"), seoTitleKey: st("image-metadata-remover"), seoDescKey: sd("image-metadata-remover"), category: "image", icon: "EyeOff", keywords: ["image","exif","metadata","privacy"], tags: ["image","privacy","exif"], relatedSlugs: ["image-compressor","image-converter","image-to-base64","image-resizer"], component: "tools/ImageMetadataRemover", popularity: 58, addedAt: "2025-06-05" },
  { slug: "favicon-generator", nameKey: n("favicon-generator"), descKey: d("favicon-generator"), seoTitleKey: st("favicon-generator"), seoDescKey: sd("favicon-generator"), category: "image", icon: "Star", keywords: ["favicon","icon","website","browser"], tags: ["image","favicon","icon"], relatedSlugs: ["image-resizer","image-converter","image-to-base64","logo-maker"], component: "tools/FaviconGenerator", popularity: 50, addedAt: "2025-06-07" },
  { slug: "logo-maker", nameKey: n("logo-maker"), descKey: d("logo-maker"), seoTitleKey: st("logo-maker"), seoDescKey: sd("logo-maker"), category: "image", icon: "Sparkles", keywords: ["logo","brand","design","create"], tags: ["image","logo","brand","design"], relatedSlugs: ["favicon-generator","image-resizer","image-converter","image-filter"], component: "tools/GenericTool", popularity: 55, isNew: true, trending: true, addedAt: "2025-06-09" },

  // ═══════════════════════════════════════════════════════════
  //  PDF TOOLS (8)
  // ═══════════════════════════════════════════════════════════
  { slug: "pdf-merger", nameKey: n("pdf-merger"), descKey: d("pdf-merger"), seoTitleKey: st("pdf-merger"), seoDescKey: sd("pdf-merger"), category: "pdf", icon: "Merge", keywords: ["pdf","merge","combine","join"], tags: ["pdf","merge","combine"], relatedSlugs: ["pdf-splitter","pdf-compressor","pdf-to-image","image-to-pdf"], component: "tools/GenericTool", featured: true, trending: true, popular: true, popularity: 92, addedAt: "2025-03-01" },
  { slug: "pdf-splitter", nameKey: n("pdf-splitter"), descKey: d("pdf-splitter"), seoTitleKey: st("pdf-splitter"), seoDescKey: sd("pdf-splitter"), category: "pdf", icon: "Split", keywords: ["pdf","split","divide","extract pages"], tags: ["pdf","split","extract"], relatedSlugs: ["pdf-merger","pdf-compressor","pdf-to-image","image-to-pdf"], component: "tools/GenericTool", featured: true, popular: true, popularity: 87, addedAt: "2025-03-03" },
  { slug: "pdf-compressor", nameKey: n("pdf-compressor"), descKey: d("pdf-compressor"), seoTitleKey: st("pdf-compressor"), seoDescKey: sd("pdf-compressor"), category: "pdf", icon: "Eraser", keywords: ["pdf","compress","reduce","optimize"], tags: ["pdf","compress","optimize"], relatedSlugs: ["pdf-merger","pdf-splitter","pdf-to-image","image-to-pdf"], component: "tools/GenericTool", popular: true, popularity: 84, addedAt: "2025-03-07" },
  { slug: "pdf-to-image", nameKey: n("pdf-to-image"), descKey: d("pdf-to-image"), seoTitleKey: st("pdf-to-image"), seoDescKey: sd("pdf-to-image"), category: "pdf", icon: "FileImage", keywords: ["pdf","image","convert","png","jpg"], tags: ["pdf","image","convert"], relatedSlugs: ["image-to-pdf","pdf-merger","pdf-splitter","pdf-compressor"], component: "tools/GenericTool", popularity: 79, addedAt: "2025-03-09" },
  { slug: "image-to-pdf", nameKey: n("image-to-pdf"), descKey: d("image-to-pdf"), seoTitleKey: st("image-to-pdf"), seoDescKey: sd("image-to-pdf"), category: "pdf", icon: "FileType", keywords: ["image","pdf","convert","jpg to pdf"], tags: ["pdf","image","convert"], relatedSlugs: ["pdf-to-image","pdf-merger","pdf-splitter","pdf-compressor"], component: "tools/GenericTool", popularity: 76, addedAt: "2025-03-11" },
  { slug: "pdf-rotator", nameKey: n("pdf-rotator"), descKey: d("pdf-rotator"), seoTitleKey: st("pdf-rotator"), seoDescKey: sd("pdf-rotator"), category: "pdf", icon: "RotateCw", keywords: ["pdf","rotate","orientation","pages"], tags: ["pdf","rotate","edit"], relatedSlugs: ["pdf-merger","pdf-splitter","pdf-compressor","pdf-to-image"], component: "tools/GenericTool", popularity: 44, addedAt: "2025-06-01" },
  { slug: "pdf-page-remover", nameKey: n("pdf-page-remover"), descKey: d("pdf-page-remover"), seoTitleKey: st("pdf-page-remover"), seoDescKey: sd("pdf-page-remover"), category: "pdf", icon: "FileMinus", keywords: ["pdf","remove","delete","pages"], tags: ["pdf","remove","pages"], relatedSlugs: ["pdf-splitter","pdf-merger","pdf-rotator","pdf-compressor"], component: "tools/GenericTool", popularity: 41, addedAt: "2025-06-03" },
  { slug: "pdf-watermark", nameKey: n("pdf-watermark"), descKey: d("pdf-watermark"), seoTitleKey: st("pdf-watermark"), seoDescKey: sd("pdf-watermark"), category: "pdf", icon: "Stamp", keywords: ["pdf","watermark","stamp","protect"], tags: ["pdf","watermark","protect"], relatedSlugs: ["pdf-merger","pdf-splitter","pdf-rotator","pdf-compressor"], component: "tools/GenericTool", popularity: 47, isNew: true, addedAt: "2025-06-05" },

  // ═══════════════════════════════════════════════════════════
  //  DEVELOPER TOOLS (12)
  // ═══════════════════════════════════════════════════════════
  { slug: "json-formatter", nameKey: n("json-formatter"), descKey: d("json-formatter"), seoTitleKey: st("json-formatter"), seoDescKey: sd("json-formatter"), category: "dev", icon: "Braces", keywords: ["json","format","beautify","minify","validate"], tags: ["developer","json","format"], relatedSlugs: ["base64","jwt-decoder","hash-generator","url-encoder"], component: "tools/JsonFormatter", implemented: true, featured: true, trending: true, popular: true, popularity: 94, addedAt: "2025-01-06" },
  { slug: "hash-generator", nameKey: n("hash-generator"), descKey: d("hash-generator"), seoTitleKey: st("hash-generator"), seoDescKey: sd("hash-generator"), category: "dev", icon: "ShieldCheck", keywords: ["hash","sha256","sha1","md5","checksum"], tags: ["developer","hash","security"], relatedSlugs: ["jwt-decoder","base64","json-formatter","password-generator"], component: "tools/HashGenerator", implemented: true, popular: true, popularity: 80, addedAt: "2025-01-28" },
  { slug: "jwt-decoder", nameKey: n("jwt-decoder"), descKey: d("jwt-decoder"), seoTitleKey: st("jwt-decoder"), seoDescKey: sd("jwt-decoder"), category: "dev", icon: "KeySquare", keywords: ["jwt","token","decode","json web token"], tags: ["developer","jwt","token"], relatedSlugs: ["hash-generator","base64","json-formatter","url-encoder"], component: "tools/JwtDecoder", implemented: true, trending: true, popular: true, popularity: 76, addedAt: "2025-02-12" },
  { slug: "base64", nameKey: n("base64"), descKey: d("base64"), seoTitleKey: st("base64"), seoDescKey: sd("base64"), category: "dev", icon: "Binary", keywords: ["base64","encode","decode","atob","btoa"], tags: ["developer","base64","encoding"], relatedSlugs: ["url-encoder","hash-generator","json-formatter","html-encoder"], component: "tools/Base64Tool", implemented: true, featured: true, popular: true, popularity: 92, addedAt: "2025-01-08" },
  { slug: "url-encoder", nameKey: n("url-encoder"), descKey: d("url-encoder"), seoTitleKey: st("url-encoder"), seoDescKey: sd("url-encoder"), category: "dev", icon: "Link", keywords: ["url","encode","decode","percent","uri"], tags: ["developer","url","encoding"], relatedSlugs: ["base64","html-encoder","hash-generator","json-formatter"], component: "tools/UrlEncoder", implemented: true, popularity: 78, addedAt: "2025-01-22" },
  { slug: "html-encoder", nameKey: n("html-encoder"), descKey: d("html-encoder"), seoTitleKey: st("html-encoder"), seoDescKey: sd("html-encoder"), category: "dev", icon: "FileCode", keywords: ["html","entity","escape","encode"], tags: ["developer","html","encoding"], relatedSlugs: ["base64","url-encoder","json-formatter","markdown-preview"], component: "tools/HtmlEntityEncoder", implemented: true, popularity: 55, addedAt: "2025-02-10" },
  { slug: "regex-tester", nameKey: n("regex-tester"), descKey: d("regex-tester"), seoTitleKey: st("regex-tester"), seoDescKey: sd("regex-tester"), category: "dev", icon: "Search", keywords: ["regex","regular expression","test","pattern"], tags: ["developer","regex","pattern"], relatedSlugs: ["json-formatter","base64","jwt-decoder","hash-generator"], component: "tools/RegexTester", popular: true, popularity: 82, isNew: true, addedAt: "2025-06-01" },
  { slug: "csv-to-json", nameKey: n("csv-to-json"), descKey: d("csv-to-json"), seoTitleKey: st("csv-to-json"), seoDescKey: sd("csv-to-json"), category: "dev", icon: "FileDiff", keywords: ["csv","json","convert","data"], tags: ["developer","csv","json","convert"], relatedSlugs: ["json-formatter","base64","html-encoder","url-encoder"], component: "tools/CsvToJson", popularity: 68, addedAt: "2025-06-03" },
  { slug: "json-to-csv", nameKey: n("json-to-csv"), descKey: d("json-to-csv"), seoTitleKey: st("json-to-csv"), seoDescKey: sd("json-to-csv"), category: "dev", icon: "FileDiff", keywords: ["json","csv","convert","data"], tags: ["developer","json","csv","convert"], relatedSlugs: ["csv-to-json","json-formatter","base64","regex-tester"], component: "tools/JsonToCsv", popularity: 64, addedAt: "2025-06-05" },
  { slug: "sql-formatter", nameKey: n("sql-formatter"), descKey: d("sql-formatter"), seoTitleKey: st("sql-formatter"), seoDescKey: sd("sql-formatter"), category: "dev", icon: "FileCode2", keywords: ["sql","format","beautify","query"], tags: ["developer","sql","format"], relatedSlugs: ["json-formatter","regex-tester","base64","hash-generator"], component: "tools/SqlFormatter", popularity: 57, addedAt: "2025-06-07" },
  { slug: "crontab-generator", nameKey: n("crontab-generator"), descKey: d("crontab-generator"), seoTitleKey: st("crontab-generator"), seoDescKey: sd("crontab-generator"), category: "dev", icon: "CalendarClock", keywords: ["cron","crontab","schedule","time"], tags: ["developer","cron","schedule"], relatedSlugs: ["regex-tester","json-formatter","sql-formatter","uuid-generator"], component: "tools/CrontabGenerator", popularity: 53, addedAt: "2025-06-09" },
  { slug: "http-status-codes", nameKey: n("http-status-codes"), descKey: d("http-status-codes"), seoTitleKey: st("http-status-codes"), seoDescKey: sd("http-status-codes"), category: "dev", icon: "Globe", keywords: ["http","status","codes","response"], tags: ["developer","http","reference"], relatedSlugs: ["regex-tester","json-formatter","jwt-decoder","url-encoder"], component: "tools/HttpStatusCodes", popularity: 49, addedAt: "2025-06-11" },

  // ═══════════════════════════════════════════════════════════
  //  SEO TOOLS (8)
  // ═══════════════════════════════════════════════════════════
  { slug: "meta-tag-generator", nameKey: n("meta-tag-generator"), descKey: d("meta-tag-generator"), seoTitleKey: st("meta-tag-generator"), seoDescKey: sd("meta-tag-generator"), category: "seo", icon: "FileCode", keywords: ["meta","tags","seo","open graph","twitter cards"], tags: ["seo","meta","html"], relatedSlugs: ["og-preview","keyword-density","robots-generator","sitemap-generator"], component: "tools/MetaTagGenerator", featured: true, popular: true, popularity: 86, addedAt: "2025-03-01" },
  { slug: "keyword-density", nameKey: n("keyword-density"), descKey: d("keyword-density"), seoTitleKey: st("keyword-density"), seoDescKey: sd("keyword-density"), category: "seo", icon: "Search", keywords: ["keyword","density","seo","content","analysis"], tags: ["seo","keyword","content"], relatedSlugs: ["meta-tag-generator","og-preview","robots-generator","sitemap-generator"], component: "tools/KeywordDensity", popularity: 74, addedAt: "2025-03-05" },
  { slug: "robots-generator", nameKey: n("robots-generator"), descKey: d("robots-generator"), seoTitleKey: st("robots-generator"), seoDescKey: sd("robots-generator"), category: "seo", icon: "FileText", keywords: ["robots","txt","seo","crawl","spider"], tags: ["seo","robots","crawl"], relatedSlugs: ["sitemap-generator","meta-tag-generator","keyword-density","og-preview"], component: "tools/RobotsGenerator", popularity: 62, addedAt: "2025-03-08" },
  { slug: "sitemap-generator", nameKey: n("sitemap-generator"), descKey: d("sitemap-generator"), seoTitleKey: st("sitemap-generator"), seoDescKey: sd("sitemap-generator"), category: "seo", icon: "Globe", keywords: ["sitemap","xml","seo","urls"], tags: ["seo","sitemap","xml"], relatedSlugs: ["robots-generator","meta-tag-generator","keyword-density","og-preview"], component: "tools/SitemapGenerator", popularity: 70, addedAt: "2025-03-10" },
  { slug: "og-preview", nameKey: n("og-preview"), descKey: d("og-preview"), seoTitleKey: st("og-preview"), seoDescKey: sd("og-preview"), category: "seo", icon: "Eye", keywords: ["open graph","preview","social","card","og"], tags: ["seo","open graph","social"], relatedSlugs: ["meta-tag-generator","keyword-density","robots-generator","sitemap-generator"], component: "tools/OgPreview", featured: true, trending: true, popular: true, popularity: 81, addedAt: "2025-03-12" },
  { slug: "serp-preview", nameKey: n("serp-preview"), descKey: d("serp-preview"), seoTitleKey: st("serp-preview"), seoDescKey: sd("serp-preview"), category: "seo", icon: "Search", keywords: ["serp","google","preview","snippet","title"], tags: ["seo","serp","google"], relatedSlugs: ["og-preview","meta-tag-generator","keyword-density","sitemap-generator"], component: "tools/SerpPreview", popularity: 72, isNew: true, addedAt: "2025-06-01" },
  { slug: "url-redirect-checker", nameKey: n("url-redirect-checker"), descKey: d("url-redirect-checker"), seoTitleKey: st("url-redirect-checker"), seoDescKey: sd("url-redirect-checker"), category: "seo", icon: "ExternalLink", keywords: ["url","redirect","checker","seo","link"], tags: ["seo","url","redirect"], relatedSlugs: ["serp-preview","og-preview","meta-tag-generator","robots-generator"], component: "tools/GenericTool", popularity: 46, addedAt: "2025-06-03" },
  { slug: "slug-generator", nameKey: n("slug-generator"), descKey: d("slug-generator"), seoTitleKey: st("slug-generator"), seoDescKey: sd("slug-generator"), category: "seo", icon: "Link", keywords: ["slug","url","seo","friendly"], tags: ["seo","slug","url"], relatedSlugs: ["meta-tag-generator","serp-preview","robots-generator","sitemap-generator"], component: "tools/SlugGenerator", popularity: 51, addedAt: "2025-06-05" },

  // ═══════════════════════════════════════════════════════════
  //  AI TOOLS (6)
  // ═══════════════════════════════════════════════════════════
  { slug: "ai-text-summarizer", nameKey: n("ai-text-summarizer"), descKey: d("ai-text-summarizer"), seoTitleKey: st("ai-text-summarizer"), seoDescKey: sd("ai-text-summarizer"), category: "ai", icon: "Wand2", keywords: ["ai","text","summarize","summary"], tags: ["ai","text","summary"], relatedSlugs: ["ai-grammar-checker","ai-content-rewriter","ai-code-explainer","word-counter"], component: "tools/GenericTool", featured: true, trending: true, popular: true, popularity: 93, addedAt: "2025-03-01" },
  { slug: "ai-grammar-checker", nameKey: n("ai-grammar-checker"), descKey: d("ai-grammar-checker"), seoTitleKey: st("ai-grammar-checker"), seoDescKey: sd("ai-grammar-checker"), category: "ai", icon: "ScanLine", keywords: ["ai","grammar","check","spelling","correct"], tags: ["ai","grammar","spelling"], relatedSlugs: ["ai-text-summarizer","ai-content-rewriter","ai-code-explainer","word-counter"], component: "tools/GenericTool", popular: true, popularity: 82, addedAt: "2025-03-03" },
  { slug: "ai-code-explainer", nameKey: n("ai-code-explainer"), descKey: d("ai-code-explainer"), seoTitleKey: st("ai-code-explainer"), seoDescKey: sd("ai-code-explainer"), category: "ai", icon: "Code2", keywords: ["ai","code","explain","document"], tags: ["ai","code","explain"], relatedSlugs: ["ai-text-summarizer","ai-grammar-checker","ai-content-rewriter","json-formatter"], component: "tools/GenericTool", trending: true, popular: true, popularity: 78, addedAt: "2025-03-05" },
  { slug: "ai-content-rewriter", nameKey: n("ai-content-rewriter"), descKey: d("ai-content-rewriter"), seoTitleKey: st("ai-content-rewriter"), seoDescKey: sd("ai-content-rewriter"), category: "ai", icon: "Wand2", keywords: ["ai","rewrite","rephrase","paraphrase"], tags: ["ai","rewrite","paraphrase"], relatedSlugs: ["ai-grammar-checker","ai-text-summarizer","ai-code-explainer","word-counter"], component: "tools/GenericTool", popular: true, popularity: 85, addedAt: "2025-03-07" },
  { slug: "ai-headline-generator", nameKey: n("ai-headline-generator"), descKey: d("ai-headline-generator"), seoTitleKey: st("ai-headline-generator"), seoDescKey: sd("ai-headline-generator"), category: "ai", icon: "PenLine", keywords: ["ai","headline","title","generate","content"], tags: ["ai","headline","title"], relatedSlugs: ["ai-content-rewriter","ai-text-summarizer","ai-grammar-checker","bio-generator"], component: "tools/GenericTool", popularity: 67, isNew: true, addedAt: "2025-06-01" },
  { slug: "ai-idea-generator", nameKey: n("ai-idea-generator"), descKey: d("ai-idea-generator"), seoTitleKey: st("ai-idea-generator"), seoDescKey: sd("ai-idea-generator"), category: "ai", icon: "Lightbulb", keywords: ["ai","idea","brainstorm","generate","creative"], tags: ["ai","idea","creative"], relatedSlugs: ["ai-headline-generator","ai-content-rewriter","ai-text-summarizer","ai-grammar-checker"], component: "tools/GenericTool", popularity: 59, isNew: true, addedAt: "2025-06-03" },

  // ═══════════════════════════════════════════════════════════
  //  FINANCE TOOLS (8)
  // ═══════════════════════════════════════════════════════════
  { slug: "percentage-calculator", nameKey: n("percentage-calculator"), descKey: d("percentage-calculator"), seoTitleKey: st("percentage-calculator"), seoDescKey: sd("percentage-calculator"), category: "finance", icon: "Percent", keywords: ["percentage","percent","increase","decrease","of"], tags: ["finance","percentage","calculator"], relatedSlugs: ["loan-calculator","currency-converter","compound-interest","tax-calculator"], component: "tools/PercentageCalculator", implemented: true, popular: true, popularity: 84, addedAt: "2025-01-18" },
  { slug: "average-calculator", nameKey: n("average-calculator"), descKey: d("average-calculator"), seoTitleKey: st("average-calculator"), seoDescKey: sd("average-calculator"), category: "finance", icon: "Sigma", keywords: ["average","mean","median","sum","statistics"], tags: ["finance","average","statistics"], relatedSlugs: ["percentage-calculator","loan-calculator","compound-interest","tax-calculator"], component: "tools/AverageCalculator", implemented: true, popularity: 60, addedAt: "2025-02-18" },
  { slug: "loan-calculator", nameKey: n("loan-calculator"), descKey: d("loan-calculator"), seoTitleKey: st("loan-calculator"), seoDescKey: sd("loan-calculator"), category: "finance", icon: "DollarSign", keywords: ["loan","mortgage","payment","interest","amortization"], tags: ["finance","loan","mortgage"], relatedSlugs: ["compound-interest","percentage-calculator","currency-converter","tax-calculator"], component: "tools/LoanCalculator", featured: true, trending: true, popular: true, popularity: 91, addedAt: "2025-03-01" },
  { slug: "currency-converter", nameKey: n("currency-converter"), descKey: d("currency-converter"), seoTitleKey: st("currency-converter"), seoDescKey: sd("currency-converter"), category: "finance", icon: "TrendingUp", keywords: ["currency","exchange","rate","convert","money"], tags: ["finance","currency","exchange"], relatedSlugs: ["loan-calculator","percentage-calculator","compound-interest","tax-calculator"], component: "tools/GenericTool", featured: true, popular: true, popularity: 89, addedAt: "2025-03-03" },
  { slug: "compound-interest", nameKey: n("compound-interest"), descKey: d("compound-interest"), seoTitleKey: st("compound-interest"), seoDescKey: sd("compound-interest"), category: "finance", icon: "PiggyBank", keywords: ["compound","interest","savings","investment","growth"], tags: ["finance","interest","investment"], relatedSlugs: ["loan-calculator","percentage-calculator","currency-converter","tax-calculator"], component: "tools/CompoundInterest", popular: true, popularity: 77, addedAt: "2025-03-05" },
  { slug: "tax-calculator", nameKey: n("tax-calculator"), descKey: d("tax-calculator"), seoTitleKey: st("tax-calculator"), seoDescKey: sd("tax-calculator"), category: "finance", icon: "Receipt", keywords: ["tax","vat","sales tax","calculator"], tags: ["finance","tax","vat"], relatedSlugs: ["loan-calculator","currency-converter","compound-interest","percentage-calculator"], component: "tools/TaxCalculator", popularity: 73, addedAt: "2025-03-07" },
  { slug: "discount-calculator", nameKey: n("discount-calculator"), descKey: d("discount-calculator"), seoTitleKey: st("discount-calculator"), seoDescKey: sd("discount-calculator"), category: "finance", icon: "TicketPercent", keywords: ["discount","sale","price","off","percentage"], tags: ["finance","discount","shopping"], relatedSlugs: ["percentage-calculator","tax-calculator","loan-calculator","currency-converter"], component: "tools/DiscountCalculator", popularity: 66, isNew: true, addedAt: "2025-06-01" },
  { slug: "salary-converter", nameKey: n("salary-converter"), descKey: d("salary-converter"), seoTitleKey: st("salary-converter"), seoDescKey: sd("salary-converter"), category: "finance", icon: "Banknote", keywords: ["salary","hourly","annual","convert","wage"], tags: ["finance","salary","wage"], relatedSlugs: ["tax-calculator","percentage-calculator","loan-calculator","compound-interest"], component: "tools/SalaryConverter", popularity: 54, addedAt: "2025-06-03" },

  // ═══════════════════════════════════════════════════════════
  //  HEALTH TOOLS (6)
  // ═══════════════════════════════════════════════════════════
  { slug: "bmi-calculator", nameKey: n("bmi-calculator"), descKey: d("bmi-calculator"), seoTitleKey: st("bmi-calculator"), seoDescKey: sd("bmi-calculator"), category: "health", icon: "HeartPulse", keywords: ["bmi","body mass","weight","health","fitness"], tags: ["health","bmi","weight"], relatedSlugs: ["calorie-calculator","water-intake","heart-rate-calculator","percentage-calculator"], component: "tools/BmiCalculator", featured: true, trending: true, popular: true, popularity: 90, addedAt: "2025-03-01" },
  { slug: "calorie-calculator", nameKey: n("calorie-calculator"), descKey: d("calorie-calculator"), seoTitleKey: st("calorie-calculator"), seoDescKey: sd("calorie-calculator"), category: "health", icon: "Activity", keywords: ["calorie","tdee","bmr","nutrition","diet"], tags: ["health","calorie","nutrition"], relatedSlugs: ["bmi-calculator","water-intake","heart-rate-calculator","percentage-calculator"], component: "tools/CalorieCalculator", popular: true, popularity: 83, addedAt: "2025-03-03" },
  { slug: "water-intake", nameKey: n("water-intake"), descKey: d("water-intake"), seoTitleKey: st("water-intake"), seoDescKey: sd("water-intake"), category: "health", icon: "Droplet", keywords: ["water","intake","hydration","health"], tags: ["health","water","hydration"], relatedSlugs: ["bmi-calculator","calorie-calculator","heart-rate-calculator","percentage-calculator"], component: "tools/WaterIntake", popularity: 64, addedAt: "2025-03-05" },
  { slug: "heart-rate-calculator", nameKey: n("heart-rate-calculator"), descKey: d("heart-rate-calculator"), seoTitleKey: st("heart-rate-calculator"), seoDescKey: sd("heart-rate-calculator"), category: "health", icon: "HeartPulse", keywords: ["heart","rate","pulse","target zone","fitness"], tags: ["health","heart","fitness"], relatedSlugs: ["bmi-calculator","calorie-calculator","water-intake","percentage-calculator"], component: "tools/HeartRateCalculator", popularity: 67, addedAt: "2025-03-07" },
  { slug: "pregnancy-calculator", nameKey: n("pregnancy-calculator"), descKey: d("pregnancy-calculator"), seoTitleKey: st("pregnancy-calculator"), seoDescKey: sd("pregnancy-calculator"), category: "health", icon: "CalendarDays", keywords: ["pregnancy","due date","weeks","calculator"], tags: ["health","pregnancy","calendar"], relatedSlugs: ["bmi-calculator","calorie-calculator","heart-rate-calculator","water-intake"], component: "tools/PregnancyCalculator", popularity: 56, isNew: true, addedAt: "2025-06-01" },
  { slug: "ideal-weight", nameKey: n("ideal-weight"), descKey: d("ideal-weight"), seoTitleKey: st("ideal-weight"), seoDescKey: sd("ideal-weight"), category: "health", icon: "Scale", keywords: ["ideal weight","healthy","bmi","calculator"], tags: ["health","weight","fitness"], relatedSlugs: ["bmi-calculator","calorie-calculator","water-intake","heart-rate-calculator"], component: "tools/IdealWeight", popularity: 48, addedAt: "2025-06-03" },

  // ═══════════════════════════════════════════════════════════
  //  CONVERTERS (8)
  // ═══════════════════════════════════════════════════════════
  { slug: "unit-converter", nameKey: n("unit-converter"), descKey: d("unit-converter"), seoTitleKey: st("unit-converter"), seoDescKey: sd("unit-converter"), category: "converters", icon: "Ruler", keywords: ["length","weight","temperature","metric","imperial"], tags: ["converter","unit","measurement"], relatedSlugs: ["temperature-converter","time-converter","number-base-converter","color-converter"], component: "tools/UnitConverterFull", implemented: true, featured: true, popular: true, popularity: 88, addedAt: "2025-01-15" },
  { slug: "number-base-converter", nameKey: n("number-base-converter"), descKey: d("number-base-converter"), seoTitleKey: st("number-base-converter"), seoDescKey: sd("number-base-converter"), category: "converters", icon: "Hash", keywords: ["binary","decimal","hex","octal","radix"], tags: ["converter","number","base"], relatedSlugs: ["unit-converter","color-converter","temperature-converter","time-converter"], component: "tools/NumberBaseConverter", implemented: true, trending: true, popular: true, popularity: 75, addedAt: "2025-01-20" },
  { slug: "color-converter", nameKey: n("color-converter"), descKey: d("color-converter"), seoTitleKey: st("color-converter"), seoDescKey: sd("color-converter"), category: "converters", icon: "Palette", keywords: ["hex","rgb","hsl","color","css"], tags: ["converter","color","css"], relatedSlugs: ["unit-converter","number-base-converter","temperature-converter","time-converter"], component: "tools/ColorConverter", implemented: true, featured: true, popular: true, popularity: 85, addedAt: "2025-02-05" },
  { slug: "temperature-converter", nameKey: n("temperature-converter"), descKey: d("temperature-converter"), seoTitleKey: st("temperature-converter"), seoDescKey: sd("temperature-converter"), category: "converters", icon: "Thermometer", keywords: ["temperature","celsius","fahrenheit","kelvin","convert"], tags: ["converter","temperature"], relatedSlugs: ["unit-converter","number-base-converter","color-converter","time-converter"], component: "tools/TemperatureConverter", popularity: 71, addedAt: "2025-03-01" },
  { slug: "time-converter", nameKey: n("time-converter"), descKey: d("time-converter"), seoTitleKey: st("time-converter"), seoDescKey: sd("time-converter"), category: "converters", icon: "Timer", keywords: ["time","timezone","convert","hours","minutes"], tags: ["converter","time","timezone"], relatedSlugs: ["unit-converter","temperature-converter","number-base-converter","color-converter"], component: "tools/TimeConverter", popularity: 66, addedAt: "2025-03-03" },
  { slug: "data-storage-converter", nameKey: n("data-storage-converter"), descKey: d("data-storage-converter"), seoTitleKey: st("data-storage-converter"), seoDescKey: sd("data-storage-converter"), category: "converters", icon: "HardDrive", keywords: ["data","storage","bytes","kb","mb","gb","convert"], tags: ["converter","data","storage"], relatedSlugs: ["unit-converter","time-converter","number-base-converter","color-converter"], component: "tools/DataStorageConverter", popularity: 63, addedAt: "2025-06-01" },
  { slug: "angle-converter", nameKey: n("angle-converter"), descKey: d("angle-converter"), seoTitleKey: st("angle-converter"), seoDescKey: sd("angle-converter"), category: "converters", icon: "Compass", keywords: ["angle","degree","radian","convert"], tags: ["converter","angle","math"], relatedSlugs: ["unit-converter","number-base-converter","temperature-converter","time-converter"], component: "tools/AngleConverter", popularity: 39, addedAt: "2025-06-03" },
  { slug: "frequency-converter", nameKey: n("frequency-converter"), descKey: d("frequency-converter"), seoTitleKey: st("frequency-converter"), seoDescKey: sd("frequency-converter"), category: "converters", icon: "Waves", keywords: ["frequency","hertz","convert","audio"], tags: ["converter","frequency","audio"], relatedSlugs: ["unit-converter","time-converter","data-storage-converter","angle-converter"], component: "tools/FrequencyConverter", popularity: 36, addedAt: "2025-06-05" },

  // ═══════════════════════════════════════════════════════════
  //  UTILITIES (8)
  // ═══════════════════════════════════════════════════════════
  { slug: "qr-code-generator", nameKey: n("qr-code-generator"), descKey: d("qr-code-generator"), seoTitleKey: st("qr-code-generator"), seoDescKey: sd("qr-code-generator"), category: "utilities", icon: "QrCode", keywords: ["qr","code","barcode","generator"], tags: ["utility","qr","barcode"], relatedSlugs: ["password-generator","uuid-generator","random-generator","countdown-timer"], component: "tools/QrCodeGenerator", implemented: true, featured: true, popular: true, popularity: 89, addedAt: "2025-02-08" },
  { slug: "random-generator", nameKey: n("random-generator"), descKey: d("random-generator"), seoTitleKey: st("random-generator"), seoDescKey: sd("random-generator"), category: "utilities", icon: "Shuffle", keywords: ["random","number","generator","pick","lottery"], tags: ["utility","random","generator"], relatedSlugs: ["qr-code-generator","uuid-generator","password-generator","countdown-timer"], component: "tools/RandomGenerator", popularity: 58, addedAt: "2025-03-03" },
  { slug: "countdown-timer", nameKey: n("countdown-timer"), descKey: d("countdown-timer"), seoTitleKey: st("countdown-timer"), seoDescKey: sd("countdown-timer"), category: "utilities", icon: "Timer", keywords: ["timer","countdown","stopwatch","time"], tags: ["utility","timer","countdown"], relatedSlugs: ["qr-code-generator","random-generator","uuid-generator","password-generator"], component: "tools/CountdownTimer", popularity: 54, addedAt: "2025-03-05" },
  { slug: "stopwatch", nameKey: n("stopwatch"), descKey: d("stopwatch"), seoTitleKey: st("stopwatch"), seoDescKey: sd("stopwatch"), category: "utilities", icon: "Stopwatch", keywords: ["stopwatch","timer","time","track"], tags: ["utility","stopwatch","time"], relatedSlugs: ["countdown-timer","qr-code-generator","random-generator","uuid-generator"], component: "tools/Stopwatch", popularity: 50, addedAt: "2025-06-01" },
  { slug: "world-clock", nameKey: n("world-clock"), descKey: d("world-clock"), seoTitleKey: st("world-clock"), seoDescKey: sd("world-clock"), category: "utilities", icon: "Globe", keywords: ["world","clock","time","timezone"], tags: ["utility","clock","timezone"], relatedSlugs: ["countdown-timer","stopwatch","qr-code-generator","random-generator"], component: "tools/WorldClock", popularity: 47, addedAt: "2025-06-03" },
  { slug: "pomodoro-timer", nameKey: n("pomodoro-timer"), descKey: d("pomodoro-timer"), seoTitleKey: st("pomodoro-timer"), seoDescKey: sd("pomodoro-timer"), category: "utilities", icon: "AlarmClock", keywords: ["pomodoro","timer","productivity","focus"], tags: ["utility","pomodoro","productivity"], relatedSlugs: ["countdown-timer","stopwatch","world-clock","qr-code-generator"], component: "tools/PomodoroTimer", popularity: 61, isNew: true, trending: true, addedAt: "2025-06-05" },
  { slug: "dice-roller", nameKey: n("dice-roller"), descKey: d("dice-roller"), seoTitleKey: st("dice-roller"), seoDescKey: sd("dice-roller"), category: "utilities", icon: "Gamepad2", keywords: ["dice","roll","random","game","dnd"], tags: ["utility","dice","game"], relatedSlugs: ["random-generator","qr-code-generator","uuid-generator","countdown-timer"], component: "tools/DiceRoller", popularity: 42, addedAt: "2025-06-07" },
  { slug: "color-picker", nameKey: n("color-picker"), descKey: d("color-picker"), seoTitleKey: st("color-picker"), seoDescKey: sd("color-picker"), category: "utilities", icon: "Pipette", keywords: ["color","picker","hex","rgb","choose"], tags: ["utility","color","picker"], relatedSlugs: ["color-converter","qr-code-generator","random-generator","uuid-generator"], component: "tools/ColorPicker", popularity: 57, addedAt: "2025-06-09" },

  // ═══════════════════════════════════════════════════════════
  //  SECURITY TOOLS (8)
  // ═══════════════════════════════════════════════════════════
  { slug: "password-generator", nameKey: n("password-generator"), descKey: d("password-generator"), seoTitleKey: st("password-generator"), seoDescKey: sd("password-generator"), category: "security", icon: "KeyRound", keywords: ["password","random","secure","generator"], tags: ["security","password","generator"], relatedSlugs: ["password-strength","uuid-generator","hash-generator","qr-code-generator"], component: "tools/PasswordGenerator", implemented: true, featured: true, trending: true, popular: true, popularity: 96, addedAt: "2025-01-05" },
  { slug: "uuid-generator", nameKey: n("uuid-generator"), descKey: d("uuid-generator"), seoTitleKey: st("uuid-generator"), seoDescKey: sd("uuid-generator"), category: "security", icon: "Fingerprint", keywords: ["uuid","guid","v4","random","id"], tags: ["security","uuid","generator"], relatedSlugs: ["password-generator","password-strength","hash-generator","qr-code-generator"], component: "tools/UuidGenerator", implemented: true, popular: true, popularity: 82, addedAt: "2025-01-25" },
  { slug: "password-strength", nameKey: n("password-strength"), descKey: d("password-strength"), seoTitleKey: st("password-strength"), seoDescKey: sd("password-strength"), category: "security", icon: "ShieldCheck", keywords: ["password","strength","check","secure","entropy"], tags: ["security","password","check"], relatedSlugs: ["password-generator","uuid-generator","hash-generator","jwt-decoder"], component: "tools/PasswordStrength", popular: true, popularity: 72, addedAt: "2025-03-01" },
  { slug: "encryption-tool", nameKey: n("encryption-tool"), descKey: d("encryption-tool"), seoTitleKey: st("encryption-tool"), seoDescKey: sd("encryption-tool"), category: "security", icon: "Lock", keywords: ["encrypt","decrypt","aes","cipher","secure"], tags: ["security","encrypt","cipher"], relatedSlugs: ["password-generator","password-strength","hash-generator","base64"], component: "tools/EncryptionTool", popularity: 63, isNew: true, addedAt: "2025-06-01" },
  { slug: "ssl-checker", nameKey: n("ssl-checker"), descKey: d("ssl-checker"), seoTitleKey: st("ssl-checker"), seoDescKey: sd("ssl-checker"), category: "security", icon: "Shield", keywords: ["ssl","tls","certificate","https","security"], tags: ["security","ssl","certificate"], relatedSlugs: ["password-strength","encryption-tool","hash-generator","jwt-decoder"], component: "tools/GenericTool", popularity: 55, addedAt: "2025-06-03" },
  { slug: "data-breach-checker", nameKey: n("data-breach-checker"), descKey: d("data-breach-checker"), seoTitleKey: st("data-breach-checker"), seoDescKey: sd("data-breach-checker"), category: "security", icon: "EyeOff", keywords: ["data breach","leak","email","password","check"], tags: ["security","breach","privacy"], relatedSlugs: ["password-strength","ssl-checker","password-generator","encryption-tool"], component: "tools/GenericTool", popularity: 69, addedAt: "2025-06-05" },
  { slug: "mac-address-lookup", nameKey: n("mac-address-lookup"), descKey: d("mac-address-lookup"), seoTitleKey: st("mac-address-lookup"), seoDescKey: sd("mac-address-lookup"), category: "security", icon: "Search", keywords: ["mac","address","lookup","vendor","network"], tags: ["security","mac","network"], relatedSlugs: ["ssl-checker","password-strength","uuid-generator","hash-generator"], component: "tools/GenericTool", popularity: 38, addedAt: "2025-06-07" },
  { slug: "ip-address-lookup", nameKey: n("ip-address-lookup"), descKey: d("ip-address-lookup"), seoTitleKey: st("ip-address-lookup"), seoDescKey: sd("ip-address-lookup"), category: "security", icon: "Globe", keywords: ["ip","address","lookup","geolocation","network"], tags: ["security","ip","network"], relatedSlugs: ["mac-address-lookup","ssl-checker","data-breach-checker","password-strength"], component: "tools/GenericTool", popularity: 60, isNew: true, addedAt: "2025-06-09" },

  // ═══════════════════════════════════════════════════════════
  //  SOCIAL MEDIA TOOLS (8)
  // ═══════════════════════════════════════════════════════════
  { slug: "twitter-counter", nameKey: n("twitter-counter"), descKey: d("twitter-counter"), seoTitleKey: st("twitter-counter"), seoDescKey: sd("twitter-counter"), category: "social", icon: "MessageSquare", keywords: ["twitter","x","character","limit","280"], tags: ["social","twitter","character"], relatedSlugs: ["hashtag-generator","username-generator","social-image-resizer","bio-generator"], component: "tools/TwitterCounter", popularity: 69, addedAt: "2025-03-01" },
  { slug: "hashtag-generator", nameKey: n("hashtag-generator"), descKey: d("hashtag-generator"), seoTitleKey: st("hashtag-generator"), seoDescKey: sd("hashtag-generator"), category: "social", icon: "Hash", keywords: ["hashtag","instagram","social","tags","trending"], tags: ["social","hashtag","instagram"], relatedSlugs: ["username-generator","twitter-counter","social-image-resizer","bio-generator"], component: "tools/HashtagGenerator", featured: true, trending: true, popular: true, popularity: 87, addedAt: "2025-03-03" },
  { slug: "social-image-resizer", nameKey: n("social-image-resizer"), descKey: d("social-image-resizer"), seoTitleKey: st("social-image-resizer"), seoDescKey: sd("social-image-resizer"), category: "social", icon: "Crop", keywords: ["social","image","resize","facebook","instagram","twitter"], tags: ["social","image","resize"], relatedSlugs: ["image-resizer","twitter-counter","hashtag-generator","bio-generator"], component: "tools/SocialImageResizer", popularity: 75, addedAt: "2025-03-05" },
  { slug: "username-generator", nameKey: n("username-generator"), descKey: d("username-generator"), seoTitleKey: st("username-generator"), seoDescKey: sd("username-generator"), category: "social", icon: "AtSign", keywords: ["username","handle","generator","social","unique"], tags: ["social","username","generator"], relatedSlugs: ["hashtag-generator","twitter-counter","social-image-resizer","bio-generator"], component: "tools/UsernameGenerator", popular: true, popularity: 80, addedAt: "2025-03-07" },
  { slug: "bio-generator", nameKey: n("bio-generator"), descKey: d("bio-generator"), seoTitleKey: st("bio-generator"), seoDescKey: sd("bio-generator"), category: "social", icon: "FileText", keywords: ["bio","profile","social","instagram","twitter"], tags: ["social","bio","profile"], relatedSlugs: ["hashtag-generator","username-generator","twitter-counter","social-image-resizer"], component: "tools/GenericTool", popularity: 68, addedAt: "2025-03-09" },
  { slug: "youtube-thumbnail-downloader", nameKey: n("youtube-thumbnail-downloader"), descKey: d("youtube-thumbnail-downloader"), seoTitleKey: st("youtube-thumbnail-downloader"), seoDescKey: sd("youtube-thumbnail-downloader"), category: "social", icon: "Download", keywords: ["youtube","thumbnail","download","video"], tags: ["social","youtube","download"], relatedSlugs: ["social-image-resizer","twitter-counter","hashtag-generator","username-generator"], component: "tools/YtThumbnailDownloader", popularity: 74, isNew: true, addedAt: "2025-06-01" },
  { slug: "instagram-font-generator", nameKey: n("instagram-font-generator"), descKey: d("instagram-font-generator"), seoTitleKey: st("instagram-font-generator"), seoDescKey: sd("instagram-font-generator"), category: "social", icon: "Type", keywords: ["instagram","font","fancy","text","style"], tags: ["social","instagram","font"], relatedSlugs: ["hashtag-generator","bio-generator","username-generator","twitter-counter"], component: "tools/FontGenerator", popularity: 65, isNew: true, addedAt: "2025-06-03" },
  { slug: "social-media-counter", nameKey: n("social-media-counter"), descKey: d("social-media-counter"), seoTitleKey: st("social-media-counter"), seoDescKey: sd("social-media-counter"), category: "social", icon: "BarChart3", keywords: ["social","media","counter","followers","stats"], tags: ["social","stats","counter"], relatedSlugs: ["twitter-counter","hashtag-generator","username-generator","bio-generator"], component: "tools/GenericTool", popularity: 43, addedAt: "2025-06-05" },

  // ═══════════════════════════════════════════════════════════
  //  CREATOR TOOLS — YouTube (13)
  // ═══════════════════════════════════════════════════════════
  { slug: "yt-thumbnail-downloader", nameKey: n("yt-thumbnail-downloader"), descKey: d("yt-thumbnail-downloader"), seoTitleKey: st("yt-thumbnail-downloader"), seoDescKey: sd("yt-thumbnail-downloader"), category: "creator", icon: "Download", keywords: ["youtube","thumbnail","download","video","image"], tags: ["creator","youtube","thumbnail"], relatedSlugs: ["yt-thumbnail-viewer","yt-thumbnail-url","yt-video-id","yt-thumbnail-size-guide"], component: "tools/YtThumbnailDownloader", implemented: true, featured: true, trending: true, popular: true, popularity: 92, addedAt: "2025-07-01" },
  { slug: "yt-thumbnail-viewer", nameKey: n("yt-thumbnail-viewer"), descKey: d("yt-thumbnail-viewer"), seoTitleKey: st("yt-thumbnail-viewer"), seoDescKey: sd("yt-thumbnail-viewer"), category: "creator", icon: "Eye", keywords: ["youtube","thumbnail","viewer","preview","video"], tags: ["creator","youtube","thumbnail"], relatedSlugs: ["yt-thumbnail-downloader","yt-thumbnail-url","yt-video-id","yt-channel-id"], component: "tools/YtThumbnailViewer", implemented: true, popularity: 78, addedAt: "2025-07-02" },
  { slug: "yt-thumbnail-url", nameKey: n("yt-thumbnail-url"), descKey: d("yt-thumbnail-url"), seoTitleKey: st("yt-thumbnail-url"), seoDescKey: sd("yt-thumbnail-url"), category: "creator", icon: "Link", keywords: ["youtube","thumbnail","url","extractor","video"], tags: ["creator","youtube","thumbnail"], relatedSlugs: ["yt-thumbnail-downloader","yt-thumbnail-viewer","yt-video-id","yt-channel-id"], component: "tools/YtThumbnailUrl", implemented: true, popularity: 70, addedAt: "2025-07-03" },
  { slug: "yt-channel-id", nameKey: n("yt-channel-id"), descKey: d("yt-channel-id"), seoTitleKey: st("yt-channel-id"), seoDescKey: sd("yt-channel-id"), category: "creator", icon: "Search", keywords: ["youtube","channel","id","finder","url"], tags: ["creator","youtube","channel"], relatedSlugs: ["yt-playlist-id","yt-video-id","yt-thumbnail-downloader","yt-thumbnail-viewer"], component: "tools/YtChannelId", implemented: true, popularity: 75, addedAt: "2025-07-04" },
  { slug: "yt-playlist-id", nameKey: n("yt-playlist-id"), descKey: d("yt-playlist-id"), seoTitleKey: st("yt-playlist-id"), seoDescKey: sd("yt-playlist-id"), category: "creator", icon: "ListChecks", keywords: ["youtube","playlist","id","finder","url"], tags: ["creator","youtube","playlist"], relatedSlugs: ["yt-channel-id","yt-video-id","yt-thumbnail-downloader","yt-thumbnail-viewer"], component: "tools/YtPlaylistId", implemented: true, popularity: 68, addedAt: "2025-07-05" },
  { slug: "yt-video-id", nameKey: n("yt-video-id"), descKey: d("yt-video-id"), seoTitleKey: st("yt-video-id"), seoDescKey: sd("yt-video-id"), category: "creator", icon: "Video", keywords: ["youtube","video","id","extractor","url"], tags: ["creator","youtube","video"], relatedSlugs: ["yt-thumbnail-downloader","yt-channel-id","yt-playlist-id","yt-thumbnail-url"], component: "tools/YtVideoId", implemented: true, popularity: 82, addedAt: "2025-07-06" },
  { slug: "yt-thumbnail-size-guide", nameKey: n("yt-thumbnail-size-guide"), descKey: d("yt-thumbnail-size-guide"), seoTitleKey: st("yt-thumbnail-size-guide"), seoDescKey: sd("yt-thumbnail-size-guide"), category: "creator", icon: "Ruler", keywords: ["youtube","thumbnail","size","guide","dimensions"], tags: ["creator","youtube","guide"], relatedSlugs: ["social-image-size-guide","yt-thumbnail-downloader","yt-thumbnail-viewer","emoji-picker"], component: "tools/YtThumbnailSizeGuide", implemented: true, popularity: 60, addedAt: "2025-07-07" },
  { slug: "yt-title-generator", nameKey: n("yt-title-generator"), descKey: d("yt-title-generator"), seoTitleKey: st("yt-title-generator"), seoDescKey: sd("yt-title-generator"), category: "creator", icon: "PenLine", keywords: ["youtube","title","generator","video","seo"], tags: ["creator","youtube","ai"], relatedSlugs: ["yt-description-generator","yt-tags-generator","yt-hashtag-generator","yt-video-idea-generator"], component: "tools/GenericTool", premium: true, popularity: 65, isNew: true, addedAt: "2025-07-08" },
  { slug: "yt-description-generator", nameKey: n("yt-description-generator"), descKey: d("yt-description-generator"), seoTitleKey: st("yt-description-generator"), seoDescKey: sd("yt-description-generator"), category: "creator", icon: "FileText", keywords: ["youtube","description","generator","video","seo"], tags: ["creator","youtube","ai"], relatedSlugs: ["yt-title-generator","yt-tags-generator","yt-hashtag-generator","yt-script-generator"], component: "tools/GenericTool", premium: true, popularity: 63, isNew: true, addedAt: "2025-07-09" },
  { slug: "yt-tags-generator", nameKey: n("yt-tags-generator"), descKey: d("yt-tags-generator"), seoTitleKey: st("yt-tags-generator"), seoDescKey: sd("yt-tags-generator"), category: "creator", icon: "Tags", keywords: ["youtube","tags","generator","video","seo"], tags: ["creator","youtube","ai"], relatedSlugs: ["yt-title-generator","yt-description-generator","yt-hashtag-generator","yt-video-idea-generator"], component: "tools/GenericTool", premium: true, popularity: 61, isNew: true, addedAt: "2025-07-10" },
  { slug: "yt-hashtag-generator", nameKey: n("yt-hashtag-generator"), descKey: d("yt-hashtag-generator"), seoTitleKey: st("yt-hashtag-generator"), seoDescKey: sd("yt-hashtag-generator"), category: "creator", icon: "Hash", keywords: ["youtube","hashtag","generator","video","social"], tags: ["creator","youtube","hashtag"], relatedSlugs: ["yt-title-generator","yt-description-generator","yt-tags-generator","tt-hashtag-generator"], component: "tools/HashtagGenerator", popularity: 58, isNew: true, addedAt: "2025-07-11" },
  { slug: "yt-video-idea-generator", nameKey: n("yt-video-idea-generator"), descKey: d("yt-video-idea-generator"), seoTitleKey: st("yt-video-idea-generator"), seoDescKey: sd("yt-video-idea-generator"), category: "creator", icon: "Lightbulb", keywords: ["youtube","video","idea","generator","content"], tags: ["creator","youtube","ai"], relatedSlugs: ["yt-title-generator","yt-script-generator","yt-description-generator","yt-tags-generator"], component: "tools/GenericTool", premium: true, popularity: 57, isNew: true, addedAt: "2025-07-12" },
  { slug: "yt-script-generator", nameKey: n("yt-script-generator"), descKey: d("yt-script-generator"), seoTitleKey: st("yt-script-generator"), seoDescKey: sd("yt-script-generator"), category: "creator", icon: "FileText", keywords: ["youtube","script","generator","video","content"], tags: ["creator","youtube","ai"], relatedSlugs: ["yt-video-idea-generator","yt-title-generator","yt-description-generator","yt-tags-generator"], component: "tools/GenericTool", premium: true, popularity: 55, isNew: true, addedAt: "2025-07-13" },

  // CREATOR TOOLS — TikTok (4)
  { slug: "tt-username-generator", nameKey: n("tt-username-generator"), descKey: d("tt-username-generator"), seoTitleKey: st("tt-username-generator"), seoDescKey: sd("tt-username-generator"), category: "creator", icon: "AtSign", keywords: ["tiktok","username","generator","handle","name"], tags: ["creator","tiktok","username"], relatedSlugs: ["ig-username-generator","tt-hashtag-generator","tt-caption-generator","tt-bio-generator"], component: "tools/SocialUsernameGenerator", implemented: true, popularity: 72, addedAt: "2025-07-14" },
  { slug: "tt-caption-generator", nameKey: n("tt-caption-generator"), descKey: d("tt-caption-generator"), seoTitleKey: st("tt-caption-generator"), seoDescKey: sd("tt-caption-generator"), category: "creator", icon: "PenLine", keywords: ["tiktok","caption","generator","text","social"], tags: ["creator","tiktok","ai"], relatedSlugs: ["tt-hashtag-generator","tt-bio-generator","ig-caption-generator","fb-caption-generator"], component: "tools/GenericTool", premium: true, popularity: 54, isNew: true, addedAt: "2025-07-15" },
  { slug: "tt-hashtag-generator", nameKey: n("tt-hashtag-generator"), descKey: d("tt-hashtag-generator"), seoTitleKey: st("tt-hashtag-generator"), seoDescKey: sd("tt-hashtag-generator"), category: "creator", icon: "Hash", keywords: ["tiktok","hashtag","generator","tags","social"], tags: ["creator","tiktok","hashtag"], relatedSlugs: ["tt-caption-generator","tt-bio-generator","ig-hashtag-generator","yt-hashtag-generator"], component: "tools/HashtagGenerator", popularity: 56, isNew: true, addedAt: "2025-07-16" },
  { slug: "tt-bio-generator", nameKey: n("tt-bio-generator"), descKey: d("tt-bio-generator"), seoTitleKey: st("tt-bio-generator"), seoDescKey: sd("tt-bio-generator"), category: "creator", icon: "FileText", keywords: ["tiktok","bio","generator","profile","social"], tags: ["creator","tiktok","bio"], relatedSlugs: ["tt-caption-generator","tt-hashtag-generator","ig-bio-generator","tt-username-generator"], component: "tools/GenericTool", premium: true, popularity: 50, isNew: true, addedAt: "2025-07-17" },

  // CREATOR TOOLS — Instagram (4)
  { slug: "ig-username-generator", nameKey: n("ig-username-generator"), descKey: d("ig-username-generator"), seoTitleKey: st("ig-username-generator"), seoDescKey: sd("ig-username-generator"), category: "creator", icon: "AtSign", keywords: ["instagram","username","generator","handle","name"], tags: ["creator","instagram","username"], relatedSlugs: ["tt-username-generator","ig-caption-generator","ig-hashtag-generator","ig-bio-generator"], component: "tools/SocialUsernameGenerator", implemented: true, popularity: 74, addedAt: "2025-07-18" },
  { slug: "ig-caption-generator", nameKey: n("ig-caption-generator"), descKey: d("ig-caption-generator"), seoTitleKey: st("ig-caption-generator"), seoDescKey: sd("ig-caption-generator"), category: "creator", icon: "PenLine", keywords: ["instagram","caption","generator","text","social"], tags: ["creator","instagram","ai"], relatedSlugs: ["ig-hashtag-generator","ig-bio-generator","tt-caption-generator","fb-caption-generator"], component: "tools/GenericTool", premium: true, popularity: 52, isNew: true, addedAt: "2025-07-19" },
  { slug: "ig-hashtag-generator", nameKey: n("ig-hashtag-generator"), descKey: d("ig-hashtag-generator"), seoTitleKey: st("ig-hashtag-generator"), seoDescKey: sd("ig-hashtag-generator"), category: "creator", icon: "Hash", keywords: ["instagram","hashtag","generator","tags","social"], tags: ["creator","instagram","hashtag"], relatedSlugs: ["ig-caption-generator","ig-bio-generator","tt-hashtag-generator","yt-hashtag-generator"], component: "tools/HashtagGenerator", popularity: 53, isNew: true, addedAt: "2025-07-20" },
  { slug: "ig-bio-generator", nameKey: n("ig-bio-generator"), descKey: d("ig-bio-generator"), seoTitleKey: st("ig-bio-generator"), seoDescKey: sd("ig-bio-generator"), category: "creator", icon: "FileText", keywords: ["instagram","bio","generator","profile","social"], tags: ["creator","instagram","bio"], relatedSlugs: ["ig-caption-generator","ig-hashtag-generator","tt-bio-generator","ig-username-generator"], component: "tools/GenericTool", premium: true, popularity: 49, isNew: true, addedAt: "2025-07-21" },

  // CREATOR TOOLS — Facebook (1)
  { slug: "fb-caption-generator", nameKey: n("fb-caption-generator"), descKey: d("fb-caption-generator"), seoTitleKey: st("fb-caption-generator"), seoDescKey: sd("fb-caption-generator"), category: "creator", icon: "PenLine", keywords: ["facebook","caption","generator","text","social"], tags: ["creator","facebook","ai"], relatedSlugs: ["ig-caption-generator","tt-caption-generator","yt-description-generator","yt-title-generator"], component: "tools/GenericTool", premium: true, popularity: 45, isNew: true, addedAt: "2025-07-22" },

  // CREATOR TOOLS — General (6)
  { slug: "emoji-picker", nameKey: n("emoji-picker"), descKey: d("emoji-picker"), seoTitleKey: st("emoji-picker"), seoDescKey: sd("emoji-picker"), category: "creator", icon: "Smile", keywords: ["emoji","picker","copy","symbols","unicode"], tags: ["creator","emoji","utility"], relatedSlugs: ["font-generator","character-counter","social-image-size-guide","yt-thumbnail-size-guide"], component: "tools/EmojiPicker", implemented: true, featured: true, trending: true, popular: true, popularity: 88, addedAt: "2025-07-23" },
  { slug: "font-generator", nameKey: n("font-generator"), descKey: d("font-generator"), seoTitleKey: st("font-generator"), seoDescKey: sd("font-generator"), category: "creator", icon: "Type", keywords: ["font","generator","fancy","text","unicode","style"], tags: ["creator","font","text"], relatedSlugs: ["emoji-picker","character-counter","instagram-font-generator","case-converter"], component: "tools/FontGenerator", implemented: true, featured: true, popular: true, popularity: 85, addedAt: "2025-07-24" },
  { slug: "creator-character-counter", nameKey: n("creator-character-counter"), descKey: d("creator-character-counter"), seoTitleKey: st("creator-character-counter"), seoDescKey: sd("creator-character-counter"), category: "creator", icon: "Hash", keywords: ["character","counter","social","twitter","tiktok","limit"], tags: ["creator","counter","social"], relatedSlugs: ["emoji-picker","font-generator","social-image-size-guide","yt-thumbnail-size-guide"], component: "tools/CreatorCharacterCounter", implemented: true, popularity: 67, addedAt: "2025-07-25" },
  { slug: "social-image-size-guide", nameKey: n("social-image-size-guide"), descKey: d("social-image-size-guide"), seoTitleKey: st("social-image-size-guide"), seoDescKey: sd("social-image-size-guide"), category: "creator", icon: "Ruler", keywords: ["social","image","size","guide","dimensions","instagram","facebook","twitter"], tags: ["creator","guide","social"], relatedSlugs: ["yt-thumbnail-size-guide","emoji-picker","font-generator","creator-character-counter"], component: "tools/SizeGuide", implemented: true, popularity: 62, addedAt: "2025-07-26" },
  // New advanced web tools
  { slug: "speech-to-text", nameKey: n("speech-to-text"), descKey: d("speech-to-text"), seoTitleKey: st("speech-to-text"), seoDescKey: sd("speech-to-text"), category: "utilities", icon: "Mic", keywords: ["speech","voice","transcription","stt"], tags: ["speech","voice","transcription"], relatedSlugs: [], component: "tools/SpeechToText", implemented: true, popularity: 50, addedAt: "2026-01-01" },
  { slug: "text-to-speech", nameKey: n("text-to-speech"), descKey: d("text-to-speech"), seoTitleKey: st("text-to-speech"), seoDescKey: sd("text-to-speech"), category: "utilities", icon: "Volume2", keywords: ["speech","tts","synthesis","voice"], tags: ["speech","tts"], relatedSlugs: [], component: "tools/TextToSpeech", implemented: true, popularity: 50, addedAt: "2026-01-01" },
  { slug: "image-to-text-ocr", nameKey: n("image-to-text-ocr"), descKey: d("image-to-text-ocr"), seoTitleKey: st("image-to-text-ocr"), seoDescKey: sd("image-to-text-ocr"), category: "image", icon: "FileText", keywords: ["ocr","image","text","tesseract"], tags: ["image","ocr"], relatedSlugs: ["image-to-base64","image-resizer"], component: "tools/ImageToTextOcr", implemented: true, popularity: 60, addedAt: "2026-01-01" },
  { slug: "pdf-to-text", nameKey: n("pdf-to-text"), descKey: d("pdf-to-text"), seoTitleKey: st("pdf-to-text"), seoDescKey: sd("pdf-to-text"), category: "pdf", icon: "FileCode", keywords: ["pdf","text","extract","pdfjs"], tags: ["pdf","text"], relatedSlugs: ["pdf-to-image"], component: "tools/PdfToText", implemented: true, popularity: 60, addedAt: "2026-01-01" },
  { slug: "invoice-generator", nameKey: n("invoice-generator"), descKey: d("invoice-generator"), seoTitleKey: st("invoice-generator"), seoDescKey: sd("invoice-generator"), category: "finance", icon: "Receipt", keywords: ["invoice","bill","pdf","print"], tags: ["finance","invoice"], relatedSlugs: ["tax-calculator"], component: "tools/InvoiceGenerator", implemented: true, popularity: 55, addedAt: "2026-01-01" },
  { slug: "image-background-remover", nameKey: n("image-background-remover"), descKey: d("image-background-remover"), seoTitleKey: st("image-background-remover"), seoDescKey: sd("image-background-remover"), category: "image", icon: "Image", keywords: ["background","remove","transparent"], tags: ["image","background"], relatedSlugs: ["image-cropper","image-compressor"], component: "tools/ImageBackgroundRemover", implemented: true, popularity: 58, addedAt: "2026-01-01" },
  { slug: "qr-code-scanner", nameKey: n("qr-code-scanner"), descKey: d("qr-code-scanner"), seoTitleKey: st("qr-code-scanner"), seoDescKey: sd("qr-code-scanner"), category: "utilities", icon: "QrCode", keywords: ["qr","scan","camera","jsqr"], tags: ["qr","scanner"], relatedSlugs: ["qr-code-generator"], component: "tools/QrCodeScanner", implemented: true, popularity: 58, addedAt: "2026-01-01" },
];

// ═══════════════════════════════════════════════════════════
//  Lookup helpers — designed for O(1) lookups at scale
// ═══════════════════════════════════════════════════════════

const TOOL_MAP: ReadonlyMap<string, Tool> = new Map(TOOLS.map((t) => [t.slug, t]));
const CATEGORY_MAP: ReadonlyMap<string, Category> = new Map(CATEGORIES.map((c) => [c.slug, c]));
const TOOLS_BY_CATEGORY: ReadonlyMap<string, Tool[]> = new Map(
  CATEGORIES.map((c) => [c.slug, TOOLS.filter((t) => t.category === c.slug)]),
);

export function getTool(slug: string): Tool | undefined {
  return TOOL_MAP.get(slug);
}

export function toolsByCategory(cat: string): Tool[] {
  return TOOLS_BY_CATEGORY.get(cat) ?? [];
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORY_MAP.get(slug);
}

export function getRelatedTools(tool: Tool, limit = 4): Tool[] {
  if (tool.relatedSlugs?.length) {
    const related = tool.relatedSlugs
      .map((s) => TOOL_MAP.get(s))
      .filter((t): t is Tool => t !== undefined && t.slug !== tool.slug);
    if (related.length >= limit) return related.slice(0, limit);
    const fallback = toolsByCategory(tool.category)
      .filter((t) => t.slug !== tool.slug && !related.some((r) => r.slug === t.slug));
    return [...related, ...fallback].slice(0, limit);
  }
  return toolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, limit);
}

export function getPopularTools(limit = 6): Tool[] {
  return [...TOOLS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, limit);
}

export function getFeaturedTools(cat: string, limit = 3): Tool[] {
  return toolsByCategory(cat).filter((t) => t.featured).slice(0, limit);
}

export function getTrendingTools(limit = 4): Tool[] {
  return TOOLS.filter((t) => t.trending).slice(0, limit);
}

export function getNewTools(limit = 6): Tool[] {
  return TOOLS.filter((t) => t.isNew).slice(0, limit);
}

export function getRecentTools(limit = 4): Tool[] {
  return [...TOOLS].sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime()).slice(0, limit);
}

export function searchTools(query: string, limit = 20): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return TOOLS.filter((tool) => {
    const name = tool.slug.replace(/-/g, " ");
    const kw = tool.keywords?.join(" ").toLowerCase() || "";
    const tags = tool.tags?.join(" ").toLowerCase() || "";
    return name.includes(q) || kw.includes(q) || tags.includes(q);
  }).slice(0, limit);
}
export interface ToolItem {
  id: string;
  slug: string;
  nameKey: string;
  descKey: string;
  category: string;
  componentName: string;
  isPopular?: boolean;
  isNew?: boolean;
  isComingSoon?: boolean;
  iconName: string;
}

export const CATALOG_TOOLS: ToolItem[] = [
  // --- الأدوات الجديدة المطلوبة ---
  {
    id: "speech-to-text",
    slug: "speech-to-text",
    nameKey: "tools.speechToText.name",
    descKey: "tools.speechToText.desc",
    category: "text-utilities",
    componentName: "GenericTool",
    isNew: true,
    iconName: "Mic"
  },
  {
    id: "image-to-text-ocr",
    slug: "image-to-text-ocr",
    nameKey: "tools.imageToTextOcr.name",
    descKey: "tools.imageToTextOcr.desc",
    category: "image-utilities",
    componentName: "GenericTool",
    isNew: true,
    iconName: "FileText"
  },
  {
    id: "text-to-speech",
    slug: "text-to-speech",
    nameKey: "tools.textToSpeech.name",
    descKey: "tools.textToSpeech.desc",
    category: "text-utilities",
    componentName: "GenericTool",
    isNew: true,
    iconName: "Volume2"
  },
  {
    id: "pdf-to-text",
    slug: "pdf-to-text",
    nameKey: "tools.pdfToText.name",
    descKey: "tools.pdfToText.desc",
    category: "pdf-tools",
    componentName: "GenericTool",
    isNew: true,
    iconName: "FileCode"
  },
  {
    id: "invoice-generator",
    slug: "invoice-generator",
    nameKey: "tools.invoiceGenerator.name",
    descKey: "tools.invoiceGenerator.desc",
    category: "calculators",
    componentName: "GenericTool",
    isNew: true,
    iconName: "Receipt"
  },
  {
    id: "qr-code-scanner",
    slug: "qr-code-scanner",
    nameKey: "tools.qrCodeScanner.name",
    descKey: "tools.qrCodeScanner.desc",
    category: "utilities",
    componentName: "GenericTool",
    isNew: true,
    iconName: "QrCode"
  },
  {
    id: "image-background-remover",
    slug: "image-background-remover",
    nameKey: "tools.imageBackgroundRemover.name",
    descKey: "tools.imageBackgroundRemover.desc",
    category: "image-utilities",
    componentName: "GenericTool",
    isNew: true,
    iconName: "Image"
  },
  {
    id: "image-cropper",
    slug: "image-cropper",
    nameKey: "tools.imageCropper.name",
    descKey: "tools.imageCropper.desc",
    category: "image-utilities",
    componentName: "ImageCropper",
    isPopular: true,
    iconName: "Crop"
  },

  // --- الأدوات الحالية القائمة في مشروك ---
  {
    id: "percentage-calculator",
    slug: "percentage-calculator",
    nameKey: "tools.percentageCalculator.name",
    descKey: "tools.percentageCalculator.desc",
    category: "calculators",
    componentName: "PercentageCalculator",
    isPopular: true,
    iconName: "Percent"
  },
  {
    id: "average-calculator",
    slug: "average-calculator",
    nameKey: "tools.averageCalculator.name",
    descKey: "tools.averageCalculator.desc",
    category: "calculators",
    componentName: "AverageCalculator",
    iconName: "Calculator"
  },
  {
    id: "discount-calculator",
    slug: "discount-calculator",
    nameKey: "tools.discountCalculator.name",
    descKey: "tools.discountCalculator.desc",
    category: "calculators",
    componentName: "DiscountCalculator",
    isNew: true,
    iconName: "Tag"
  }
];