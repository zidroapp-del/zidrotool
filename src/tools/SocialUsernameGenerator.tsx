import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Copy, Check, AtSign, Sparkles } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface Props {
  slug?: string;
}

type Category = "gaming" | "aesthetic" | "professional" | "funny" | "minimal";
type Length = "short" | "medium" | "long";

const ADJECTIVES: Record<Category, string[]> = {
  gaming: ["pro", "epic", "elite", "toxic", "clutch", "god", "dark", "neon", "cyber", "pixel"],
  aesthetic: ["cozy", "soft", "lunar", "daisy", "honey", "velvet", "amber", "ivory", "rose", "sage"],
  professional: ["the", "real", "official", "creative", "digital", "modern", "smart", "prime", "pro", "true"],
  funny: ["silly", "wacky", "loopy", "zany", "quirky", "goofy", "derp", "wonky", "funky", "bonkers"],
  minimal: ["one", "sun", "moon", "sky", "dew", "leaf", "calm", "pure", "raw", "zen"],
};

const NOUNS: Record<Category, string[]> = {
  gaming: ["gamer", "player", "killer", "striker", "ranger", "sniper", "warrior", "ninja", "legend", "boss"],
  aesthetic: ["vibes", "dreams", "clouds", "petals", "waves", "glow", "bloom", "haze", "muse", "whisper"],
  professional: ["studio", "lab", "hub", "works", "media", "design", "co", "collective", "house", "agency"],
  funny: ["noodle", "potato", "burrito", "penguin", "llama", "goose", "waffle", "pickle", "banana", "toast"],
  minimal: ["dot", "line", "mark", "stone", "drop", "ray", "breath", "step", "note", "thread"],
};

function generate(keyword: string, category: Category, length: Length, useNumbers: boolean, useSymbols: boolean, count: number, maxLen: number): string[] {
  const kw = keyword.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  const adjs = ADJECTIVES[category];
  const nouns = NOUNS[category];
  const results = new Set<string>();
  let attempts = 0;

  while (results.size < count && attempts < count * 5) {
    attempts++;
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    let parts: string[];
    switch (length) {
      case "short": parts = [kw, adj]; break;
      case "long": parts = [kw, adj, noun]; break;
      default: parts = Math.random() > 0.5 ? [kw, noun] : [adj, kw]; break;
    }
    let name = parts.join(useSymbols ? "." : "");
    if (useNumbers) {
      const num = Math.floor(Math.random() * 999);
      name = `${name}${num}`;
    }
    if (!useSymbols && !useNumbers && length !== "short") {
      name = name.replace(/[._]/g, "");
    }
    if (name.length <= maxLen) results.add(name);
  }
  return Array.from(results);
}

const CATEGORY_OPTIONS: { value: Category; emoji: string }[] = [
  { value: "gaming", emoji: "🎮" },
  { value: "aesthetic", emoji: "🌙" },
  { value: "professional", emoji: "💼" },
  { value: "funny", emoji: "🤪" },
  { value: "minimal", emoji: "⚪" },
];

export default function SocialUsernameGenerator({ slug }: Props) {
  const { t } = useTranslation();
  const { success } = useToast();
  const platform = slug === "tt-username-generator" ? "tiktok" : "instagram";
  const maxLen = platform === "tiktok" ? 24 : 30;

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<Category>("aesthetic");
  const [length, setLength] = useState<Length>("medium");
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    const names = generate(keyword, category, length, useNumbers, useSymbols, 12, maxLen);
    setResults(names);
    setCopied(null);
  }, [keyword, category, length, useNumbers, useSymbols]);

  const handleCopy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(name);
      success(t("tool.copied"));
      setTimeout(() => setCopied(null), 2000);
    } catch { /* noop */ }
  };

  return (
    <div>
      {/* Options Panel */}
      <div className="mb-6 space-y-4">
        {/* Keyword */}
        <div>
          <label className="label mb-1.5 block">{t("creator.username.keyword")}</label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="input pl-10"
              placeholder={t("creator.username.placeholder")}
              maxLength={20}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="label mb-1.5 block">{t("creator.username.category")}</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCategory(opt.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                  category === opt.value
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
                )}
              >
                <span className="mr-1">{opt.emoji}</span>
                <span className="capitalize">{opt.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div>
          <label className="label mb-1.5 block">{t("creator.username.length")}</label>
          <div className="flex gap-1.5">
            {(["short", "medium", "long"] as Length[]).map((l) => (
              <button
                key={l}
                onClick={() => setLength(l)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  length === l
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
                )}
              >
                {t(`creator.username.${l}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-3">
          <button
            onClick={() => setUseNumbers(!useNumbers)}
            className={cn(
              "flex flex-1 items-center justify-between rounded-lg border px-4 py-3 transition-all",
              useNumbers
                ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
                : "border-ink-200 dark:border-ink-700",
            )}
          >
            <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{t("creator.username.numbers")}</span>
            <span className={cn("relative h-5 w-9 rounded-full transition-colors", useNumbers ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-700")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", useNumbers ? "translate-x-4" : "translate-x-0.5")} />
            </span>
          </button>
          <button
            onClick={() => setUseSymbols(!useSymbols)}
            className={cn(
              "flex flex-1 items-center justify-between rounded-lg border px-4 py-3 transition-all",
              useSymbols
                ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
                : "border-ink-200 dark:border-ink-700",
            )}
          >
            <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{t("creator.username.symbols")}</span>
            <span className={cn("relative h-5 w-9 rounded-full transition-colors", useSymbols ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-700")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", useSymbols ? "translate-x-4" : "translate-x-0.5")} />
            </span>
          </button>
        </div>

        {/* Generate */}
        <button onClick={handleGenerate} className="btn-primary w-full">
          <Sparkles className="h-4 w-4" />
          {t("creator.username.generate")}
        </button>
        <p className="text-center text-xs text-ink-400">{platform === "tiktok" ? t("creator.username.tiktokLimit") : t("creator.username.instagramLimit")}: {maxLen} {t("creator.username.chars")}</p>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{t("creator.username.results")}</h3>
            <button onClick={handleGenerate} className="btn btn-sm btn-secondary">
              <RefreshCw className="h-3.5 w-3.5" />
              {t("creator.username.regenerate")}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {results.map((name) => (
              <div key={name} className="flex items-center gap-2 rounded-lg border border-ink-200 p-3 transition-colors hover:border-brand-300 dark:border-ink-700">
                <span className={cn("flex-1 truncate text-sm font-medium", name.length > maxLen ? "text-danger" : "text-ink-900 dark:text-ink-100")}>
                  @{name}
                </span>
                <button onClick={() => handleCopy(name)} className={cn("btn btn-sm shrink-0", copied === name ? "btn-primary" : "btn-secondary")}>
                  {copied === name ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AtSign className="h-10 w-10 text-ink-300 dark:text-ink-700" />
          <p className="mt-3 text-sm text-ink-400">{t("creator.username.placeholder2")}</p>
        </div>
      )}
    </div>
  );
}
