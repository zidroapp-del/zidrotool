import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Clock, Copy, FileText, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";

/* ------------------------------------------------------------------ engine
 * Everything is counted in the browser. Words use Intl.Segmenter when the browser
 * has it (so Chinese and Japanese are split into words), otherwise a Unicode regex.
 * Characters are counted as Unicode code points, so an emoji counts as one.
 */

const MAX_CHARS = 1000000;
const STORE = "zidrotool-word-counter-v1";
const READ_WPM = 238;
const SPEAK_WPM = 150;

type Unit = "chars" | "words";
interface LimitDef {
  id: string;
  key: string;
  fb: string;
  max: number;
  unit: Unit;
}

const LIMITS: LimitDef[] = [
  { id: "x", key: "tool.wordcounter.pTweet", fb: "Post on X", max: 280, unit: "chars" },
  { id: "insta", key: "tool.wordcounter.pInsta", fb: "Instagram caption", max: 2200, unit: "chars" },
  { id: "linkedin", key: "tool.wordcounter.pLinkedin", fb: "LinkedIn post", max: 3000, unit: "chars" },
  { id: "meta", key: "tool.wordcounter.pMeta", fb: "Meta description", max: 160, unit: "chars" },
  { id: "title", key: "tool.wordcounter.pTitle", fb: "SEO title", max: 60, unit: "chars" },
  { id: "sms", key: "tool.wordcounter.pSms", fb: "SMS (one message)", max: 160, unit: "chars" },
  { id: "yttitle", key: "tool.wordcounter.pYtTitle", fb: "YouTube title", max: 100, unit: "chars" },
  { id: "ytdesc", key: "tool.wordcounter.pYtDesc", fb: "YouTube description", max: 5000, unit: "chars" },
  { id: "essay", key: "tool.wordcounter.pEssay", fb: "Essay (500 words)", max: 500, unit: "words" },
];

const STOP = new Set(
  (
    "a an and are as at be but by for from has have he her his i in is it its me my not of on or our she so that the their them they this to us was we were what when which who will with you your " +
    "au aux ce ces dans de des du elle en et il ils je la le les leur mais ne nous ou par pas pour que qui sur un une vous " +
    "al como con del el ella en es la las lo los más para por pero que se su sus un una y " +
    "der die das und ist nicht ein eine mit von zu auf den dem des im ich sie wir es " +
    "che con di è il in la le un una per non si ma"
  ).split(" "),
);

const SAMPLE =
  "A word counter tells you how long a text is. Writers use a word counter to meet an essay target, editors use it to keep articles inside a budget, and marketers use it to fit a caption, a title or a meta description inside a limit.\n\n" +
  "Counting words is simple, but the details matter. A hyphenated word such as well-known is one word, and a number such as 2,500 is one word too. Characters are counted with and without spaces, because some forms count the spaces and some do not.\n\n" +
  "Good writing is not only about length. If one word appears again and again, readers notice, and so do search engines. The list of most used words below the counter helps you spot a word that you repeat too often.";

const WORD_RE = /\p{N}+(?:[.,:]\p{N}+)*[\p{L}\p{N}'’-]*|\p{L}[\p{L}\p{N}'’-]*/gu;
const ASIAN_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u;

function segWords(text: string): number {
  if (!text.trim()) return 0;
  if (ASIAN_RE.test(text)) {
    const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => { segment: (s: string) => Iterable<{ isWordLike?: boolean }> } }).Segmenter;
    if (Seg) {
      try {
        let n = 0;
        for (const s of new Seg(undefined, { granularity: "word" }).segment(text)) if (s.isWordLike) n++;
        return n;
      } catch {
        /* fall through */
      }
    }
  }
  return (text.match(WORD_RE) ?? []).length;
}

