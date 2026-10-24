import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Download, FileText, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";

/* ------------------------------------------------------------------ engine
 * Extractive summariser that runs fully in the browser:
 *  1. split the text into sentences (abbreviations and decimals are protected)
 *  2. count how often each meaningful word appears (stop words removed, 6 languages)
 *  3. score every sentence by the words it carries, with a small bonus for opening sentences
 *  4. pick the best ones, skipping near-duplicates, and put them back in the original order
 * It selects sentences from your text; it never writes new ones.
 */

const MAX_CHARS = 60_000;

const STOP_WORDS = new Set(
  (
    // English
    "a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours " +
    "also however thus therefore although though yet still even much many may might must shall one two let get got like said says say " +
    // French
    "au aux avec pendant plusieurs ce ces dans de des du elle en et eux il ils je la le les leur lui ma mais me même mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous est sont été être avoir ont fait plus très aussi comme donc car si cette cet où dont " +
    // Spanish
    "el la los las un una unos unas de del al y o pero que se su sus mi mis tu tus con sin por para como más muy ya es son fue ser está están han hay lo le les me te nos este esta estos estas ese esa eso también cuando donde porque entre sobre " +
    // German
    "der die das den dem des ein eine einen einem einer und oder aber nicht ist sind war waren wird werden wurde hat haben hatte mit von zu zum zur auf aus bei nach über unter für als auch wie noch nur sich er sie es wir ihr ich du dass wenn dann diese dieser dieses " +
    // Italian
    "il lo la i gli le un uno una di del della dei delle da in con su per tra fra e o ma che non si è sono era erano ha hanno come più anche molto questo questa questi queste quello quella al alla ai alle nel nella sul sulla " +
    // Arabic
    "في من على إلى عن مع هذا هذه ذلك تلك هو هي هم هن أن إن كان كانت التي الذي الذين اللذان ما لا لم لن قد كل بعد قبل بين حتى أو ثم أي إذا عند كما لكن به بها له لها فيه فيها منه منها وقد وهو وهي"
  ).split(/\s+/),
);

const ABBREVIATIONS = /\b(?:mr|mrs|ms|dr|prof|sr|jr|vs|etc|fig|inc|ltd|co|no|st|approx|dept|est|e\.g|i\.e|m|mme|mlle|sra|sr|sta|dott)\./gi;
const MARK = "\u0001";

type Sentence = { text: string; block: number; first: boolean; index: number };

