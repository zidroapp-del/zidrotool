import { useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Clipboard,
  Eraser,
  Eye,
  FileText,
  SearchCheck,
  Type,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

const PLATFORMS = [
  { id: "google", name: "Google SEO", characterLimit: 60, pixelLimit: 600 },
  { id: "ebay", name: "eBay", characterLimit: 80, pixelLimit: undefined },
  { id: "etsy", name: "Etsy", characterLimit: 140, pixelLimit: undefined },
  { id: "amazon", name: "Amazon", characterLimit: 200, pixelLimit: undefined },
  { id: "poshmark", name: "Poshmark", characterLimit: 50, pixelLimit: undefined },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];
type Tone = "safe" | "near" | "over";

const FAQ_ITEMS = [
  {
    question: "What is the optimal length for a Google title tag?",
    answer:
      "A practical starting point is about 50–60 characters, but Google displays title links according to available pixel width, not a fixed character count. Aim to keep the rendered title near or below 600 pixels and put the clearest description first.",
  },
  {
    question: "Why does Google truncate title tags by pixels instead of characters?",
    answer:
      "Characters have different widths: a title containing wide letters takes more room than one containing narrow letters. Google renders title links within a pixel-limited layout, so pixel width is a better estimate than character count, although actual results can vary by device and query.",
  },
  {
    question: "What is the title length limit for eBay and Amazon?",
    answer:
      "This checker uses 80 characters for eBay and 200 for Amazon as reference limits. Marketplace rules can change and may vary by listing type or category, so confirm the current limit in the relevant seller documentation.",
  },
  {
    question: "Does having a long title tag hurt my site's Google ranking?",
    answer:
      "A long title is not automatically a ranking penalty. However, a title that is difficult to scan or gets truncated can make the result less clear and may affect clicks. Google may also generate a different title link when it considers the supplied title unhelpful.",
  },
] as const;

/** SEO data for the tool page and its structured FAQ content. */
export const TITLE_LENGTH_CHECKER_SEO = {
  suggestedTitle: "Meta Title Length & Snippet Checker Tool",
  metaDescription:
    "Check title character count and pixel width for Google, eBay, Etsy, Amazon, and Poshmark. Preview truncation and refine titles instantly.",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  },
} as const;

function measurePixelWidth(text: string): number {
  if (!text || typeof document === "undefined") return 0;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 0;
  context.font = '20px Arial, "Helvetica Neue", sans-serif';
  return context.measureText(text).width;
}

function truncateToPixelWidth(text: string, maxWidth: number): string {
  if (measurePixelWidth(text) <= maxWidth) return text;
  const characters = Array.from(text);
  let low = 0;
  let high = characters.length;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (measurePixelWidth(`${characters.slice(0, middle).join("")}…`) <= maxWidth) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return `${characters.slice(0, low).join("").trimEnd()}…`;
}

function toneFor(value: number, limit: number): Tone {
  if (value > limit) return "over";
  if (limit - value <= 10 || value / limit >= 0.85) return "near";
  return "safe";
}

const TONE_CLASSES: Record<Tone, { bar: string; text: string; label: string }> = {
  safe: {
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Within range",
  },
  near: {
    bar: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-300",
    label: "Approaching limit",
  },
  over: {
    bar: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
    label: "Over limit",
  },
};