function fmtTime(sec: number, u: { h: string; m: string; s: string }): string {
  const total = Math.max(0, Math.round(sec));
  if (total < 60) return `${total} ${u.s}`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h} ${u.h} ${m} ${u.m}`;
  return s > 0 && m < 10 ? `${m} ${u.m} ${s} ${u.s}` : `${m} ${u.m}`;
}

function analyse(text: string) {
  const words = segWords(text);
  const chars = Array.from(text).length;
  const charsNo = Array.from(text.replace(/\s/g, "")).length;
  const tokens = (text.toLowerCase().match(WORD_RE) ?? []).map((w) => w.replace(/^['’-]+|['’-]+$/g, "")).filter(Boolean);
  const sentences = (text.match(/[^.!?؟。！？\n]+[.!?؟。！？]*/g) ?? []).filter((x) => /[\p{L}\p{N}]/u.test(x)).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  let longest = "";
  let letters = 0;
  for (const w of tokens) {
    letters += Array.from(w).length;
    if (Array.from(w).length > Array.from(longest).length) longest = w;
  }
  return {
    words,
    chars,
    charsNo,
    sentences,
    paragraphs,
    lines,
    tokens,
    unique: new Set(tokens).size,
    longest,
    avgWord: tokens.length ? Math.round((letters / tokens.length) * 10) / 10 : 0,
    avgSentence: sentences ? Math.round((words / sentences) * 10) / 10 : 0,
  };
}

function topPhrases(tokens: string[], n: 1 | 2 | 3, ignore: boolean) {
  const map = new Map<string, number>();
  for (let i = 0; i + n <= tokens.length; i++) {
    const g = tokens.slice(i, i + n);
    if (ignore) {
      if (n === 1 && (STOP.has(g[0]) || g[0].length < 2)) continue;
      if (n > 1 && (STOP.has(g[0]) || STOP.has(g[n - 1]))) continue;
    }
    const k = g.join(" ");
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const total = Math.max(1, tokens.length - n + 1);
  return [...map.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, c]) => ({ k, c, pct: Math.round((c / total) * 1000) / 10 }));
}

const BG_TALLY = [
  { left: 6, top: 14, delay: 0 },
  { left: 20, top: 70, delay: 2 },
  { left: 38, top: 9, delay: 4 },
  { left: 58, top: 84, delay: 1 },
  { left: 74, top: 16, delay: 3 },
  { left: 88, top: 62, delay: 5 },
];

const BG_CHIPS = [
  { text: "1,284 words", left: 4, top: 42, dur: 25, delay: -4 },
  { text: "280", left: 76, top: 34, dur: 28, delay: -12 },
  { text: "Aa", left: 46, top: 76, dur: 26, delay: -17 },
  { text: "¶", left: 86, top: 82, dur: 30, delay: -7 },
  { text: "160 / 160", left: 22, top: 90, dur: 27, delay: -2 },
  { text: "#", left: 62, top: 6, dur: 29, delay: -9 },
];

type Mood = "idle" | "typing" | "done" | "over";

function ClickerCat({ mood, count }: { mood: Mood; count: number }) {
  const shown = String(Math.min(count, 9999));
  return (
    <svg viewBox="0 0 150 120" className="zwc-cat h-24 w-28 shrink-0" role="img" aria-label="Cat with a tally counter">
      <g className="zwc-tail" style={{ transformOrigin: "112px 100px" }}>
        <path d="M108 102 C134 102 142 80 130 66" fill="none" stroke="#6ee7b7" strokeWidth="9" strokeLinecap="round" />
      </g>
      <ellipse cx="75" cy="104" rx="40" ry="16" fill="#a7f3d0" />
      <g className="zwc-head" style={{ transformOrigin: "75px 70px" }}>
        <path d="M44 52 L48 24 L68 40 Z" fill="#6ee7b7" />
        <path d="M106 52 L102 24 L82 40 Z" fill="#6ee7b7" />
        <path d="M50 44 L52 32 L61 40 Z" fill="#ecfdf5" />
        <path d="M100 44 L98 32 L89 40 Z" fill="#ecfdf5" />
        <ellipse cx="75" cy="64" rx="34" ry="29" fill="#a7f3d0" />
        <ellipse cx="75" cy="74" rx="13" ry="9" fill="#ecfdf5" />
        <g className="zwc-eyes">
          {mood === "done" ? (
            <>
              <path d="M54 62 Q60 54 66 62" fill="none" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" />
              <path d="M84 62 Q90 54 96 62" fill="none" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="60" cy="62" r="5.2" fill="#064e3b" />
              <circle cx="90" cy="62" r="5.2" fill="#064e3b" />
              <circle cx="61.8" cy="60.2" r="1.7" fill="#fff" />
              <circle cx="91.8" cy="60.2" r="1.7" fill="#fff" />
            </>
          )}
        </g>
        {mood === "over" && (
          <>
            <path d="M52 52 L66 55" stroke="#064e3b" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M98 52 L84 55" stroke="#064e3b" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M108 44 q4 7 0 10 q-4 -3 0 -10z" fill="#7dd3fc" />
          </>
        )}
        <path d="M72 71 L78 71 L75 75 Z" fill="#10b981" />
        {mood === "over" ? (
          <path d="M69 80 Q75 75 81 80" fill="none" stroke="#064e3b" strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <path d="M75 75 Q70 80 66 77 M75 75 Q80 80 84 77" fill="none" stroke="#064e3b" strokeWidth="1.8" strokeLinecap="round" />
        )}
        <circle cx="46" cy="76" r="5.5" fill="#fda4af" opacity="0.55" />
        <circle cx="104" cy="76" r="5.5" fill="#fda4af" opacity="0.55" />
      </g>
      <g>
        <rect x="52" y="92" width="46" height="24" rx="6" fill="#064e3b" />
        <rect x="57" y="96" width="36" height="11" rx="3" fill="#d1fae5" />
        <text x="75" y="105" textAnchor="middle" fontSize="9" fontWeight="800" fontFamily="ui-monospace, monospace" fill="#065f46">{shown}</text>
        <circle className="zwc-btn" cx="75" cy="112" r="3" fill="#34d399" style={{ transformOrigin: "75px 112px" }} />
      </g>
      <ellipse className="zwc-paw" cx="48" cy="106" rx="9" ry="6" fill="#ecfdf5" />
      <ellipse className="zwc-paw2" cx="102" cy="106" rx="9" ry="6" fill="#ecfdf5" />
    </svg>
  );
}

export default function WordCounter({ initial }: { initial?: { limit?: string; primary?: "chars" | "words" } }) {
  const { t, i18n } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;
  const lang = i18n?.language || "en";
  const nf = useMemo(() => new Intl.NumberFormat(lang), [lang]);
  const units = { h: tr("tool.wordcounter.uHour", "h"), m: tr("tool.wordcounter.uMin", "min"), s: tr("tool.wordcounter.uSec", "s") };

  const [text, setText] = useState("");
  const [limitId, setLimitId] = useState<string>(initial?.limit ?? "none");
  const [customMax, setCustomMax] = useState(500);
  const [customUnit, setCustomUnit] = useState<Unit>("words");
  const [ignore, setIgnore] = useState(true);
  const [gram, setGram] = useState<1 | 2 | 3>(1);
  const [typing, setTyping] = useState(false);
  const [copied, setCopied] = useState("");
  const [msg, setMsg] = useState("");
  const [drag, setDrag] = useState(false);
  const typingTimer = useRef<number | undefined>(undefined);
  const copyTimer = useRef<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = initial ? null : localStorage.getItem(STORE);
      if (raw) {
        const v = JSON.parse(raw) as { limitId?: string; customMax?: number; customUnit?: Unit; ignore?: boolean; gram?: number };
        if (typeof v.limitId === "string") setLimitId(v.limitId);
        if (typeof v.customMax === "number") setCustomMax(Math.min(1000000, Math.max(1, v.customMax)));
        if (v.customUnit === "chars" || v.customUnit === "words") setCustomUnit(v.customUnit);
        if (typeof v.ignore === "boolean") setIgnore(v.ignore);
        if (v.gram === 1 || v.gram === 2 || v.gram === 3) setGram(v.gram);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (initial) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ limitId, customMax, customUnit, ignore, gram }));
    } catch {
      /* ignore */
    }
  }, [initial, limitId, customMax, customUnit, ignore, gram]);
  useEffect(
    () => () => {
      window.clearTimeout(typingTimer.current);
      window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const [deferred, setDeferred] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setDeferred(text), 100);
    return () => window.clearTimeout(id);
  }, [text]);
  const a = useMemo(() => analyse(deferred), [deferred]);
  const phrases = useMemo(() => topPhrases(a.tokens, gram, ignore), [a.tokens, gram, ignore]);
  const hasText = a.words > 0;

  const limit: { max: number; unit: Unit } | null =
    limitId === "none" ? null : limitId === "custom" ? { max: customMax, unit: customUnit } : (() => { const l = LIMITS.find((x) => x.id === limitId); return l ? { max: l.max, unit: l.unit } : null; })();
  const used = limit ? (limit.unit === "chars" ? a.chars : a.words) : 0;
  const over = limit ? used > limit.max : false;
  const mood: Mood = over ? "over" : typing ? "typing" : hasText ? "done" : "idle";

  const onType = (v: string) => {
    setText(v.slice(0, MAX_CHARS));
    setTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTyping(false), 1100);
  };

  const readFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 3 * 1024 * 1024 || !/^text\/|\.(txt|md|markdown|csv|html?)$/i.test(f.type + f.name)) {
      setMsg(tr("tool.wordcounter.errFile", "Only text files up to 3 MB can be opened (.txt, .md, .html)."));
      return;
    }
    setMsg("");
    onType(await f.text());
  };

  const paste = async () => {
    try {
      const v = await navigator.clipboard.readText();
      if (v) onType(v);
    } catch {
      setMsg(tr("tool.wordcounter.errPaste", "Your browser did not allow pasting. Press Ctrl+V in the box instead."));
    }
  };

  const copy = async (id: string, value: string) => {
    await copyToClipboard(value);
    setCopied(id);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(""), 1600);
  };

  const L = {
    words: tr("tool.wordcounter.sWords", "Words"),
    chars: tr("tool.wordcounter.sChars", "Characters"),
    charsNo: tr("tool.wordcounter.sCharsNo", "No spaces"),
    sentences: tr("tool.wordcounter.sSentences", "Sentences"),
    paras: tr("tool.wordcounter.sParas", "Paragraphs"),
    lines: tr("tool.wordcounter.sLines", "Lines"),
    unique: tr("tool.wordcounter.sUnique", "Unique words"),
    avgWord: tr("tool.wordcounter.sAvgWord", "Avg. word length"),
    longest: tr("tool.wordcounter.sLongest", "Longest word"),
    avgSentence: tr("tool.wordcounter.sAvgSentence", "Words / sentence"),
    read: tr("tool.wordcounter.sRead", "Reading time"),
    speak: tr("tool.wordcounter.sSpeak", "Speaking time"),
  };
  const unitName = (u: Unit) => (u === "chars" ? tr("tool.wordcounter.charsLower", "characters") : tr("tool.wordcounter.wordsLower", "words"));

  const summary = [
    `${L.words}: ${nf.format(a.words)}`,
    `${L.chars}: ${nf.format(a.chars)}`,
    `${L.charsNo}: ${nf.format(a.charsNo)}`,
    `${L.sentences}: ${nf.format(a.sentences)}`,
    `${L.paras}: ${nf.format(a.paragraphs)}`,
    `${L.read}: ${fmtTime((a.words / READ_WPM) * 60, units)}`,
  ].join(" · ");

  const bubble = over
    ? tr("tool.wordcounter.catOver", "That is over your limit!")
    : typing
      ? tr("tool.wordcounter.catTyping", "Counting…")
      : hasText
        ? tr("tool.wordcounter.catDone", "{{n}} words so far!", { n: nf.format(a.words) })
        : tr("tool.wordcounter.catIdle", "Type or paste and I'll count!");

  const card =
    "rounded-3xl border border-white/80 bg-white/75 shadow-[0_24px_60px_-30px_rgba(5,150,105,0.5)] ring-1 ring-emerald-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:ring-emerald-300/10";
  const btn2 =
    "inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white/85 px-3 py-2 text-xs font-bold text-emerald-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900/60 dark:bg-slate-900/60 dark:text-emerald-100";
  const chip = (active: boolean) =>
    `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-500/30" : "border-emerald-200 bg-white/80 text-emerald-900 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-900/60 dark:text-emerald-100"}`;

  const big: [string, string, string][] = initial?.primary === "chars"
    ? [["chars", L.chars, nf.format(a.chars)], ["words", L.words, nf.format(a.words)], ["charsNo", L.charsNo, nf.format(a.charsNo)], ["sentences", L.sentences, nf.format(a.sentences)]]
    : [["words", L.words, nf.format(a.words)], ["chars", L.chars, nf.format(a.chars)], ["sentences", L.sentences, nf.format(a.sentences)], ["paras", L.paras, nf.format(a.paragraphs)]];

  const small: [string, string][] = [
    [L.charsNo, nf.format(a.charsNo)],
    [L.lines, nf.format(a.lines)],
    [L.unique, nf.format(a.unique)],
    [L.avgWord, a.avgWord ? String(a.avgWord) : "—"],
    [L.longest, a.longest || "—"],
    [L.avgSentence, a.avgSentence ? String(a.avgSentence) : "—"],
    [L.read, hasText ? fmtTime((a.words / READ_WPM) * 60, units) : "—"],
    [L.speak, hasText ? fmtTime((a.words / SPEAK_WPM) * 60, units) : "—"],
  ];

  const pct = limit ? Math.min(100, (used / limit.max) * 100) : 0;
  const left = limit ? limit.max - used : 0;
  const maxK = phrases[0]?.c ?? 1;

  return (
    <div className="zwc-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-8">
      <style>{`
        @keyframes zwc-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,30px,0) scale(1.12); } }
        @keyframes zwc-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-70px,-25px,0) scale(0.94); } }
        @keyframes zwc-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zwc-float { 0%,100% { transform: translate3d(0,0,0) rotate(-6deg); opacity: 0.8; } 50% { transform: translate3d(14px,-26px,0) rotate(8deg); opacity: 0.4; } }
        @keyframes zwc-chip { 0%,100% { transform: translate3d(0,0,0); opacity: 0.5; } 50% { transform: translate3d(20px,-24px,0); opacity: 0.95; } }
        @keyframes zwc-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes zwc-march { to { stroke-dashoffset: -28; } }
        @keyframes zwc-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes zwc-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(9deg); } }
        @keyframes zwc-look { 0%,100% { transform: translateY(0); } 50% { transform: translateY(1.5px); } }
        @keyframes zwc-tap { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes zwc-press { 0%,100% { transform: scale(1); } 50% { transform: scale(0.6); } }
        @keyframes zwc-pop { from { transform: scale(0.88); opacity: 0.4; } to { transform: scale(1); opacity: 1; } }
        @keyframes zwc-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        @keyframes zwc-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .zwc-blob { will-change: transform; }
        .zwc-blob-a { animation: zwc-blob-a 24s ease-in-out infinite; }
        .zwc-blob-b { animation: zwc-blob-b 30s ease-in-out infinite; }
        .zwc-blob-c { animation: zwc-blob-c 27s ease-in-out infinite; }
        .zwc-tally { position: absolute; width: 38px; height: 26px; border-radius: 3px; animation: zwc-float 11s ease-in-out infinite;
          background:
            linear-gradient(120deg, transparent 46%, rgba(16,185,129,0.55) 46% 54%, transparent 54%),
            repeating-linear-gradient(90deg, rgba(16,185,129,0.55) 0 3px, transparent 3px 8px); }
        .zwc-chip { position: absolute; white-space: nowrap; animation: zwc-chip ease-in-out infinite; }
        .zwc-rise { animation: zwc-rise 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .zwc-box rect { animation: zwc-march 1.6s linear infinite; }
        .zwc-cat .zwc-head { animation: zwc-bob 3.6s ease-in-out infinite; }
        .zwc-cat .zwc-tail { animation: zwc-tail 2.6s ease-in-out infinite; }
        .zwc-cat .zwc-eyes { animation: zwc-look 3s ease-in-out infinite; }
        .zwc-cat.zwc-active .zwc-paw { animation: zwc-tap 0.5s ease-in-out infinite; }
        .zwc-cat.zwc-active .zwc-paw2 { animation: zwc-tap 0.5s ease-in-out 0.25s infinite; }
        .zwc-cat.zwc-active .zwc-btn { animation: zwc-press 0.5s ease-in-out infinite; }
        .zwc-num { display: inline-block; animation: zwc-pop 0.25s ease-out both; }
        .zwc-bar { transition: width 0.5s cubic-bezier(0.16,1,0.3,1), background-color 0.3s; }
        .zwc-seg { transform-origin: left center; animation: zwc-grow 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .zwc-shine { position: relative; overflow: hidden; }
        .zwc-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%); transform: translateX(-130%); animation: zwc-shine 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .zwc-blob, .zwc-tally, .zwc-chip, .zwc-rise, .zwc-box rect, .zwc-cat *, .zwc-num, .zwc-shine::after, .zwc-seg { animation: none !important; }
          .zwc-bar { transition: none; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-lime-50 dark:from-slate-950 dark:via-emerald-950/60 dark:to-slate-900" />
        <div className="zwc-blob zwc-blob-a absolute -left-24 -top-24 h-96 w-[34rem] rounded-full bg-gradient-to-r from-emerald-300/55 to-teal-200/40 blur-3xl dark:from-emerald-500/25 dark:to-teal-500/15" />
        <div className="zwc-blob zwc-blob-b absolute -right-28 top-1/3 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-lime-200/60 to-sky-200/40 blur-3xl dark:from-lime-400/15 dark:to-sky-500/15" />
        <div className="zwc-blob zwc-blob-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-teal-200/55 to-emerald-200/40 blur-3xl dark:from-teal-500/20 dark:to-emerald-500/15" />
        {BG_TALLY.map((p, i) => (
          <span key={`t-${i}`} className="zwc-tally" style={{ left: `${p.left}%`, top: `${p.top}%`, animationDelay: `${p.delay}s` } as CSSProperties} />
        ))}
        {BG_CHIPS.map((g, i) => (
          <span
            key={`c-${i}`}
            className="zwc-chip rounded-full border border-emerald-200/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-emerald-800/80 dark:border-white/10 dark:bg-white/5 dark:text-emerald-200/60"
            style={{ left: `${g.left}%`, top: `${g.top}%`, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` } as CSSProperties}
          >
            {g.text}
          </span>
        ))}
      </div>

      {/* mascot */}
      <div className="mb-2 flex items-end gap-3 px-1">
        <div className="relative mb-4 max-w-xs rounded-2xl rounded-bl-sm border border-emerald-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-emerald-950 shadow-sm dark:border-emerald-300/20 dark:bg-slate-900/80 dark:text-emerald-100">{bubble}</div>
        <div className={typing ? "zwc-cat zwc-active" : "zwc-cat"}>
          <ClickerCat mood={mood} count={a.words} />
        </div>
      </div>

      {/* input */}
      <section
        className={`${card} p-3 sm:p-5`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void readFile(e.dataTransfer.files[0]);
        }}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="wc-text" className="text-xs font-bold text-ink-700 dark:text-ink-200">
            {tr("tool.wordcounter.inputLabel", "Type or paste your text")}
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={paste} className={btn2}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {tr("tool.wordcounter.paste", "Paste")}
            </button>
            <button type="button" onClick={() => onType(SAMPLE)} className={btn2}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {tr("tool.wordcounter.example", "Try an example")}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={btn2}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              {tr("tool.wordcounter.openFile", "Open a .txt file")}
            </button>
            <button type="button" onClick={() => { setText(""); setMsg(""); }} disabled={!text} className={btn2}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {tr("tool.wordcounter.clear", "Clear")}
            </button>
            <input ref={fileRef} type="file" accept=".txt,.md,.markdown,.csv,.html,.htm,text/*" className="sr-only" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </div>
        <div className={`zwc-box relative rounded-2xl p-1 transition ${drag ? "bg-emerald-100/80 dark:bg-emerald-400/10" : ""}`}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <rect x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="16" fill="none" strokeWidth="2" strokeDasharray="10 8" className={drag ? "stroke-emerald-500" : "stroke-emerald-300/80 dark:stroke-emerald-300/40"} />
          </svg>
          <textarea
            id="wc-text"
            value={text}
            onChange={(e) => onType(e.target.value)}
            placeholder={tr("tool.wordcounter.placeholder", "Start typing, paste your text, or drop a text file here…")}
            rows={10}
            spellCheck={false}
            className="box-border block w-full resize-y rounded-xl border-0 bg-white/80 p-4 font-sans text-sm leading-7 text-ink-900 outline-none focus:ring-2 focus:ring-emerald-300/70 dark:bg-slate-950/50 dark:text-white"
          />
        </div>
        {msg && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {msg}
          </p>
        )}
        <p className="mt-2 text-[11px] text-ink-500 dark:text-ink-400">{tr("tool.wordcounter.privacy", "Your text stays in your browser. Nothing is uploaded or saved.")}</p>
      </section>

      {/* counts */}
      <section className={`${card} mt-5 p-4 sm:p-6`} aria-live="polite">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {big.map(([id, label, value], i) => (
            <div key={id} className={`rounded-2xl border p-4 text-center ${i === 0 ? "border-emerald-300 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25" : "border-emerald-100 bg-white/70 dark:border-white/10 dark:bg-white/5"}`}>
              <p className={`text-3xl font-black leading-none sm:text-4xl ${i === 0 ? "" : "text-ink-900 dark:text-white"}`}>
                <span key={value} className="zwc-num">{value}</span>
              </p>
              <p className={`mt-2 text-[11px] font-bold uppercase tracking-wide ${i === 0 ? "text-emerald-50" : "text-ink-500 dark:text-ink-400"}`}>{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {small.map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-emerald-100 bg-white/70 p-3 text-center dark:border-white/10 dark:bg-white/5">
              <p className="truncate text-base font-black text-ink-900 dark:text-white" title={v}>{v}</p>
              <p className="text-[11px] font-semibold text-ink-500 dark:text-ink-400">{k}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={!hasText} onClick={() => void copy("sum", summary)} className={`${btn2} zwc-shine`}>
            {copied === "sum" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied === "sum" ? tr("tool.wordcounter.copied", "Copied") : tr("tool.wordcounter.copyStats", "Copy statistics")}
          </button>
          <button type="button" disabled={!hasText} onClick={() => void copy("text", text)} className={btn2}>
            {copied === "text" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied === "text" ? tr("tool.wordcounter.copied", "Copied") : tr("tool.wordcounter.copyText", "Copy text")}
          </button>
        </div>
      </section>

      {/* limit */}
      <section className={`${card} mt-5 p-4 sm:p-6`}>
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink-900 dark:text-white">
          <Clock className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          {tr("tool.wordcounter.limitTitle", "Target or limit")}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={tr("tool.wordcounter.limitTitle", "Target or limit")}>
          <button type="button" role="radio" aria-checked={limitId === "none"} onClick={() => setLimitId("none")} className={chip(limitId === "none")}>{tr("tool.wordcounter.limitNone", "No limit")}</button>
          {LIMITS.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={limitId === l.id} onClick={() => setLimitId(l.id)} className={chip(limitId === l.id)}>
              {tr(l.key, l.fb)} · {nf.format(l.max)}
            </button>
          ))}
          <button type="button" role="radio" aria-checked={limitId === "custom"} onClick={() => setLimitId("custom")} className={chip(limitId === "custom")}>{tr("tool.wordcounter.pCustom", "Custom")}</button>
        </div>
        {limitId === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label htmlFor="wc-max" className="text-xs font-bold text-ink-700 dark:text-ink-200">{tr("tool.wordcounter.customLabel", "My limit")}</label>
            <input id="wc-max" type="number" min={1} max={1000000} value={customMax} onChange={(e) => setCustomMax(Math.min(1000000, Math.max(1, Number(e.target.value) || 1)))} className="box-border w-28 rounded-xl border border-emerald-200 bg-white/90 px-3 py-1.5 text-sm dark:border-emerald-900/50 dark:bg-slate-950/60 dark:text-white" />
            <div className="flex gap-2" role="radiogroup" aria-label={tr("tool.wordcounter.customLabel", "My limit")}>
              {(["words", "chars"] as Unit[]).map((u) => (
                <button key={u} type="button" role="radio" aria-checked={customUnit === u} onClick={() => setCustomUnit(u)} className={chip(customUnit === u)}>{unitName(u)}</button>
              ))}
            </div>
          </div>
        )}
        {limit && (
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs font-bold">
              <span className="text-ink-700 dark:text-ink-200">{tr("tool.wordcounter.limitUsed", "{{used}} of {{max}} {{unit}}", { used: nf.format(used), max: nf.format(limit.max), unit: unitName(limit.unit) })}</span>
              <span className={over ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-300"}>
                {over ? tr("tool.wordcounter.limitOver", "{{n}} over", { n: nf.format(used - limit.max) }) : tr("tool.wordcounter.limitLeft", "{{n}} left", { n: nf.format(left) })}
              </span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={limit.max} aria-valuenow={Math.min(used, limit.max)}>
              <div className={`zwc-bar h-full rounded-full ${over ? "bg-rose-500" : pct > 90 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </section>

      {/* keywords */}
      <section className={`${card} mt-5 p-4 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-ink-900 dark:text-white">{tr("tool.wordcounter.kwTitle", "Most used words")}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5" role="radiogroup" aria-label={tr("tool.wordcounter.kwTitle", "Most used words")}>
              {([1, 2, 3] as const).map((n) => (
                <button key={n} type="button" role="radio" aria-checked={gram === n} onClick={() => setGram(n)} className={chip(gram === n)}>
                  {n === 1 ? tr("tool.wordcounter.kwOne", "1 word") : n === 2 ? tr("tool.wordcounter.kwTwo", "2 words") : tr("tool.wordcounter.kwThree", "3 words")}
                </button>
              ))}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-ink-700 dark:text-ink-200">
              <input type="checkbox" checked={ignore} onChange={(e) => setIgnore(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              {tr("tool.wordcounter.kwIgnore", "Ignore common words")}
            </label>
          </div>
        </div>
        {phrases.length > 0 ? (
          <ul className="mt-4 grid gap-x-8 gap-y-2 md:grid-cols-2">
            {phrases.map((p, i) => (
              <li key={p.k} className="text-xs">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-bold text-ink-800 dark:text-ink-100" title={p.k}>{p.k}</span>
                  <span className="shrink-0 font-semibold text-ink-500 dark:text-ink-400">{tr("tool.wordcounter.kwCount", "{{n}}×", { n: p.c })} · {p.pct}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-emerald-100/80 dark:bg-white/10">
                  <div className="zwc-seg h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${(p.c / maxK) * 100}%`, animationDelay: `${i * 40}ms` } as CSSProperties} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
            {tr("tool.wordcounter.kwEmpty", "Words that appear at least twice are listed here. Write a little more to see them.")}
          </p>
        )}
      </section>

      {/* platform table */}
      <section className={`${card} mt-5 p-4 sm:p-6`}>
        <h2 className="text-sm font-extrabold text-ink-900 dark:text-white">{tr("tool.wordcounter.tableTitle", "Common length limits")}</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-emerald-100 dark:border-white/10">
          <table className="w-full min-w-[24rem] border-collapse text-sm">
            <caption className="sr-only">{tr("tool.wordcounter.tableCaption", "Length limits of common platforms and fields")}</caption>
            <thead>
              <tr className="bg-emerald-100/80 text-xs uppercase tracking-wide text-emerald-950 dark:bg-emerald-400/15 dark:text-emerald-100">
                <th scope="col" className="px-3 py-2 text-start font-bold">{tr("tool.wordcounter.thWhere", "Where")}</th>
                <th scope="col" className="px-3 py-2 text-start font-bold">{tr("tool.wordcounter.thLimit", "Limit")}</th>
                <th scope="col" className="px-3 py-2 text-start font-bold">{tr("tool.wordcounter.thUnit", "Counted in")}</th>
              </tr>
            </thead>
            <tbody className="text-ink-700 dark:text-ink-300">
              {LIMITS.map((l) => (
                <tr key={l.id} className="border-t border-emerald-100 dark:border-white/10">
                  <th scope="row" className="px-3 py-2 text-start font-bold">{tr(l.key, l.fb)}</th>
                  <td className="px-3 py-2">{nf.format(l.max)}</td>
                  <td className="px-3 py-2">{unitName(l.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* guide */}
      <article className="mt-8 rounded-3xl border border-white/80 bg-white/70 p-5 ring-1 ring-emerald-200/50 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-900/60 dark:ring-emerald-300/10">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl dark:text-white">{tr("tool.wordcounter.guideTitle", "How this word counter works")}</h2>
        <p className="mt-3 text-sm leading-7 text-ink-700 dark:text-ink-300">
          {tr("tool.wordcounter.guideIntro", "Type or paste your text and the counts update as you write: words, characters with and without spaces, sentences, paragraphs and lines. You also get reading and speaking time, the longest word, and a list of the words you use most. Nothing leaves your browser.")}
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.wordcounter.howTitle", "What counts as a word?")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.wordcounter.howText", "A word is a run of letters or digits separated by spaces or punctuation. A hyphenated word such as well-known and a number such as 2,500 each count once. For Chinese and Japanese, the browser splits the text into words, so the result is an estimate.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.wordcounter.limitsTitle", "Character limits")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.wordcounter.limitsText", "Pick a preset such as a post on X, a meta description or an SMS and the bar shows how much room is left. Platforms change their rules and count some things differently (X counts every link as 23 characters, and some emoji count as two), so treat the result as a close guide and check the platform when you are near the limit.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.wordcounter.kwGuideTitle", "Repeated words")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.wordcounter.kwGuideText", "The list shows words and short phrases that appear at least twice, with how often and what share of the text they make up. Use it to spot a word you lean on too much. It is a writing aid, not a promise about search rankings.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.wordcounter.timeTitle", "Reading and speaking time")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.wordcounter.timeText", "Reading time uses 238 words per minute and speaking time uses 150 words per minute. These are averages, so your own pace may differ. The Reading Time Calculator lets you change the speed.")}
            </p>
          </section>
        </div>
        <section className="mt-6">
          <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.wordcounter.linksTitle", "More free writing tools")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {[
              { slug: "reading-time-calculator", fb: "Reading Time Calculator" },
              { slug: "sentence-counter", fb: "Sentence Counter" },
              { slug: "case-converter", fb: "Case Converter" },
              { slug: "ai-text-summarizer", fb: "Text Summarizer" },
              { slug: "ai-grammar-checker", fb: "Grammar Checker" },
              { slug: "text-diff-checker", fb: "Text Diff Checker" },
            ].map((l) => (
              <li key={l.slug}>
                <Link to={`/tools/${l.slug}`} className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                  {tr(`tool.${l.slug}.name`, l.fb)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