function splitSentences(input: string): Sentence[] {
  const blocks = input.replace(/\r\n?/g, "\n").split(/\n+/);
  const out: Sentence[] = [];
  blocks.forEach((raw, block) => {
    const protectedText = raw
      .replace(ABBREVIATIONS, (m) => m.replace(/\./g, MARK))
      .replace(/(\d)\.(\d)/g, `$1${MARK}$2`);
    const parts = protectedText.split(/(?<=[.!?؟…。])["'”’)\]]*\s+/u);
    let first = true;
    for (const part of parts) {
      const text = part.replace(new RegExp(MARK, "g"), ".").trim();
      if (!text || !/[\p{L}\p{N}]/u.test(text)) continue;
      out.push({ text, block, first, index: out.length });
      first = false;
    }
  });
  return out;
}

const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;

function termsOf(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.match(WORD_RE) ?? []) {
    let w = raw.toLowerCase().replace(/’/g, "'");
    if (/^\d+$/.test(w)) continue;
    if (/^[؀-ۿ]/.test(w) && w.length > 4) w = w.replace(/^(ال|لل|وال)/, "");
    if (STOP_WORDS.has(w)) continue;
    if (/^[a-zà-ÿ]+$/.test(w)) {
      if (w.length > 4 && /ies$/.test(w)) w = `${w.slice(0, -3)}y`;
      else if (w.length > 4 && /[^s]s$/.test(w)) w = w.slice(0, -1);
    }
    if (w.length < 3) continue;
    out.push(w);
  }
  return out;
}

const wordCount = (s: string): number => (s.match(WORD_RE) ?? []).length;

type SummaryResult = {
  sentences: Sentence[];
  picked: Set<number>;
  keyPhrases: string[];
  wordsIn: number;
  wordsOut: number;
  tooShort: boolean;
};

function summarise(text: string, percent: number): SummaryResult {
  const sentences = splitSentences(text);
  const wordsIn = wordCount(text);
  if (sentences.length < 3) {
    return { sentences, picked: new Set(sentences.map((s) => s.index)), keyPhrases: [], wordsIn, wordsOut: wordsIn, tooShort: true };
  }

  const perSentence = sentences.map((s) => termsOf(s.text));
  const tf = new Map<string, number>();
  const surface = new Map<string, Map<string, number>>();
  perSentence.forEach((terms, i) => {
    terms.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    for (const raw of sentences[i]!.text.match(WORD_RE) ?? []) {
      const key = termsOf(raw)[0];
      if (!key) continue;
      const m = surface.get(key) ?? new Map<string, number>();
      m.set(raw, (m.get(raw) ?? 0) + 1);
      surface.set(key, m);
    }
  });

  const scores = sentences.map((s, i) => {
    const uniq = [...new Set(perSentence[i]!)];
    if (uniq.length === 0) return 0;
    let sum = 0;
    for (const t of uniq) sum += tf.get(t) ?? 0;
    let score = sum / Math.sqrt(uniq.length + 1);
    score *= 1 + 0.35 * Math.exp(-i / 4); // opening sentences usually carry the topic
    if (s.first) score *= 1.12;
    const n = wordCount(s.text);
    if (n < 5) score *= 0.4;
    else if (n > 55) score *= 0.8;
    if (/\d/.test(s.text)) score *= 1.05;
    return score;
  });

  const target = Math.max(1, Math.min(sentences.length - 1, Math.round((sentences.length * percent) / 100)));
  const sets = perSentence.map((t) => new Set(t));
  const chosen: number[] = [];
  const remaining = new Set(sentences.map((s) => s.index));
  while (chosen.length < target && remaining.size > 0) {
    let best = -1;
    let bestScore = -1;
    for (const i of remaining) {
      let sim = 0;
      for (const j of chosen) {
        const a = sets[i]!;
        const b = sets[j]!;
        let inter = 0;
        a.forEach((t) => {
          if (b.has(t)) inter++;
        });
        const union = a.size + b.size - inter;
        sim = Math.max(sim, union ? inter / union : 0);
      }
      const adj = scores[i]! * (1 - 0.75 * sim);
      if (adj > bestScore) {
        bestScore = adj;
        best = i;
      }
    }
    if (best < 0) break;
    chosen.push(best);
    remaining.delete(best);
  }
  const picked = new Set(chosen);

  const ranked = [...tf.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).filter(([, n]) => n >= 2 || tf.size < 12);
  const keyPhrases = ranked.slice(0, 8).map(([key]) => {
    const forms = [...(surface.get(key)?.entries() ?? [])].sort((a, b) => b[1] - a[1]);
    return (forms[0]?.[0] ?? key).toLowerCase();
  });

  const wordsOut = sentences.filter((s) => picked.has(s.index)).reduce((n, s) => n + wordCount(s.text), 0);
  return { sentences, picked, keyPhrases, wordsIn, wordsOut, tooShort: false };
}

const SAMPLE =
  "Sleep is one of the most important factors in long-term health, yet many adults regularly get less than the seven hours that doctors recommend. During sleep the brain clears waste products, strengthens memories and regulates hormones that control appetite and mood. People who sleep poorly are more likely to gain weight, to catch infections and to struggle with concentration at work. Researchers have also linked chronic sleep loss to a higher risk of heart disease and diabetes. A regular schedule is the simplest way to improve sleep: going to bed and waking up at the same time every day trains the body clock. Caffeine late in the afternoon can stay in the body for up to eight hours, so many sleep specialists suggest avoiding it after lunch. Screens are another common problem, because bright light in the evening delays the release of melatonin. A cool, dark and quiet bedroom helps as well. For people who still struggle after a few weeks of better habits, a doctor can check for conditions such as sleep apnea. In short, good sleep is not a luxury but a basic need, and small changes to daily routines can make a large difference.";

/* ------------------------------------------------------------------ decoration */

const BG_SHEETS = [
  { left: 4, top: 12, w: 74, delay: -2, dur: 26 },
  { left: 90, top: 22, w: 64, delay: -9, dur: 30 },
  { left: 12, top: 74, w: 80, delay: -14, dur: 28 },
  { left: 82, top: 80, w: 70, delay: -5, dur: 32 },
  { left: 48, top: 4, w: 58, delay: -18, dur: 34 },
];

const BG_MARKS = [
  { left: 20, top: 30, w: 90, delay: 0 },
  { left: 66, top: 12, w: 110, delay: 2.4 },
  { left: 58, top: 88, w: 100, delay: 4.2 },
  { left: 8, top: 52, w: 70, delay: 6 },
];

const BG_STARS = [
  { left: 10, top: 9, size: 9, delay: 0 },
  { left: 33, top: 92, size: 8, delay: 1.1 },
  { left: 76, top: 6, size: 10, delay: 0.5 },
  { left: 93, top: 55, size: 8, delay: 1.9 },
];

function ReaderCat({ mood }: { mood: "idle" | "busy" | "happy" }) {
  return (
    <svg className="zts-cat h-24 w-28 shrink-0" viewBox="0 0 150 120" role="img" aria-label="Cat with glasses and a highlighter">
      <g className="zts-tail" style={{ transformOrigin: "112px 98px" }}>
        <path d="M108 100 C134 100 142 78 130 64" fill="none" stroke="#7dd3fc" strokeWidth="9" strokeLinecap="round" />
      </g>
      <ellipse cx="75" cy="102" rx="40" ry="17" fill="#bae6fd" />
      <g className="zts-head" style={{ transformOrigin: "75px 70px" }}>
        <path d="M44 52 L48 24 L68 40 Z" fill="#7dd3fc" />
        <path d="M106 52 L102 24 L82 40 Z" fill="#7dd3fc" />
        <path d="M50 44 L52 32 L61 40 Z" fill="#f0f9ff" />
        <path d="M100 44 L98 32 L89 40 Z" fill="#f0f9ff" />
        <ellipse cx="75" cy="64" rx="34" ry="29" fill="#bae6fd" />
        <ellipse cx="75" cy="73" rx="14" ry="10" fill="#f0f9ff" />
        <g className="zts-eyes" style={{ transformOrigin: "75px 62px" }}>
          {mood === "happy" ? (
            <>
              <path d="M54 62 Q60 54 66 62" fill="none" stroke="#0c4a6e" strokeWidth="3" strokeLinecap="round" />
              <path d="M84 62 Q90 54 96 62" fill="none" stroke="#0c4a6e" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="60" cy="62" rx="5" ry={mood === "busy" ? 3.2 : 6.5} fill="#0c4a6e" />
              <ellipse cx="90" cy="62" rx="5" ry={mood === "busy" ? 3.2 : 6.5} fill="#0c4a6e" />
              <circle cx="61.8" cy="60" r="1.7" fill="#fff" />
              <circle cx="91.8" cy="60" r="1.7" fill="#fff" />
            </>
          )}
        </g>
        <circle cx="60" cy="62" r="11" fill="none" stroke="#f59e0b" strokeWidth="2.2" />
        <circle cx="90" cy="62" r="11" fill="none" stroke="#f59e0b" strokeWidth="2.2" />
        <path d="M71 62 L79 62" stroke="#f59e0b" strokeWidth="2.2" />
        <path d="M72 70 L78 70 L75 74 Z" fill="#0369a1" />
        <path d="M75 74 Q70 79 66 76 M75 74 Q80 79 84 76" fill="none" stroke="#0c4a6e" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="46" cy="74" r="5.5" fill="#fda4af" opacity="0.55" />
        <circle cx="104" cy="74" r="5.5" fill="#fda4af" opacity="0.55" />
        <path d="M44 70 L28 66 M44 75 L28 77 M106 70 L122 66 M106 75 L122 77" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <g className="zts-pen" style={{ transformOrigin: "108px 100px" }}>
        <rect x="100" y="76" width="9" height="30" rx="3" transform="rotate(24 104 91)" fill="#fbbf24" />
        <rect x="96" y="102" width="9" height="7" rx="2" transform="rotate(24 100 105)" fill="#f59e0b" />
      </g>
      <ellipse cx="56" cy="108" rx="9" ry="6" fill="#f0f9ff" />
      <ellipse cx="96" cy="107" rx="9" ry="6" fill="#f0f9ff" />
    </svg>
  );
}

const GUIDE_LINKS: Array<{ slug: string; fallback: string }> = [
  { slug: "word-counter", fallback: "Word Counter" },
  { slug: "reading-time-calculator", fallback: "Reading Time Calculator" },
  { slug: "keyword-density", fallback: "Keyword Density Checker" },
  { slug: "ai-content-rewriter", fallback: "Content Rewriter" },
  { slug: "ai-grammar-checker", fallback: "Grammar Checker" },
  { slug: "ai-headline-generator", fallback: "Headline Generator" },
];

/* ------------------------------------------------------------------ component */

export default function TextSummarizer() {
  const { t } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;

  const [input, setInput] = useState("");
  const [percent, setPercent] = useState(30);
  const [format, setFormat] = useState<"paragraph" | "bullets">("bullets");
  const [tab, setTab] = useState<"summary" | "context">("summary");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const hasRun = useRef(false);

  const words = useMemo(() => wordCount(input), [input]);
  const tooLong = input.length > MAX_CHARS;

  const run = useCallback(
    (text: string, pct: number) => {
      if (!text.trim() || text.length > MAX_CHARS) return;
      setBusy(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setResult(summarise(text, pct));
        setBusy(false);
        hasRun.current = true;
      }, 380);
    },
    [],
  );

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  // after the first summary, changing the length re-runs it automatically
  useEffect(() => {
    if (hasRun.current && input.trim()) run(input, percent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent]);

  const summaryText = useMemo(() => {
    if (!result) return "";
    const chosen = result.sentences.filter((s) => result.picked.has(s.index));
    if (format === "bullets") return chosen.map((s) => `• ${s.text}`).join("\n");
    const paragraphs: string[] = [];
    let last = -1;
    for (const s of chosen) {
      if (s.block !== last && paragraphs.length > 0 && s.first) paragraphs.push("\n\n");
      else if (paragraphs.length > 0) paragraphs.push(" ");
      paragraphs.push(s.text);
      last = s.block;
    }
    return paragraphs.join("");
  }, [result, format]);

  const readMin = (n: number) => Math.max(1, Math.round(n / 220));
  const reduction = result && result.wordsIn > 0 ? Math.max(0, Math.round((1 - result.wordsOut / result.wordsIn) * 100)) : 0;
  const mood: "idle" | "busy" | "happy" = busy ? "busy" : result && !result.tooShort ? "happy" : "idle";
  const bubble = busy
    ? tr("tool.summarizer.catBusy", "Reading and picking the key sentences…")
    : result?.tooShort
      ? tr("tool.summarizer.catShort", "I need at least 3 sentences to work with.")
      : result
        ? tr("tool.summarizer.catDone", "Done! Here are the sentences that matter most.")
        : tr("tool.summarizer.catIdle", "Paste a long text and I'll boil it down!");

  const onCopy = async () => {
    if (!summaryText) return;
    if (await copyToClipboard(summaryText)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  const onDownload = () => {
    if (!summaryText) return;
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const paneBtn =
    "inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50";
  const tabCls = (active: boolean) =>
    `relative px-3 py-2 text-sm font-semibold transition ${active ? "text-sky-700 dark:text-sky-200" : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"}`;

  return (
    <div className="zts-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-8">
      <style>{`
        @keyframes zts-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,30px,0) scale(1.12); } }
        @keyframes zts-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-70px,-25px,0) scale(0.94); } }
        @keyframes zts-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zts-drift { 0%,100% { transform: translate3d(0,0,0) rotate(var(--r)); } 50% { transform: translate3d(14px,-26px,0) rotate(calc(var(--r) + 4deg)); } }
        @keyframes zts-condense { 0%,18% { transform: scaleY(1); opacity: 0.9; } 55%,80% { transform: scaleY(0.35); opacity: 0.45; } 100% { transform: scaleY(1); opacity: 0.9; } }
        @keyframes zts-mark { 0%,100% { opacity: 0; transform: scaleX(0); } 20%,70% { opacity: 0.75; transform: scaleX(1); } }
        @keyframes zts-twinkle { 0%,100% { opacity: 0.2; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes zts-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes zts-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
        @keyframes zts-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
        @keyframes zts-pen { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-9deg) translateY(-2px); } }
        @keyframes zts-blink { 0%,92%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes zts-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        @keyframes zts-shimmer { 0% { background-position: -240px 0; } 100% { background-position: 240px 0; } }
        .zts-blob { will-change: transform; }
        .zts-blob-a { animation: zts-blob-a 24s ease-in-out infinite; }
        .zts-blob-b { animation: zts-blob-b 30s ease-in-out infinite; }
        .zts-blob-c { animation: zts-blob-c 27s ease-in-out infinite; }
        .zts-sheet { position: absolute; animation: zts-drift ease-in-out infinite; }
        .zts-sheet i { display: block; height: 4px; margin: 6px 0; border-radius: 4px; background: currentColor; transform-origin: top; animation: zts-condense 9s ease-in-out infinite; }
        .zts-mark { position: absolute; height: 12px; border-radius: 4px; transform-origin: left; animation: zts-mark 8s ease-in-out infinite; }
        .zts-star { position: absolute; animation: zts-twinkle ease-in-out infinite; }
        .zts-rise { animation: zts-rise 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .zts-cat .zts-head { animation: zts-bob 4s ease-in-out infinite; }
        .zts-cat .zts-tail { animation: zts-tail 3s ease-in-out infinite; }
        .zts-cat .zts-pen { animation: zts-pen 2.6s ease-in-out infinite; }
        .zts-cat .zts-eyes { animation: zts-blink 5.5s ease-in-out infinite; }
        .zts-shine { position: relative; overflow: hidden; }
        .zts-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%); transform: translateX(-130%); animation: zts-shine 4.5s ease-in-out infinite; }
        .zts-skel { height: 14px; margin: 12px 0; border-radius: 7px; background: linear-gradient(90deg, rgba(14,165,233,0.12) 25%, rgba(14,165,233,0.28) 50%, rgba(14,165,233,0.12) 75%); background-size: 480px 100%; animation: zts-shimmer 1.1s linear infinite; }
        .zts-range { accent-color: #0284c7; }
        .zts-hl { background: linear-gradient(transparent 12%, rgba(251,191,36,0.55) 12%, rgba(251,191,36,0.55) 92%, transparent 92%); border-radius: 3px; padding: 0 1px; }
        .dark .zts-hl { background: linear-gradient(transparent 12%, rgba(251,191,36,0.32) 12%, rgba(251,191,36,0.32) 92%, transparent 92%); }
        @media (prefers-reduced-motion: reduce) {
          .zts-blob, .zts-sheet, .zts-sheet i, .zts-mark, .zts-star, .zts-rise, .zts-cat *, .zts-shine::after, .zts-skel { animation: none !important; }
          .zts-mark { opacity: 0.5; }
        }
      `}</style>

      {/* animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-cyan-50 to-amber-50 dark:from-slate-950 dark:via-sky-950/70 dark:to-slate-900" />
        <div className="zts-blob zts-blob-a absolute -left-24 -top-20 h-96 w-[34rem] rounded-full bg-gradient-to-r from-sky-300/55 to-cyan-200/40 blur-3xl dark:from-sky-500/25 dark:to-cyan-500/15" />
        <div className="zts-blob zts-blob-b absolute -right-28 top-1/4 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-amber-200/60 to-orange-200/40 blur-3xl dark:from-amber-400/15 dark:to-orange-500/15" />
        <div className="zts-blob zts-blob-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-indigo-200/55 to-sky-200/40 blur-3xl dark:from-indigo-500/20 dark:to-sky-500/15" />
        {BG_SHEETS.map((s, i) => (
          <div
            key={`sheet-${i}`}
            className="zts-sheet rounded-md border border-sky-200/70 bg-white/55 p-2 text-sky-300/80 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-sky-200/30"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.w, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`, "--r": `${(i % 2 ? 1 : -1) * (5 + i * 2)}deg` } as CSSProperties}
          >
            <i style={{ width: "100%", animationDelay: `${s.delay}s` }} />
            <i style={{ width: "86%", animationDelay: `${s.delay}s` }} />
            <i style={{ width: "94%", animationDelay: `${s.delay}s` }} />
            <i style={{ width: "58%", animationDelay: `${s.delay}s` }} />
          </div>
        ))}
        {BG_MARKS.map((m, i) => (
          <span
            key={`mark-${i}`}
            className="zts-mark bg-amber-300/70 dark:bg-amber-300/25"
            style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.w, animationDelay: `${m.delay}s` } as CSSProperties}
          />
        ))}
        {BG_STARS.map((s, i) => (
          <svg
            key={`star-${i}`}
            className="zts-star text-amber-300 dark:text-yellow-100"
            viewBox="0 0 24 24"
            width={s.size}
            height={s.size}
            fill="currentColor"
            style={{ left: `${s.left}%`, top: `${s.top}%`, animationDuration: `${3 + (i % 3)}s`, animationDelay: `${s.delay}s` } as CSSProperties}
          >
            <path d="M12 1 L14 9.5 L23 12 L14 14.5 L12 23 L10 14.5 L1 12 L10 9.5 Z" />
          </svg>
        ))}
      </div>

      {/* mascot */}
      <div className="mb-3 flex items-end gap-3 px-1">
        <div className="relative mb-4 max-w-xs rounded-2xl rounded-bl-sm border border-sky-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-sky-900 shadow-sm dark:border-sky-300/20 dark:bg-slate-900/80 dark:text-sky-100">
          {bubble}
        </div>
        <ReaderCat mood={mood} />
      </div>

      <section className="overflow-visible rounded-3xl border border-white/80 bg-white/80 shadow-[0_28px_70px_-34px_rgba(3,105,161,0.5)] ring-1 ring-sky-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:ring-sky-300/10">
        {/* controls */}
        <div className="grid gap-4 border-b border-sky-100 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6 dark:border-white/10">
          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label htmlFor="sum-length" className="text-xs font-bold text-ink-700 dark:text-ink-200">
                {tr("tool.summarizer.length", "Summary length")}
              </label>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-400/20 dark:text-sky-100">{percent}%</span>
            </div>
            <input
              id="sum-length"
              type="range"
              min={10}
              max={60}
              step={5}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="zts-range w-full"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-ink-400">
              <span>{tr("tool.summarizer.lengthShort", "Shorter")}</span>
              <span>{tr("tool.summarizer.lengthLong", "Longer")}</span>
            </div>
          </div>
          <div role="radiogroup" aria-label={tr("tool.summarizer.format", "Format")} className="flex items-end gap-1.5">
            {(
              [
                ["bullets", tr("tool.summarizer.formatBullets", "Bullet points")],
                ["paragraph", tr("tool.summarizer.formatParagraph", "Paragraph")],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={format === id}
                onClick={() => setFormat(id)}
                className={`${paneBtn} ${format === id ? "border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/30" : "border-sky-200 bg-white/80 text-sky-800 hover:bg-sky-50 dark:border-sky-900/60 dark:bg-slate-900/60 dark:text-sky-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2">
          {/* input */}
          <div className="flex min-h-[26rem] flex-col border-b border-sky-100 md:border-b-0 md:border-r dark:border-white/10">
            <div className="relative flex-1 p-4 sm:p-6">
              <label htmlFor="sum-input" className="sr-only">
                {tr("tool.summarizer.inputLabel", "Text to summarize")}
              </label>
              <textarea
                id="sum-input"
                dir="auto"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run(input, percent);
                }}
                placeholder={tr("tool.summarizer.placeholder", "Paste an article, essay or report here…")}
                className="box-border h-full min-h-[20rem] w-full resize-none bg-transparent pr-8 font-sans text-base leading-7 text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-100"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    setResult(null);
                    hasRun.current = false;
                  }}
                  aria-label={tr("tool.summarizer.clear", "Clear")}
                  className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 sm:right-6 sm:top-6 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              {!input && (
                <button
                  type="button"
                  onClick={() => setInput(SAMPLE)}
                  className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-50 sm:left-6 dark:border-sky-800 dark:bg-slate-900/80 dark:text-sky-200"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr("tool.summarizer.example", "Try an example")}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 px-4 pb-4 sm:px-6 sm:pb-6">
              <span className={`text-sm font-semibold ${tooLong ? "text-rose-600" : "text-ink-500 dark:text-ink-400"}`}>
                {tooLong
                  ? tr("tool.summarizer.tooLong", "Limit: {{limit}} characters", { limit: MAX_CHARS.toLocaleString() })
                  : tr("tool.summarizer.words", "{{n}} Words", { n: words.toLocaleString() })}
              </span>
              <button
                type="button"
                onClick={() => run(input, percent)}
                disabled={!input.trim() || tooLong || busy}
                className="zts-shine inline-flex min-w-[9rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
                {busy
                  ? tr("tool.summarizer.summarizing", "Summarizing…")
                  : result
                    ? tr("tool.summarizer.summarizeAgain", "Summarize again")
                    : tr("tool.summarizer.summarize", "Summarize")}
              </button>
            </div>
          </div>

          {/* output */}
          <div className="flex min-h-[26rem] flex-col">
            <div className="flex items-end gap-2 border-b border-sky-100 px-4 pt-3 sm:px-6 dark:border-white/10" role="tablist">
              {(
                [
                  ["summary", tr("tool.summarizer.tabSummary", "Summary")],
                  ["context", tr("tool.summarizer.tabContext", "In context")],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={tabCls(tab === id)}>
                  {label}
                  {tab === id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-sky-500 to-teal-400" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6" aria-live="polite">
              {busy ? (
                <div aria-hidden="true">
                  <div className="zts-skel" style={{ width: "92%" }} />
                  <div className="zts-skel" style={{ width: "78%" }} />
                  <div className="zts-skel" style={{ width: "88%" }} />
                  <div className="zts-skel" style={{ width: "54%" }} />
                </div>
              ) : !result ? (
                <p className="text-base leading-7 text-ink-400">{tr("tool.summarizer.outputPlaceholder", "Your summary will appear here.")}</p>
              ) : result.tooShort ? (
                <p className="zts-rise rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                  {tr("tool.summarizer.tooShort", "This text is too short to summarize. Paste at least three sentences.")}
                </p>
              ) : tab === "summary" ? (
                format === "bullets" ? (
                  <ul dir="auto" className="space-y-2.5 text-base leading-7 text-ink-900 dark:text-ink-100">
                    {result.sentences
                      .filter((s) => result.picked.has(s.index))
                      .map((s, i) => (
                        <li key={s.index} className="zts-rise flex gap-2.5" style={{ animationDelay: `${i * 60}ms` } as CSSProperties}>
                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden="true" />
                          <span>{s.text}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p dir="auto" className="zts-rise whitespace-pre-line text-base leading-7 text-ink-900 dark:text-ink-100">
                    {summaryText}
                  </p>
                )
              ) : (
                <div dir="auto" className="zts-rise space-y-3 text-sm leading-7 text-ink-700 dark:text-ink-200">
                  <p className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                    {tr("tool.summarizer.contextHint", "Highlighted sentences are the ones used in your summary.")}
                  </p>
                  {(() => {
                    const groups = new Map<number, Sentence[]>();
                    result.sentences.forEach((s) => groups.set(s.block, [...(groups.get(s.block) ?? []), s]));
                    return [...groups.entries()].map(([block, list]) => (
                      <p key={block}>
                        {list.map((s) => (
                          <span key={s.index} className={result.picked.has(s.index) ? "zts-hl" : ""}>
                            {s.text}{" "}
                          </span>
                        ))}
                      </p>
                    ));
                  })()}
                </div>
              )}

              {result && !result.tooShort && !busy && result.keyPhrases.length > 0 && (
                <div className="mt-5 border-t border-sky-100 pt-4 dark:border-white/10">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">{tr("tool.summarizer.keyPhrases", "Key phrases")}</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {result.keyPhrases.map((k) => (
                      <li key={k} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100">
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 px-4 py-3 sm:px-6 dark:border-white/10">
              <span className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                {result && !result.tooShort && !busy
                  ? tr("tool.summarizer.stats", "{{from}} → {{to}} words · {{pct}}% shorter · ~{{min}} min read", {
                      from: result.wordsIn.toLocaleString(),
                      to: result.wordsOut.toLocaleString(),
                      pct: reduction,
                      min: readMin(result.wordsOut),
                    })
                  : ""}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDownload}
                  disabled={!summaryText || result?.tooShort}
                  className={`${paneBtn} border-sky-200 bg-white/80 text-sky-800 hover:bg-sky-50 dark:border-sky-900/60 dark:bg-slate-900/60 dark:text-sky-100`}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr("tool.summarizer.download", "Download")}
                </button>
                <button
                  type="button"
                  onClick={onCopy}
                  disabled={!summaryText || result?.tooShort}
                  className={`${paneBtn} border-transparent bg-sky-600 text-white shadow-md shadow-sky-500/30 hover:bg-sky-700`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                  {copied ? tr("tool.summarizer.copied", "Copied") : tr("tool.summarizer.copy", "Copy")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-relaxed text-ink-500 dark:text-ink-400">
        {tr("tool.summarizer.disclaimer", "This tool picks the most important sentences from your text. It does not write new sentences or understand meaning, so always check the result. It runs in your browser and nothing is sent or saved.")}
      </p>

      {/* guide: unique, useful content for readers and search engines */}
      <article className="mt-8 rounded-3xl border border-white/80 bg-white/70 p-5 sm:p-8 ring-1 ring-sky-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:ring-sky-300/10">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-2xl">{tr("tool.summarizer.guideTitle", "How to summarize a text online")}</h2>
        <p className="mt-3 text-sm leading-7 text-ink-700 dark:text-ink-300">
          {tr("tool.summarizer.guideIntro", "This free text summarizer shortens articles, essays, reports and study notes into the sentences that matter most. Paste your text, choose how short you want the summary, and read it as bullet points or as a paragraph.")}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.summarizer.howTitle", "How the summarizer works")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.summarizer.howText", "It uses extractive summarization. The tool counts the important words in your text, scores every sentence by how many of them it contains, favours the opening sentences, removes near-duplicates, and returns the best sentences in their original order. Because it only selects sentences you already wrote, the wording stays accurate.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.summarizer.tipsTitle", "Tips for a better summary")}</h3>
            <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm leading-7 text-ink-700 dark:text-ink-300">
              <li>{tr("tool.summarizer.tip1", "Paste clean text without menus, ads or comments.")}</li>
              <li>{tr("tool.summarizer.tip2", "Use 10–20% for a quick overview and 40–60% when you need more detail.")}</li>
              <li>{tr("tool.summarizer.tip3", "Switch to “In context” to see where each sentence came from.")}</li>
              <li>{tr("tool.summarizer.tip4", "Texts of at least a few paragraphs work best.")}</li>
            </ul>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.summarizer.whoTitle", "Who is it for?")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.summarizer.whoText", "Students who need a quick view of a chapter, writers drafting an abstract, researchers skimming sources, and anyone with a long email or report and little time. It works with English, French, Spanish, German, Italian and Arabic text.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.summarizer.linksTitle", "More free writing tools")}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {GUIDE_LINKS.map((l) => (
                <li key={l.slug}>
                  <Link
                    to={`/tools/${l.slug}`}
                    className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100"
                  >
                    {tr(`tool.${l.slug}.name`, l.fallback)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </div>
  );
}
