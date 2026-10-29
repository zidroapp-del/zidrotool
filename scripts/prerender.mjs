/**
 * Runs after `vite build` (npm "postbuild"). Writes one real HTML file per tool / landing page /
 * category / main page into dist/, each with its OWN <title>, description, canonical, Open Graph,
 * JSON-LD, H1 and readable text. Google then sees different pages instead of one empty shell.
 * React (react-helmet-async) replaces the head tags once the app loads, so nothing changes for visitors.
 * If anything fails the build still succeeds (the plain index.html is kept).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = path.join(root, "dist");
const SITE = "https://zidrotool.com";
const BRAND = "ZidroTool";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function load() {
  const require = createRequire(path.join(root, "package.json"));
  const esbuild = require("esbuild");
  const tmp = path.join(root, "node_modules", ".prerender-data.mjs");
  await esbuild.build({
    stdin: {
      contents: `export { TOOLS, CATEGORIES } from "@/data/catalog";
export { en } from "@/locales/en";
export { TOOL_LANDINGS } from "@/data/toolLandings";
export { getToolMeta } from "@/data/toolMeta";`,
      resolveDir: root,
      loader: "ts",
    },
    bundle: true, format: "esm", platform: "node", outfile: tmp, logLevel: "silent",
    alias: { "@": path.join(root, "src") },
  });
  return import(pathToFileURL(tmp).href + "?t=" + Date.now());
}

function fullTitle(title) {
  let t = String(title || "").trim();
  const re = /\s*[|\u2014\u2013-]\s*ZidroTool\s*$/i;
  while (re.test(t)) t = t.replace(re, "").trim();
  if (!t) return `${BRAND} — Smart Online Tools for Everyone`;
  return t.length + 12 <= 62 ? `${t} | ${BRAND}` : t;
}
const cut = (s, n = 158) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };

function page(shell, { url, title, description, h1, intro, blocks = [], jsonLd = [], keywords }) {
  const canonical = `${SITE}${url === "/" ? "/" : url}`;
  const T = fullTitle(title);
  const D = cut(description);
  const head = [
    `<title data-rh="true">${esc(T)}</title>`,
    `<meta data-rh="true" name="description" content="${esc(D)}" />`,
    keywords?.length ? `<meta data-rh="true" name="keywords" content="${esc(keywords.join(", "))}" />` : "",
    `<link data-rh="true" rel="canonical" href="${esc(canonical)}" />`,
    `<meta data-rh="true" property="og:type" content="website" />`,
    `<meta data-rh="true" property="og:site_name" content="${BRAND}" />`,
    `<meta data-rh="true" property="og:title" content="${esc(T)}" />`,
    `<meta data-rh="true" property="og:description" content="${esc(D)}" />`,
    `<meta data-rh="true" property="og:url" content="${esc(canonical)}" />`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title" content="${esc(T)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${esc(D)}" />`,
    ...jsonLd.map((j) => `<script data-rh="true" type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`),
  ].filter(Boolean).join("\n    ");

  // remove the generic title/description of the shell
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "")
    .replace("</head>", `    ${head}\n  </head>`);

  const body = `<div data-prerender="true" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden">` +
    `<h1>${esc(h1)}</h1>${intro ? `<p>${esc(intro)}</p>` : ""}` +
    blocks.map((b) => `<section><h2>${esc(b.h)}</h2>${b.p ? `<p>${esc(b.p)}</p>` : ""}${b.items ? `<ul>${b.items.map((i) => `<li>${i.href ? `<a href="${esc(i.href)}">${esc(i.text)}</a>` : esc(i.text)}${i.desc ? ` — ${esc(i.desc)}` : ""}</li>`).join("")}</ul>` : ""}</section>`).join("") +
    `</div>`;
  return html.replace(/(<div id="root"[^>]*>)/i, `$1${body}`);
}

function write(url, html) {
  const file = url === "/" ? path.join(dist, "index.html") : path.join(dist, url.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

async function main() {
  if (!fs.existsSync(path.join(dist, "index.html"))) { console.log("prerender: dist/index.html not found, skipped."); return; }
  const { TOOLS, CATEGORIES, en, TOOL_LANDINGS, getToolMeta } = await load();
  const shell = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const t = (k, fallback = "") => (en[k] ?? fallback);
  const crumbs = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it[0], item: `${SITE}${it[1]}` })) });
  const faqLd = (faqs) => faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } : null;
  const appLd = (name, desc, url) => ({ "@context": "https://schema.org", "@type": "WebApplication", name, description: desc, url: `${SITE}${url}`, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } });
  let count = 0;
  const seenTitles = new Map();
  const emit = (p) => { const html = page(shell, p); write(p.url, html); count++; const T = fullTitle(p.title); if (seenTitles.has(T)) console.warn(`prerender: duplicate title "${T}" on ${p.url} and ${seenTitles.get(T)}`); seenTitles.set(T, p.url); };

  // tools
  for (const tool of TOOLS) {
    const name = t(tool.nameKey, tool.slug);
    const seoTitle = t(tool.seoTitleKey) || `${name} — Free Online Tool`;
    const desc = t(tool.seoDescKey) || t(tool.descKey) || name;
    const url = `/tools/${tool.slug}`;
    const meta = getToolMeta(tool.slug);
    const steps = (meta.howTo || []).map((s) => ({ text: t(s.titleKey), desc: t(s.descKey) })).filter((s) => s.text);
    const faqs = (meta.faqs || []).map((f) => ({ q: t(f.qKey), a: t(f.aKey) })).filter((f) => f.q && f.a);
    const cat = CATEGORIES.find((c) => c.slug === tool.category);
    emit({
      url, title: seoTitle, description: desc, h1: name, intro: t(tool.descKey) || desc,
      keywords: tool.keywords,
      blocks: [
        steps.length && { h: "How to use", items: steps },
        faqs.length && { h: "FAQ", items: faqs.map((f) => ({ text: f.q, desc: f.a })) },
        { h: "More tools", items: [{ text: "All tools", href: "/tools" }, ...(cat ? [{ text: t(cat.nameKey), href: `/category/${cat.slug}` }] : [])] },
      ].filter(Boolean),
      jsonLd: [appLd(name, desc, url), crumbs([["Home", "/"], ["Tools", "/tools"], [name, url]]), faqLd(faqs)].filter(Boolean),
    });
  }

  // keyword landing pages
  for (const l of TOOL_LANDINGS) {
    const url = `/tools/${l.slug}`;
    emit({
      url, title: l.title, description: l.description, h1: l.h1, intro: l.intro, keywords: l.keywords,
      blocks: [...l.sections.map((s) => ({ h: s.heading, p: s.text })), l.faqs.length && { h: "FAQ", items: l.faqs.map((f) => ({ text: f.q, desc: f.a })) }].filter(Boolean),
      jsonLd: [appLd(l.h1, l.description, url), crumbs([["Home", "/"], ["Tools", "/tools"], [l.h1, url]]), faqLd(l.faqs)].filter(Boolean),
    });
  }

  // categories
  for (const c of CATEGORIES) {
    const name = t(c.nameKey, c.slug);
    const list = TOOLS.filter((x) => x.category === c.slug);
    emit({
      url: `/category/${c.slug}`, title: `${name} — Free Online Tools`, description: `${t(c.descKey)} ${list.length} free tools: ${list.slice(0, 4).map((x) => t(x.nameKey)).join(", ")}.`,
      h1: name, intro: t(c.descKey),
      blocks: [{ h: name, items: list.map((x) => ({ text: t(x.nameKey), desc: t(x.descKey), href: `/tools/${x.slug}` })) }],
      jsonLd: [crumbs([["Home", "/"], [name, `/category/${c.slug}`]])],
    });
  }

  // directory + home
  emit({
    url: "/tools", title: "All Free Online Tools", description: `Browse ${TOOLS.length}+ free online tools for images, PDF, text, developers, SEO and more. Fast, private, no sign-up.`,
    h1: "All free online tools", intro: "Search and filter every ZidroTool utility.",
    blocks: [{ h: "Tools", items: TOOLS.map((x) => ({ text: t(x.nameKey), href: `/tools/${x.slug}` })) }],
    jsonLd: [crumbs([["Home", "/"], ["Tools", "/tools"]])],
  });
  emit({
    url: "/", title: "", description: t("hero.subtitle") || "Free, fast, privacy-first online tools for developers, creators and everyday users.",
    h1: t("hero.title") || "Smart Online Tools for Everyone", intro: t("hero.subtitle"),
    blocks: [{ h: "Popular tools", items: TOOLS.slice(0, 40).map((x) => ({ text: t(x.nameKey), href: `/tools/${x.slug}` })) }],
    jsonLd: [],
  });
  console.log(`prerender: wrote ${count} pages.`);
}

main().catch((e) => { console.warn("prerender skipped:", e?.message || e); });
