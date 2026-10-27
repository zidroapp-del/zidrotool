import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Clock, Copy, FileText, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";

/* ------------------------------------------------------------------ engine
 * Pure browser maths. Reading speeds come from published averages for adults
 * (about 238 wpm silent non-fiction, about 183 wpm reading aloud) and common
 * presentation pace; they are estimates, not measurements of any one person.
 */

const MAX_CHARS = 400000;
const STORE = "zidrotool-reading-time-v1";

const MODES = [
  { id: "silent", wpm: 238, key: "tool.readtime.modeSilent", fb: "Silent reading", hint: "tool.readtime.modeSilentHint", hfb: "Average adult, non-fiction" },
  { id: "aloud", wpm: 183, key: "tool.readtime.modeAloud", fb: "Reading aloud", hint: "tool.readtime.modeAloudHint", hfb: "Reading out loud to someone" },
  { id: "speech", wpm: 150, key: "tool.readtime.modeSpeech", fb: "Speech or talk", hint: "tool.readtime.modeSpeechHint", hfb: "Presentation pace with pauses" },
  { id: "skim", wpm: 450, key: "tool.readtime.modeSkim", fb: "Skimming", hint: "tool.readtime.modeSkimHint", hfb: "Quick scan for the main points" },
] as const;

const SPEED_PRESETS = [
  { wpm: 150, key: "tool.readtime.pSlow", fb: "Slow" },
  { wpm: 238, key: "tool.readtime.pAverage", fb: "Average" },
  { wpm: 300, key: "tool.readtime.pFast", fb: "Fast" },
  { wpm: 450, key: "tool.readtime.pSkim", fb: "Skim" },
];

const QUICK_WORDS = [250, 500, 1000, 2000, 5000, 10000, 50000];

const SAMPLE =
  "Reading time is the number of minutes an average reader needs to get through a text. Many blogs show it at the top of a post, because it helps people decide whether they have time for the article right now or should save it for later.\n\n" +
  "To estimate it, you count the words and divide by a reading speed. Studies of adults suggest that most people read about 240 words per minute when they read silently, although the speed changes with the topic, the layout and how tired the reader is. Reading aloud is slower, at roughly 180 words per minute, and a speaker who pauses for emphasis is slower again.\n\n" +
  "Images, tables and code also take time. A reader will look at a picture for a few seconds, so some publishers add a short allowance for each image. Dense technical text can take much longer than a novel with the same number of words.\n\n" +
  "Use the result as a guide, not a promise. If you are timing a speech, read your text aloud once with a stopwatch and compare it with the estimate to learn your own pace.";

function countWords(text: string): number {
  if (!text.trim()) return 0;
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
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
}

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const s = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return Math.max(1, (s.match(/[aeiouy]{1,2}/g) ?? []).length);
}

function imageSeconds(n: number): number {
  // 12 s for the first image, 11 s for the second ... never less than 3 s
  let t = 0;
  for (let i = 0; i < n; i++) t += Math.max(3, 12 - i);
  return t;
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
  const words = countWords(text);
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const sentences = (text.match(/[^.!?؟。！？\n]+[.!?؟。！？]*/g) ?? []).filter((x) => /[\p{L}\p{N}]/u.test(x)).length;
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const paraWords = paras.map((p) => countWords(p));
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  let flesch: number | null = null;
  let grade: number | null = null;
  if (words >= 30 && sentences > 0 && letters > 0 && latin / letters > 0.9) {
    const sy = (text.match(/[A-Za-z]+/g) ?? []).reduce((n, w) => n + syllables(w), 0);
    const wps = words / sentences;
    const spw = sy / words;
    flesch = Math.round(206.835 - 1.015 * wps - 84.6 * spw);
    grade = Math.round((0.39 * wps + 11.8 * spw - 15.59) * 10) / 10;
  }
  return {
    words,
    chars,
    charsNoSpace,
    sentences,
    paragraphs: paras.length,
    paraWords,
    avgSentence: sentences ? Math.round((words / sentences) * 10) / 10 : 0,
    avgWord: words ? Math.round((charsNoSpace / words) * 10) / 10 : 0,
    flesch,
    grade,
  };
}

