import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const site = "https://zidrotool.com";

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const catalog = fs.readFileSync(path.join(root, "src/data/catalog.ts"), "utf8");
const tools = [...catalog.matchAll(/^\s*\{\s*slug:\s*["']([^"']+)["']/gm)].map((m) => m[1]);
const categorySource = catalog.split("export const TOOLS:")[0];
const categories = [...categorySource.matchAll(/\{\s*slug:\s*["']([^"']+)["'],\s*nameKey:/g)].map((m) => m[1]);
const toolUpdatedAt = new Map(
  [...catalog.matchAll(/slug:\s*["']([^"']+)["'][\s\S]*?(?:updatedAt|addedAt):\s*["']([^"']+)["']/g)]
    .map((m) => [m[1], m[2]])
);

const blogDir = path.join(root, "content/blog");
const blogCategories = ["seo-analytics", "web-development", "text-utilities"];
const posts = fs.existsSync(blogDir)
  ? fs.readdirSync(blogDir)
      .filter((name) => name.endsWith(".md"))
      .map((name) => {
        const raw = fs.readFileSync(path.join(blogDir, name), "utf8");
        const date = raw.match(/^date:\s*["']([^"']+)["']/m)?.[1];
        const modified = raw.match(/^lastModified:\s*["']([^"']+)["']/m)?.[1];
        return {
          slug: name.replace(/\.md$/, "").replace(/^\d+-/, ""),
          lastmod: modified || date || undefined,
        };
      })
  : [];

const unique = (items) => [...new Set(items)];
const urls = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/tools", changefreq: "weekly", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.5" },
  { path: "/about", changefreq: "monthly", priority: "0.4" },
  { path: "/contact", changefreq: "monthly", priority: "0.3" },
  { path: "/privacy", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", changefreq: "monthly", priority: "0.5" },
  { path: "/cookies", changefreq: "monthly", priority: "0.4" },
  { path: "/disclaimer", changefreq: "monthly", priority: "0.3" },
  { path: "/dmca", changefreq: "monthly", priority: "0.3" },
  { path: "/security", changefreq: "monthly", priority: "0.3" },
  { path: "/accessibility", changefreq: "monthly", priority: "0.3" },
  ...unique(categories).map((slug) => ({ path: `/category/${slug}`, changefreq: "weekly", priority: "0.7" })),
  ...blogCategories.map((slug) => ({ path: `/blog/category/${slug}`, changefreq: "weekly", priority: "0.7" })),
  { path: "/blog/author/zidro-team", changefreq: "monthly", priority: "0.4" },
  ...unique(tools).map((slug) => ({ path: `/tools/${slug}`, changefreq: "monthly", priority: "0.8", lastmod: toolUpdatedAt.get(slug) })),
  ...unique(posts.map((post) => post.slug)).map((slug) => {
    const post = posts.find((item) => item.slug === slug);
    return { path: `/blog/${slug}`, changefreq: "monthly", priority: "0.7", lastmod: post?.lastmod };
  }),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map(({ path: url, changefreq, priority, lastmod }) => [
    `  <url><loc>${escapeXml(`${site}${url}`)}</loc>`,
    lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : "",
    `<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
  ].filter(Boolean).join(""))
  .join("\n")}\n</urlset>\n`;

fs.writeFileSync(path.join(root, "public/sitemap.xml"), xml);
console.log(`Generated sitemap with ${urls.length} URLs.`);