export default function TitleLengthChecker() {
  const [title, setTitle] = useState("");
  const [platformId, setPlatformId] = useState<PlatformId>("google");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const platform = PLATFORMS.find((item) => item.id === platformId) ?? PLATFORMS[0];
  const characterCount = Array.from(title).length;
  const wordCount = title.trim() ? title.trim().split(/\s+/u).length : 0;
  const pixelWidth = useMemo(() => measurePixelWidth(title), [title]);
  const characterTone = toneFor(characterCount, platform.characterLimit);
  const pixelTone = platform.pixelLimit ? toneFor(pixelWidth, platform.pixelLimit) : "safe";
  const tone: Tone = characterTone === "over" || pixelTone === "over"
    ? "over"
    : characterTone === "near" || pixelTone === "near"
      ? "near"
      : "safe";
  const toneStyle = TONE_CLASSES[tone];
  const progressRatio = Math.max(
    characterCount / platform.characterLimit,
    platform.pixelLimit ? pixelWidth / platform.pixelLimit : 0,
  );
  const progressWidth = title ? `${Math.min(100, Math.max(2, progressRatio * 100))}%` : "0%";
  const snippetTitle = platform.pixelLimit
    ? truncateToPixelWidth(title, platform.pixelLimit)
    : title;
  const hasPixelOverflow = Boolean(platform.pixelLimit && pixelWidth > platform.pixelLimit);

  const titleCase = () => {
    setTitle((current) => current.replace(/(^|\s)(\p{L})([^\s]*)/gu, (_match, space: string, first: string, rest: string) =>
      `${space}${first.toLocaleUpperCase()}${rest.toLocaleLowerCase()}`,
    ));
  };

  const handleCopy = async () => {
    if (!title.trim()) return;
    if (await copyToClipboard(title)) {
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    }
  };

  return (
    <div className="space-y-10">
      <section aria-label="Title length checker" className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-950 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Type className="h-5 w-5 text-brand-500" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">Check a title</h2>
        </div>

        <label htmlFor="title-length-input" className="label mb-2 block">Enter your title</label>
        <textarea
          id="title-length-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Type or paste an SEO title or product listing title..."
          rows={3}
          className="input min-h-28 w-full resize-y"
          aria-describedby="title-count-summary"
        />

        <fieldset className="mt-5">
          <legend className="label mb-2">Choose a platform</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {PLATFORMS.map((item) => {
              const selected = item.id === platformId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlatformId(item.id)}
                  aria-pressed={selected}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${selected
                    ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-950/50 dark:text-brand-200"
                    : "border-ink-200 bg-white text-ink-600 hover:border-ink-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-500"}`}
                >
                  <span className="block text-sm font-semibold">{item.name}</span>
                  <span className="mt-1 block text-xs text-ink-500 dark:text-ink-400">
                    {item.characterLimit} characters{item.pixelLimit ? ` · ${item.pixelLimit}px` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div id="title-count-summary" className="mt-5 grid gap-3 sm:grid-cols-3" aria-live="polite">
          <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-900">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Characters</p>
            <p className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-100">{characterCount} <span className="text-sm font-normal text-ink-500">/ {platform.characterLimit}</span></p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-900">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Words</p>
            <p className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-100">{wordCount}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-900">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Pixel width estimate</p>
            <p className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-100">
              {Math.round(pixelWidth)}px{platform.pixelLimit ? <span className="text-sm font-normal text-ink-500"> / {platform.pixelLimit}px</span> : null}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-ink-700 dark:text-ink-300">Length status</span>
            <span className={`font-semibold ${toneStyle.text}`}>{title ? toneStyle.label : "Ready to check"}</span>
          </div>
          <div
            role="progressbar"
            aria-label={`${platform.name} title length`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(100, progressRatio * 100))}
            className="h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800"
          >
            <div className={`h-full rounded-full transition-all duration-300 ease-out ${toneStyle.bar}`} style={{ width: progressWidth }} />
          </div>
          <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
            {platform.pixelLimit
              ? "Google title display is estimated by pixel width; character guidance is approximate."
              : `Reference limit shown for ${platform.name}; check current marketplace rules for listing-specific requirements.`}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={handleCopy} disabled={!title.trim()} className="btn btn-primary">
            {copyState === "copied" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            {copyState === "copied" ? "Copied" : "Copy Title"}
          </button>
          <button type="button" onClick={() => setTitle("")} disabled={!title} className="btn btn-secondary">
            <Eraser className="h-4 w-4" />Clear Text
          </button>
          <button type="button" onClick={titleCase} disabled={!title.trim()} className="btn btn-secondary">
            <Type className="h-4 w-4" />Title Case
          </button>
        </div>

        <section aria-labelledby="serp-preview-heading" className="mt-6 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900/70 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-brand-500" aria-hidden="true" />
            <h3 id="serp-preview-heading" className="text-sm font-semibold text-ink-800 dark:text-ink-200">Google Search Preview</h3>
          </div>
          <div className="max-w-[600px] rounded-lg bg-white p-4 dark:bg-ink-950">
            <p className="truncate text-xs text-ink-600 dark:text-ink-400">https://www.example.com › page</p>
            <p className="mt-1 break-words text-[20px] leading-7 text-blue-700 dark:text-blue-300">
              {snippetTitle || "Your page title preview"}
            </p>
            {hasPixelOverflow && <p className="mt-1 text-xs text-orange-700 dark:text-orange-300">The title is shortened in this preview because it exceeds roughly 600px.</p>}
            <p className="mt-1 text-sm leading-5 text-ink-600 dark:text-ink-400">
              Add a clear, relevant meta description to help searchers understand this page.
            </p>
          </div>
        </section>
      </section>

      <section aria-labelledby="how-to-title-checker" className="space-y-4">
        <div className="flex items-center gap-2">
          <SearchCheck className="h-5 w-5 text-brand-500" aria-hidden="true" />
          <h2 id="how-to-title-checker" className="text-xl font-bold text-ink-900 dark:text-ink-100">How to Use This Tool</h2>
        </div>
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Type, title: "Enter a title", text: "Type or paste the page title or product listing title you want to check." },
            { icon: BarChart3, title: "Choose a platform", text: "Select Google SEO or a marketplace to load its character guidance." },
            { icon: Eye, title: "Review and refine", text: "Use the character, word, and pixel measurements and preview before copying your final title." },
          ].map(({ icon: Icon, title: stepTitle, text }, index) => (
            <li key={stepTitle} className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Step {index + 1}</span>
              </div>
              <h3 className="mt-3 font-semibold text-ink-900 dark:text-ink-100">{stepTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-400">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="title-length-seo-matters" className="space-y-3">
        <h2 id="title-length-seo-matters" className="text-xl font-bold text-ink-900 dark:text-ink-100">Why Title Tag Length Matters for SEO</h2>
        <div className="space-y-3 text-sm leading-7 text-ink-600 dark:text-ink-300">
          <p>A page title is often the most prominent clickable text in an organic search result. A useful, accurate title helps people understand what a page offers before they visit. Clear wording can support click-through rate (CTR), while a vague, repetitive, or misleading title may make a relevant result less compelling. CTR is a user-behavior metric, not a guaranteed ranking lever, so write for searchers rather than trying to game clicks.</p>
          <p>There is no universal character cutoff for Google title links. Search results are rendered within a variable-width layout, and letters occupy different amounts of space. A title with many wide characters can exceed the available width sooner than a title with the same number of narrow characters. This tool measures an Arial-based estimate in pixels and uses around 600px as a practical preview threshold; actual rendering can differ by device, font, query, and result layout.</p>
          <p>When a title is too long, important words may be truncated and Google may choose a different title link based on the page and query. Front-load the page topic and brand where appropriate, keep the wording specific, and make sure the title accurately reflects visible page content. Marketplace limits are separate from Google guidance and may vary by category or listing rules.</p>
        </div>
      </section>

      <section aria-labelledby="title-best-practices" className="space-y-3">
        <h2 id="title-best-practices" className="text-xl font-bold text-ink-900 dark:text-ink-100">Best Practices for SEO Titles &amp; Marketplace Listings</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-ink-600 dark:text-ink-300 marker:text-brand-500">
          <li><strong className="text-ink-900 dark:text-ink-100">Front-load the main topic:</strong> put the clearest subject or product identifier early so it remains visible if the title is shortened.</li>
          <li><strong className="text-ink-900 dark:text-ink-100">Write naturally:</strong> use readable sentence case or restrained title case. Keep the title accurate and useful instead of stacking near-duplicate keywords.</li>
          <li><strong className="text-ink-900 dark:text-ink-100">Avoid ALL CAPS:</strong> excessive capitalization can reduce readability and look promotional; capitalize only acronyms and proper names as needed.</li>
          <li><strong className="text-ink-900 dark:text-ink-100">Follow marketplace rules:</strong> use the selected character guide as a quick reference and verify current requirements for your category and listing type.</li>
          <li><strong className="text-ink-900 dark:text-ink-100">Preview before publishing:</strong> check both character count and pixel width for search titles, then confirm the title matches the page or product.</li>
        </ul>
      </section>

      <section aria-labelledby="title-checker-faq" className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-500" aria-hidden="true" />
          <h2 id="title-checker-faq" className="text-xl font-bold text-ink-900 dark:text-ink-100">Frequently Asked Questions (FAQ)</h2>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <details key={question} className="group rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950">
              <summary className="cursor-pointer list-none font-semibold text-ink-900 marker:hidden dark:text-ink-100">
                {question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">{answer}</p>
            </details>
          ))}
        </div>
        <script type="application/ld+json">{JSON.stringify(TITLE_LENGTH_CHECKER_SEO.jsonLd)}</script>
      </section>
    </div>
  );
}