const BG_PAGES = [
  { left: 6, top: 14, s: 30, delay: 0 },
  { left: 18, top: 68, s: 24, delay: 2 },
  { left: 36, top: 10, s: 22, delay: 4 },
  { left: 57, top: 82, s: 32, delay: 1 },
  { left: 72, top: 16, s: 26, delay: 3 },
  { left: 86, top: 64, s: 28, delay: 5 },
  { left: 94, top: 28, s: 20, delay: 2.5 },
];

const BG_CHIPS = [
  { text: "4 min read", left: 4, top: 40, dur: 24, delay: -4 },
  { text: "238 wpm", left: 74, top: 32, dur: 28, delay: -12 },
  { text: "1,000 words", left: 46, top: 74, dur: 26, delay: -17 },
  { text: "12 min talk", left: 84, top: 80, dur: 30, delay: -7 },
  { text: "Aa", left: 24, top: 90, dur: 27, delay: -2 },
];

function BookCat({ mode }: { mode: "idle" | "typing" | "done" }) {
  return (
    <svg viewBox="0 0 150 120" className="zrt-cat h-24 w-28 shrink-0" role="img" aria-label="Cat reading a book">
      <g className="zrt-tail" style={{ transformOrigin: "112px 100px" }}>
        <path d="M108 102 C134 102 142 80 130 66" fill="none" stroke="#a5b4fc" strokeWidth="9" strokeLinecap="round" />
      </g>
      <ellipse cx="75" cy="104" rx="40" ry="16" fill="#c7d2fe" />
      <g className="zrt-head" style={{ transformOrigin: "75px 70px" }}>
        <path d="M44 52 L48 24 L68 40 Z" fill="#a5b4fc" />
        <path d="M106 52 L102 24 L82 40 Z" fill="#a5b4fc" />
        <path d="M50 44 L52 32 L61 40 Z" fill="#eef2ff" />
        <path d="M100 44 L98 32 L89 40 Z" fill="#eef2ff" />
        <ellipse cx="75" cy="64" rx="34" ry="29" fill="#c7d2fe" />
        <ellipse cx="75" cy="74" rx="13" ry="9" fill="#eef2ff" />
        <g className="zrt-eyes">
          {mode === "done" ? (
            <>
              <path d="M54 62 Q60 54 66 62" fill="none" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
              <path d="M84 62 Q90 54 96 62" fill="none" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="60" cy="62" r="5.2" fill="#1e1b4b" />
              <circle cx="90" cy="62" r="5.2" fill="#1e1b4b" />
              <circle cx="61.8" cy="60.2" r="1.7" fill="#fff" />
              <circle cx="91.8" cy="60.2" r="1.7" fill="#fff" />
            </>
          )}
        </g>
        <circle cx="60" cy="62" r="10.5" fill="none" stroke="#4338ca" strokeWidth="2.2" />
        <circle cx="90" cy="62" r="10.5" fill="none" stroke="#4338ca" strokeWidth="2.2" />
        <path d="M70.5 62 L79.5 62" stroke="#4338ca" strokeWidth="2.2" />
        <path d="M72 71 L78 71 L75 75 Z" fill="#6366f1" />
        <path d="M75 75 Q70 80 66 77 M75 75 Q80 80 84 77" fill="none" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="46" cy="76" r="5.5" fill="#fda4af" opacity="0.55" />
        <circle cx="104" cy="76" r="5.5" fill="#fda4af" opacity="0.55" />
      </g>
      <g className="zrt-book" style={{ transformOrigin: "75px 104px" }}>
        <path d="M32 96 L75 102 L75 118 L32 112 Z" fill="#fff" stroke="#6366f1" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M118 96 L75 102 L75 118 L118 112 Z" fill="#fff" stroke="#6366f1" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M40 100 L68 104 M40 105 L68 109 M82 104 L110 100 M82 109 L110 105" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round" />
        <path className="zrt-page" d="M75 102 L112 98 L112 114 L75 118 Z" fill="#eef2ff" stroke="#6366f1" strokeWidth="1.6" strokeLinejoin="round" style={{ transformOrigin: "75px 108px" }} />
      </g>
      <ellipse cx="48" cy="106" rx="9" ry="6" fill="#eef2ff" />
      <ellipse cx="102" cy="106" rx="9" ry="6" fill="#eef2ff" />
    </svg>
  );
}

