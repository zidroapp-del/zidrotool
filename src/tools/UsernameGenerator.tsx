import { useState, useCallback } from "react";
import { AtSign, Copy, Check, RefreshCw, Sparkles } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

const ADJ = ["pro", "epic", "elite", "dark", "neon", "cyber", "cool", "real", "the", "official", "creative", "digital", "happy", "cozy", "soft", "lunar", "wild", "free", "top", "best"];
const NOUN = ["gamer", "creator", "studio", "vibes", "dreams", "hub", "lab", "media", "works", "collective", "ninja", "legend", "boss", "star", "wolf", "tiger", "drift", "flow", "pulse", "spark"];
const SYM = ["_", ".", "x"];

export default function UsernameGenerator({ slug }: { slug?: string }) {
  const platform = slug === "tt-username-generator" ? "tiktok" : "instagram";
  const maxLen = platform === "tiktok" ? 24 : 30;

  const [keyword, setKeyword] = useState("");
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = useCallback(() => {
    const kw = keyword.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
    const names = new Set<string>();
    let attempts = 0;
    while (names.size < 12 && attempts < 60) {
      attempts++;
      const adj = ADJ[Math.floor(Math.random() * ADJ.length)];
      const noun = NOUN[Math.floor(Math.random() * NOUN.length)];
      const patterns = [`${kw}${adj}`, `${adj}${kw}`, `${kw}_${noun}`, `${kw}.${noun}`, `${kw}${noun}`, `${adj}${kw}${noun}`];
      let name = patterns[Math.floor(Math.random() * patterns.length)];
      if (!useSymbols) name = name.replace(/[._]/g, "");
      if (useNumbers) name += Math.floor(Math.random() * 999);
      if (name.length <= maxLen) names.add(name);
    }
    setResults(Array.from(names));
  }, [keyword, useNumbers, useSymbols, maxLen]);

  const handleCopy = async (name: string) => {
    const ok = await copyToClipboard(name);
    if (ok) { setCopied(name); setTimeout(() => setCopied(null), 2000); }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="label mb-2 block"><AtSign className="mr-1 inline h-4 w-4" />Keyword / Name</label>
        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} className="input" placeholder="Enter a keyword or your name" maxLength={20} />
      </div>
      <div className="mb-4 flex gap-3">
        <button onClick={() => setUseNumbers(!useNumbers)} className={cn("flex flex-1 items-center justify-between rounded-lg border px-4 py-3 transition-all", useNumbers ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20" : "border-ink-200 dark:border-ink-700")}>
          <span className="text-sm font-medium text-ink-700 dark:text-ink-300">Numbers</span>
          <span className={cn("relative h-5 w-9 rounded-full transition-colors", useNumbers ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-700")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", useNumbers ? "translate-x-4" : "translate-x-0.5")} /></span>
        </button>
        <button onClick={() => setUseSymbols(!useSymbols)} className={cn("flex flex-1 items-center justify-between rounded-lg border px-4 py-3 transition-all", useSymbols ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20" : "border-ink-200 dark:border-ink-700")}>
          <span className="text-sm font-medium text-ink-700 dark:text-ink-300">Symbols</span>
          <span className={cn("relative h-5 w-9 rounded-full transition-colors", useSymbols ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-700")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", useSymbols ? "translate-x-4" : "translate-x-0.5")} /></span>
        </button>
      </div>
      <button onClick={generate} className="btn-primary w-full"><Sparkles className="h-4 w-4" /> Generate Usernames</button>
      <p className="mt-2 text-center text-xs text-ink-400">{platform === "tiktok" ? "TikTok" : "Instagram"} limit: {maxLen} characters</p>
      {results.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold text-ink-900 dark:text-ink-100">Generated Usernames</span><button onClick={generate} className="btn btn-sm btn-secondary"><RefreshCw className="h-3.5 w-3.5" /> Regenerate</button></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {results.map((name) => (
              <div key={name} className="flex items-center gap-2 rounded-lg border border-ink-200 p-3 dark:border-ink-700">
                <span className={cn("flex-1 truncate text-sm font-medium", name.length > maxLen ? "text-danger" : "text-ink-900 dark:text-ink-100")}>@{name}</span>
                <button onClick={() => handleCopy(name)} className={cn("btn btn-sm shrink-0", copied === name ? "btn-primary" : "btn-secondary")}>{copied === name ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