export default function ReadingTimeCalculator() {
  const { t, i18n } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;
  const lang = i18n?.language || "en";
  const nf = useMemo(() => new Intl.NumberFormat(lang), [lang]);
  const units = { h: tr("tool.readtime.uHour", "h"), m: tr("tool.readtime.uMin", "min"), s: tr("tool.readtime.uSec", "s") };

  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(238);
  const [images, setImages] = useState(0);
  const [typing, setTyping] = useState(false);
  const [copied, setCopied] = useState("");
  const [msg, setMsg] = useState("");
  const [drag, setDrag] = useState(false);
  const typingTimer = useRef<number | undefined>(undefined);
  const copyTimer = useRef<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const v = JSON.parse(raw) as { wpm?: number };
        if (typeof v.wpm === "number") setWpm(Math.min(600, Math.max(80, v.wpm)));
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ wpm }));
    } catch {
      /* ignore */
    }
  }, [wpm]);
  useEffect(
    () => () => {
      window.clearTimeout(typingTimer.current);
      window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const [deferred, setDeferred] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setDeferred(text), 120);
    return () => window.clearTimeout(id);
  }, [text]);
  const a = useMemo(() => analyse(deferred), [deferred]);

  const extra = imageSeconds(images);
  const secs = (w: number, rate: number) => (w / rate) * 60;
  const mainSec = secs(a.words, wpm) + extra;
  const hasText = a.words > 0;
  const mode: "idle" | "typing" | "done" = typing ? "typing" : hasText ? "done" : "idle";

  const onType = (v: string) => {
    setText(v.slice(0, MAX_CHARS));
    setTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTyping(false), 1200);
  };

  const readFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 3 * 1024 * 1024 || !/^text\/|\.(txt|md|markdown|csv|html?)$/i.test(f.type + f.name)) {
      setMsg(tr("tool.readtime.errFile", "Only text files up to 3 MB can be opened (.txt, .md, .html)."));
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
      setMsg(tr("tool.readtime.errPaste", "Your browser did not allow pasting. Press Ctrl+V in the box instead."));
    }
  };

  const copy = async (id: string, value: string) => {
    await copyToClipboard(value);
    setCopied(id);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(""), 1600);
  };

  const minutesRounded = Math.max(1, Math.ceil(mainSec / 60));
  const badge = tr("tool.readtime.badge", "{{n}} min read", { n: minutesRounded });
  const summary = `${badge} · ${tr("tool.readtime.nWords", "{{n}} words", { n: nf.format(a.words) })}`;

  const bubble = typing
    ? tr("tool.readtime.catTyping", "Ooh, a good read…")
    : hasText
      ? tr("tool.readtime.catDone", "About {{time}} to read this!", { time: fmtTime(mainSec, units) })
      : tr("tool.readtime.catIdle", "Paste some text and I'll time it!");

  // clock ring: a full circle is 60 minutes
  const R = 54;
  const C = 2 * Math.PI * R;
  const ringFill = Math.min(1, mainSec / 3600);

  const paraSegs = useMemo(() => {
    const list = a.paraWords.slice(0, 80);
    const total = list.reduce((n, x) => n + x, 0) || 1;
    return list.map((w, i) => ({ i, w, pct: (w / total) * 100 }));
  }, [a.paraWords]);

  const card =
    "rounded-3xl border border-white/80 bg-white/75 shadow-[0_24px_60px_-30px_rgba(79,70,229,0.5)] ring-1 ring-indigo-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:ring-indigo-300/10";
  const btn2 =
    "inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white/85 px-3 py-2 text-xs font-bold text-indigo-800 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-900/60 dark:bg-slate-900/60 dark:text-indigo-100";
  const chip = (active: boolean) =>
    `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "border-indigo-200 bg-white/80 text-indigo-800 hover:bg-indigo-50 dark:border-indigo-900/60 dark:bg-slate-900/60 dark:text-indigo-100"}`;

  const level =
    a.flesch == null
      ? ""
      : a.flesch >= 70
        ? tr("tool.readtime.lvEasy", "Easy to read")
        : a.flesch >= 50
          ? tr("tool.readtime.lvStandard", "Fairly standard")
          : a.flesch >= 30
            ? tr("tool.readtime.lvHard", "Difficult")
            : tr("tool.readtime.lvVeryHard", "Very difficult");

  return (
    <div className="zrt-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-8">
      <style>{`
        @keyframes zrt-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,30px,0) scale(1.12); } }
        @keyframes zrt-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-70px,-25px,0) scale(0.94); } }
        @keyframes zrt-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zrt-page { 0%,100% { transform: translate3d(0,0,0) rotate(-8deg); opacity: 0.8; } 50% { transform: translate3d(14px,-28px,0) rotate(10deg); opacity: 0.4; } }
        @keyframes zrt-chip { 0%,100% { transform: translate3d(0,0,0); opacity: 0.5; } 50% { transform: translate3d(20px,-24px,0); opacity: 0.95; } }
        @keyframes zrt-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes zrt-march { to { stroke-dashoffset: -28; } }
        @keyframes zrt-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes zrt-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(9deg); } }
        @keyframes zrt-read { 0%,100% { transform: translateX(-2.5px); } 50% { transform: translateX(2.5px); } }
        @keyframes zrt-flip { 0%,70%,100% { transform: scaleX(1); } 85% { transform: scaleX(-1); } }
        @keyframes zrt-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        @keyframes zrt-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .zrt-blob { will-change: transform; }
        .zrt-blob-a { animation: zrt-blob-a 24s ease-in-out infinite; }
        .zrt-blob-b { animation: zrt-blob-b 30s ease-in-out infinite; }
        .zrt-blob-c { animation: zrt-blob-c 27s ease-in-out infinite; }
        .zrt-sheet { position: absolute; border-radius: 3px; background: rgba(255,255,255,0.75); box-shadow: 0 0 0 1.5px rgba(129,140,248,0.45) inset; animation: zrt-page 11s ease-in-out infinite; }
        .zrt-sheet::before, .zrt-sheet::after { content: ""; position: absolute; left: 18%; right: 18%; height: 2px; background: rgba(129,140,248,0.55); border-radius: 2px; }
        .zrt-sheet::before { top: 30%; }
        .zrt-sheet::after { top: 55%; right: 36%; }
        .zrt-chip { position: absolute; white-space: nowrap; animation: zrt-chip ease-in-out infinite; }
        .zrt-rise { animation: zrt-rise 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .zrt-box rect { animation: zrt-march 1.6s linear infinite; }
        .zrt-cat .zrt-head { animation: zrt-bob 3.6s ease-in-out infinite; }
        .zrt-cat .zrt-tail { animation: zrt-tail 2.6s ease-in-out infinite; }
        .zrt-cat .zrt-eyes { animation: zrt-read 1.6s ease-in-out infinite; }
        .zrt-cat .zrt-page { animation: zrt-flip 3.2s ease-in-out infinite; }
        .zrt-ring { transition: stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1); }
        .zrt-seg { transform-origin: left center; animation: zrt-grow 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .zrt-shine { position: relative; overflow: hidden; }
        .zrt-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%); transform: translateX(-130%); animation: zrt-shine 4.5s ease-in-out infinite; }
        .zrt-range { accent-color: #4f46e5; }
        @media (prefers-reduced-motion: reduce) {
          .zrt-blob, .zrt-sheet, .zrt-chip, .zrt-rise, .zrt-box rect, .zrt-cat *, .zrt-shine::after, .zrt-seg { animation: none !important; }
          .zrt-ring { transition: none; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-sky-50 to-violet-50 dark:from-slate-950 dark:via-indigo-950/60 dark:to-slate-900" />
        <div className="zrt-blob zrt-blob-a absolute -left-24 -top-24 h-96 w-[34rem] rounded-full bg-gradient-to-r from-indigo-300/55 to-sky-200/40 blur-3xl dark:from-indigo-500/25 dark:to-sky-500/15" />
        <div className="zrt-blob zrt-blob-b absolute -right-28 top-1/3 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-violet-200/60 to-pink-200/40 blur-3xl dark:from-violet-400/15 dark:to-pink-500/15" />
        <div className="zrt-blob zrt-blob-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-sky-200/55 to-indigo-200/40 blur-3xl dark:from-sky-500/20 dark:to-indigo-500/15" />
        {BG_PAGES.map((p, i) => (
          <span key={`p-${i}`} className="zrt-sheet" style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.s, height: p.s * 1.28, animationDelay: `${p.delay}s` } as CSSProperties} />
        ))}
        {BG_CHIPS.map((g, i) => (
          <span
            key={`c-${i}`}
            className="zrt-chip rounded-full border border-indigo-200/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-indigo-700/80 dark:border-white/10 dark:bg-white/5 dark:text-indigo-200/60"
            style={{ left: `${g.left}%`, top: `${g.top}%`, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` } as CSSProperties}
          >
            {g.text}
          </span>
        ))}
      </div>

      {/* mascot */}
      <div className="mb-2 flex items-end gap-3 px-1">
        <div className="relative mb-4 max-w-xs rounded-2xl rounded-bl-sm border border-indigo-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-indigo-900 shadow-sm dark:border-indigo-300/20 dark:bg-slate-900/80 dark:text-indigo-100">{bubble}</div>
        <BookCat mode={mode} />
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
          <label htmlFor="rt-text" className="text-xs font-bold text-ink-700 dark:text-ink-200">
            {tr("tool.readtime.inputLabel", "Paste or type your text")}
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={paste} className={btn2}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {tr("tool.readtime.paste", "Paste")}
            </button>
            <button type="button" onClick={() => onType(SAMPLE)} className={btn2}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {tr("tool.readtime.example", "Try an example")}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={btn2}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              {tr("tool.readtime.openFile", "Open a .txt file")}
            </button>
            <button type="button" onClick={() => { setText(""); setMsg(""); }} disabled={!text} className={btn2}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {tr("tool.readtime.clear", "Clear")}
            </button>
            <input ref={fileRef} type="file" accept=".txt,.md,.markdown,.csv,.html,.htm,text/*" className="sr-only" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </div>
        <div className={`zrt-box relative rounded-2xl p-1 transition ${drag ? "bg-indigo-100/80 dark:bg-indigo-400/10" : ""}`}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <rect x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="16" fill="none" strokeWidth="2" strokeDasharray="10 8" className={drag ? "stroke-indigo-500" : "stroke-indigo-300/80 dark:stroke-indigo-300/40"} />
          </svg>
          <textarea
            id="rt-text"
            value={text}
            onChange={(e) => onType(e.target.value)}
            placeholder={tr("tool.readtime.placeholder", "Paste your article, essay or speech here, or drop a text file…")}
            rows={9}
            spellCheck={false}
            className="box-border block w-full resize-y rounded-xl border-0 bg-white/80 p-4 font-sans text-sm leading-7 text-ink-900 outline-none focus:ring-2 focus:ring-indigo-300/70 dark:bg-slate-950/50 dark:text-white"
          />
        </div>
        {msg && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {msg}
          </p>
        )}
        <p className="mt-2 text-[11px] text-ink-500 dark:text-ink-400">{tr("tool.readtime.privacy", "Your text stays in your browser. Nothing is uploaded or saved.")}</p>
      </section>

      {/* result */}
      <section className={`${card} mt-5 p-4 sm:p-6`} aria-live="polite">
        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-40 w-40">
            <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="64" cy="64" r={R} fill="none" strokeWidth="10" className="stroke-indigo-100 dark:stroke-white/10" />
              <circle
                cx="64"
                cy="64"
                r={R}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - (hasText ? Math.max(0.03, ringFill) : 0))}
                className="zrt-ring stroke-indigo-600 dark:stroke-indigo-400"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Clock className="mb-0.5 h-4 w-4 text-indigo-500" aria-hidden="true" />
              <span className="text-xl font-black leading-tight text-ink-900 dark:text-white">{hasText ? fmtTime(mainSec, units) : "—"}</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{tr("tool.readtime.at", "at {{n}} wpm", { n: wpm })}</span>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-ink-900 dark:text-white">{tr("tool.readtime.yourSpeed", "Your reading speed")}</h2>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={tr("tool.readtime.yourSpeed", "Your reading speed")}>
              {SPEED_PRESETS.map((p) => (
                <button key={p.wpm} type="button" role="radio" aria-checked={wpm === p.wpm} onClick={() => setWpm(p.wpm)} className={chip(wpm === p.wpm)}>
                  {tr(p.key, p.fb)} · {p.wpm}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input id="rt-wpm" type="range" min={80} max={600} step={5} value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className="zrt-range w-full" aria-label={tr("tool.readtime.wpmLabel", "Words per minute")} />
              <span className="w-20 shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-center text-xs font-bold text-indigo-800 dark:bg-indigo-400/20 dark:text-indigo-100">{wpm} wpm</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label htmlFor="rt-img" className="text-xs font-bold text-ink-700 dark:text-ink-200">{tr("tool.readtime.images", "Images in the text")}</label>
              <input id="rt-img" type="number" min={0} max={200} value={images} onChange={(e) => setImages(Math.min(200, Math.max(0, Number(e.target.value) || 0)))} className="box-border w-20 rounded-xl border border-indigo-200 bg-white/90 px-3 py-1.5 text-sm dark:border-indigo-900/50 dark:bg-slate-950/60 dark:text-white" />
              {images > 0 && <span className="text-[11px] text-ink-500 dark:text-ink-400">{tr("tool.readtime.imagesAdd", "+{{n}} s for images", { n: extra })}</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={!hasText} onClick={() => void copy("badge", badge)} className={`${btn2} zrt-shine`}>
                {copied === "badge" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied === "badge" ? tr("tool.readtime.copied", "Copied") : tr("tool.readtime.copyBadge", "Copy “{{badge}}”", { badge })}
              </button>
              <button type="button" disabled={!hasText} onClick={() => void copy("sum", summary)} className={btn2}>
                {copied === "sum" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied === "sum" ? tr("tool.readtime.copied", "Copied") : tr("tool.readtime.copySummary", "Copy summary")}
              </button>
            </div>
          </div>
        </div>

        {/* modes */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => (
            <div key={m.id} className="rounded-2xl border border-indigo-100 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-extrabold text-ink-800 dark:text-ink-100">{tr(m.key, m.fb)}</p>
              <p className="mt-1 text-lg font-black text-indigo-700 dark:text-indigo-300">{hasText ? fmtTime(secs(a.words, m.wpm) + extra, units) : "—"}</p>
              <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{m.wpm} wpm · {tr(m.hint, m.hfb)}</p>
            </div>
          ))}
        </div>

        {/* paragraph map */}
        {hasText && paraSegs.length > 1 && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-500 dark:text-ink-400">{tr("tool.readtime.map", "Reading map (time per paragraph)")}</h3>
            <div className="flex h-9 w-full gap-0.5 overflow-hidden rounded-xl bg-indigo-100/60 p-0.5 dark:bg-white/5">
              {paraSegs.map((s) => (
                <div
                  key={s.i}
                  className="zrt-seg flex min-w-[6px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-indigo-400 to-indigo-600 text-[10px] font-bold text-white"
                  style={{ width: `${s.pct}%`, opacity: 0.55 + 0.45 * ((s.i % 3) / 2), animationDelay: `${s.i * 30}ms` } as CSSProperties}
                  title={`${tr("tool.readtime.para", "Paragraph {{n}}", { n: s.i + 1 })}: ${fmtTime(secs(s.w, wpm), units)} · ${nf.format(s.w)} ${tr("tool.readtime.wordsShort", "words")}`}
                >
                  {s.pct > 9 ? s.i + 1 : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            [tr("tool.readtime.sWords", "Words"), nf.format(a.words)],
            [tr("tool.readtime.sChars", "Characters"), nf.format(a.chars)],
            [tr("tool.readtime.sCharsNo", "No spaces"), nf.format(a.charsNoSpace)],
            [tr("tool.readtime.sSentences", "Sentences"), nf.format(a.sentences)],
            [tr("tool.readtime.sParas", "Paragraphs"), nf.format(a.paragraphs)],
            [tr("tool.readtime.sAvgSentence", "Words / sentence"), a.avgSentence ? String(a.avgSentence) : "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-indigo-100 bg-white/70 p-3 text-center dark:border-white/10 dark:bg-white/5">
              <p className="text-lg font-black text-ink-900 dark:text-white">{v}</p>
              <p className="text-[11px] font-semibold text-ink-500 dark:text-ink-400">{k}</p>
            </div>
          ))}
        </div>
        {a.flesch != null && a.grade != null && (
          <p className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs leading-6 text-indigo-900 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-100">
            <strong>{tr("tool.readtime.readability", "Readability (English estimate)")}:</strong> Flesch {a.flesch} · {tr("tool.readtime.grade", "US grade level {{n}}", { n: a.grade })} · {level}
          </p>
        )}
      </section>

      {/* quick table */}
      <section className={`${card} mt-5 p-4 sm:p-6`}>
        <h2 className="text-sm font-extrabold text-ink-900 dark:text-white">{tr("tool.readtime.tableTitle", "How long does it take to read…")}</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-indigo-100 dark:border-white/10">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <caption className="sr-only">{tr("tool.readtime.tableCaption", "Reading time by number of words")}</caption>
            <thead>
              <tr className="bg-indigo-100/80 text-xs uppercase tracking-wide text-indigo-900 dark:bg-indigo-400/15 dark:text-indigo-100">
                <th scope="col" className="px-3 py-2 text-start font-bold">{tr("tool.readtime.thWords", "Words")}</th>
                {MODES.map((m) => (
                  <th key={m.id} scope="col" className="px-3 py-2 text-start font-bold">{tr(m.key, m.fb)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-700 dark:text-ink-300">
              {QUICK_WORDS.map((w) => (
                <tr key={w} className="border-t border-indigo-100 dark:border-white/10">
                  <th scope="row" className="px-3 py-2 text-start font-bold">{nf.format(w)}</th>
                  {MODES.map((m) => (
                    <td key={m.id} className="px-3 py-2">{fmtTime(secs(w, m.wpm), units)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* guide */}
      <article className="mt-8 rounded-3xl border border-white/80 bg-white/70 p-5 ring-1 ring-indigo-200/50 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-900/60 dark:ring-indigo-300/10">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl dark:text-white">{tr("tool.readtime.guideTitle", "How reading time is calculated")}</h2>
        <p className="mt-3 text-sm leading-7 text-ink-700 dark:text-ink-300">
          {tr("tool.readtime.guideIntro", "Reading time is the word count divided by a reading speed in words per minute. Adults read about 238 words per minute when they read non-fiction silently, and about 183 words per minute when they read aloud. This calculator lets you change the speed, add time for images and see the result for four ways of reading.")}
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.readtime.formulaTitle", "The formula")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.readtime.formulaText", "Time in minutes = words ÷ words per minute. For 1,000 words at 238 wpm that is about 4 minutes 12 seconds. Images add a few seconds each: 12 seconds for the first, 11 for the second, and never less than 3 seconds.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.readtime.accuracyTitle", "How accurate is it?")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.readtime.accuracyText", "It is an estimate. Difficult or technical text, small screens and unfamiliar topics slow people down, while familiar light reading is faster. To time a speech, read it aloud once with a stopwatch and use your own pace.")}
            </p>
          </section>
        </div>
        <section className="mt-6">
          <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.readtime.linksTitle", "More free writing tools")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {[
              { slug: "word-counter", fb: "Word Counter" },
              { slug: "sentence-counter", fb: "Sentence Counter" },
              { slug: "ai-text-summarizer", fb: "Text Summarizer" },
              { slug: "ai-grammar-checker", fb: "Grammar Checker" },
              { slug: "case-converter", fb: "Case Converter" },
            ].map((l) => (
              <li key={l.slug}>
                <Link to={`/tools/${l.slug}`} className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-100">
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
