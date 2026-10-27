import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Copy, FileText, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";

/* ------------------------------------------------------------------ engine
 * Pure string work in the browser, Unicode-aware (accents, Greek, Cyrillic). Scripts without
 * letter case, such as Arabic, Hebrew or Chinese, are left unchanged by the case modes.
 */

const MAX_CHARS = 1000000;
const STORE = "zidrotool-case-converter-v1";

interface Opts {
  small: boolean; // keep small words lower case in Title Case
  acronyms: boolean; // keep ALL-CAPS words (up to 5 letters) in Title Case
  turkish: boolean;
  accents: boolean; // strip accents in developer cases
  perLine: boolean;
}

const SMALL = new Set(
  "a an the and but or nor for so yet as at by in of off on out per to up via vs v if".split(" "),
);

const TEXT_MODES = [
  { id: "sentence", label: "Sentence case", mark: "Aa." },
  { id: "lower", label: "lower case", mark: "aa" },
  { id: "upper", label: "UPPER CASE", mark: "AA" },
  { id: "capitalized", label: "Capitalized Case", mark: "Aa" },
  { id: "title", label: "Title Case", mark: "Aa" },
  { id: "alternating", label: "aLtErNaTiNg cAsE", mark: "aA" },
  { id: "inverse", label: "InVeRsE CaSe", mark: "aA" },
] as const;

const CODE_MODES = [
  { id: "camel", label: "camelCase", mark: "aB" },
  { id: "pascal", label: "PascalCase", mark: "AB" },
  { id: "snake", label: "snake_case", mark: "a_b" },
  { id: "kebab", label: "kebab-case", mark: "a-b" },
  { id: "constant", label: "CONSTANT_CASE", mark: "A_B" },
  { id: "dot", label: "dot.case", mark: "a.b" },
  { id: "train", label: "Train-Case", mark: "A-B" },
] as const;

const ALL_MODES: { id: string; label: string; mark: string }[] = [...TEXT_MODES, ...CODE_MODES];

const SAMPLE =
  "the quick brown fox jumps over the lazy dog. this is a sample text for the case converter! it has two sentences, a few small words and a user_profile and an XMLHttpRequest to show developer cases.";

const WORD_TOKEN = /([\p{L}\p{N}][\p{L}\p{N}'’]*)|([^\p{L}\p{N}]+)/gu;

function up(s: string, o: Opts) {
  return o.turkish ? s.toLocaleUpperCase("tr") : s.toUpperCase();
}
function low(s: string, o: Opts) {
  return o.turkish ? s.toLocaleLowerCase("tr") : s.toLowerCase();
}
function cap(w: string, o: Opts) {
  if (/\p{Ll}\p{Lu}/u.test(w)) return w; // keep camelCase and brand names such as iPhone
  const a = Array.from(w);
  return up(a[0] ?? "", o) + low(a.slice(1).join(""), o);
}

function mapWords(line: string, fn: (w: string, first: boolean, last: boolean, prevSep: string) => string): string {
  const toks = Array.from(line.matchAll(WORD_TOKEN)).map((m) => ({ w: m[1], sep: m[2] }));
  const lastIdx = (() => {
    for (let i = toks.length - 1; i >= 0; i--) if (toks[i].w) return i;
    return -1;
  })();
  let seen = false;
  let prevSep = "";
  let out = "";
  toks.forEach((t, i) => {
    if (t.w) {
      out += fn(t.w, !seen, i === lastIdx, prevSep);
      seen = true;
      prevSep = "";
    } else {
      out += t.sep;
      prevSep = t.sep;
    }
  });
  return out;
}

function titleCase(line: string, o: Opts): string {
  return mapWords(line, (w, first, last, sep) => {
    if (o.acronyms && w.length <= 5 && w.length > 1 && w === w.toUpperCase() && w !== w.toLowerCase()) return w;
    const lw = low(w, o);
    const afterBreak = /[:?!.—–]/.test(sep);
    if (o.small && SMALL.has(lw) && !first && !last && !afterBreak) return lw;
    return cap(w, o);
  });
}

function sentenceCase(text: string, o: Opts): string {
  const l = low(text, o);
  let out = "";
  let needCap = true;
  for (const ch of Array.from(l)) {
    if (needCap && /\p{L}/u.test(ch)) {
      out += up(ch, o);
      needCap = false;
    } else {
      out += ch;
      if (/[.!?؟…。！？\n]/.test(ch)) needCap = true;
      else if (/[\p{L}\p{N}]/u.test(ch)) needCap = false;
    }
  }
  return out;
}

function words(line: string, o: Opts): string[] {
  let s = line;
  if (o.accents) s = s.normalize("NFD").replace(/\p{M}/gu, "");
  s = s
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2");
  return s.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function dev(line: string, mode: string, o: Opts): string {
  const w = words(line, o);
  if (!w.length) return "";
  const lo = w.map((x) => low(x, o));
  switch (mode) {
    case "camel":
      return lo.map((x, i) => (i === 0 ? x : cap(x, o))).join("");
    case "pascal":
      return lo.map((x) => cap(x, o)).join("");
    case "snake":
      return lo.join("_");
    case "kebab":
      return lo.join("-");
    case "constant":
      return lo.map((x) => up(x, o)).join("_");
    case "dot":
      return lo.join(".");
    case "train":
      return lo.map((x) => cap(x, o)).join("-");
    default:
      return line;
  }
}

function convert(text: string, mode: string, o: Opts): string {
  if (!text) return "";
  switch (mode) {
    case "upper":
      return up(text, o);
    case "lower":
      return low(text, o);
    case "sentence":
      return sentenceCase(text, o);
    case "capitalized":
      return text.split("\n").map((l) => mapWords(l, (w) => cap(w, o))).join("\n");
    case "title":
      return text.split("\n").map((l) => titleCase(l, o)).join("\n");
    case "alternating": {
      let i = 0;
      return Array.from(text).map((ch) => (/\p{L}/u.test(ch) ? (i++ % 2 === 0 ? low(ch, o) : up(ch, o)) : ch)).join("");
    }
    case "inverse":
      return Array.from(text).map((ch) => (ch === up(ch, o) ? low(ch, o) : up(ch, o))).join("");
    default: {
      if (o.perLine) return text.split("\n").map((l) => dev(l, mode, o)).join("\n");
      return dev(text.replace(/\n+/g, " "), mode, o);
    }
  }
}

const BG_LETTERS = [
  { ch: "Aa", left: 6, top: 14, s: 34, delay: 0 },
  { ch: "aB", left: 20, top: 68, s: 26, delay: 2 },
  { ch: "X", left: 38, top: 8, s: 30, delay: 4 },
  { ch: "q_z", left: 57, top: 82, s: 24, delay: 1 },
  { ch: "Ää", left: 73, top: 14, s: 30, delay: 3 },
  { ch: "Ww", left: 89, top: 62, s: 28, delay: 5 },
];

const BG_CHIPS = [
  { text: "UPPER CASE", left: 4, top: 42, dur: 25, delay: -4 },
  { text: "camelCase", left: 76, top: 34, dur: 28, delay: -12 },
  { text: "snake_case", left: 44, top: 78, dur: 26, delay: -17 },
  { text: "Title Case", left: 84, top: 84, dur: 30, delay: -7 },
  { text: "kebab-case", left: 22, top: 90, dur: 27, delay: -2 },
];

type Mood = "idle" | "typing" | "done";

function SignCat({ mood, mark }: { mood: Mood; mark: string }) {
  return (
    <svg viewBox="0 0 150 120" className="zcc-cat h-24 w-28 shrink-0" role="img" aria-label="Cat holding a letter sign">
      <g className="zcc-tail" style={{ transformOrigin: "112px 100px" }}>
        <path d="M108 102 C134 102 142 80 130 66" fill="none" stroke="#f0abfc" strokeWidth="9" strokeLinecap="round" />
      </g>
      <ellipse cx="75" cy="104" rx="40" ry="16" fill="#f5d0fe" />
      <g className="zcc-head" style={{ transformOrigin: "75px 70px" }}>
        <path d="M44 52 L48 24 L68 40 Z" fill="#f0abfc" />
        <path d="M106 52 L102 24 L82 40 Z" fill="#f0abfc" />
        <path d="M50 44 L52 32 L61 40 Z" fill="#fdf4ff" />
        <path d="M100 44 L98 32 L89 40 Z" fill="#fdf4ff" />
        <ellipse cx="75" cy="64" rx="34" ry="29" fill="#f5d0fe" />
        <ellipse cx="75" cy="74" rx="13" ry="9" fill="#fdf4ff" />
        <g className="zcc-eyes">
          {mood === "done" ? (
            <>
              <path d="M54 62 Q60 54 66 62" fill="none" stroke="#4a044e" strokeWidth="3" strokeLinecap="round" />
              <path d="M84 62 Q90 54 96 62" fill="none" stroke="#4a044e" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="60" cy="62" r="5.2" fill="#4a044e" />
              <circle cx="90" cy="62" r="5.2" fill="#4a044e" />
              <circle cx="61.8" cy="60.2" r="1.7" fill="#fff" />
              <circle cx="91.8" cy="60.2" r="1.7" fill="#fff" />
            </>
          )}
        </g>
        <path d="M72 71 L78 71 L75 75 Z" fill="#c026d3" />
        <path d="M75 75 Q70 80 66 77 M75 75 Q80 80 84 77" fill="none" stroke="#4a044e" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="46" cy="76" r="5.5" fill="#fda4af" opacity="0.55" />
        <circle cx="104" cy="76" r="5.5" fill="#fda4af" opacity="0.55" />
      </g>
      <g className="zcc-sign" style={{ transformOrigin: "75px 112px" }}>
        <rect x="48" y="90" width="54" height="26" rx="6" fill="#fff" stroke="#a21caf" strokeWidth="2.2" />
        <text x="75" y="109" textAnchor="middle" fontSize={mark.length > 2 ? 13 : 17} fontWeight="800" fontFamily="ui-monospace, monospace" fill="#86198f">{mark}</text>
      </g>
      <ellipse className="zcc-paw" cx="48" cy="108" rx="9" ry="6" fill="#fdf4ff" />
      <ellipse className="zcc-paw2" cx="102" cy="108" rx="9" ry="6" fill="#fdf4ff" />
    </svg>
  );
}

export default function CaseConverter({ initial }: { initial?: { mode?: string } }) {
  const { t, i18n } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;
  const lang = i18n?.language || "en";
  const nf = useMemo(() => new Intl.NumberFormat(lang), [lang]);

  const [text, setText] = useState("");
  const [mode, setMode] = useState<string>(initial?.mode ?? "sentence");
  const [opts, setOpts] = useState<Opts>({ small: true, acronyms: true, turkish: false, accents: false, perLine: true });
  const [history, setHistory] = useState<string[]>([]);
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
        const v = JSON.parse(raw) as { mode?: string; opts?: Partial<Opts> };
        if (v.mode && ALL_MODES.some((m) => m.id === v.mode)) setMode(v.mode);
        if (v.opts) setOpts((o) => ({ ...o, ...v.opts }));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (initial) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ mode, opts }));
    } catch {
      /* ignore */
    }
  }, [initial, mode, opts]);
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

  const result = useMemo(() => convert(deferred, mode, opts), [deferred, mode, opts]);
  const preview = useMemo(() => {
    const head = deferred.slice(0, 600);
    return ALL_MODES.map((m) => ({ ...m, out: convert(head, m.id, opts) }));
  }, [deferred, opts]);

  const hasText = text.length > 0;
  const mood: Mood = typing ? "typing" : hasText ? "done" : "idle";
  const current = ALL_MODES.find((m) => m.id === mode) ?? ALL_MODES[0];
  const isDev = CODE_MODES.some((m) => m.id === mode);

  const onType = (v: string) => {
    setText(v.slice(0, MAX_CHARS));
    setTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTyping(false), 1100);
  };

  const readFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 3 * 1024 * 1024 || !/^text\/|\.(txt|md|markdown|csv|html?)$/i.test(f.type + f.name)) {
      setMsg(tr("tool.caseconverter.errFile", "Only text files up to 3 MB can be opened (.txt, .md, .html)."));
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
      setMsg(tr("tool.caseconverter.errPaste", "Your browser did not allow pasting. Press Ctrl+V in the box instead."));
    }
  };

  const copy = async (id: string, value: string) => {
    await copyToClipboard(value);
    setCopied(id);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(""), 1600);
  };

  const download = () => {
    try {
      const blob = new Blob([convert(text, mode, opts)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${mode}-text.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMsg(tr("tool.caseconverter.errDownload", "The download could not be started."));
    }
  };

  const useAsInput = () => {
    const out = convert(text, mode, opts);
    if (!out) return;
    setHistory((h) => [...h.slice(-19), text]);
    setText(out);
  };
  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      setText(h[h.length - 1]);
      return h.slice(0, -1);
    });
  };

  const bubble = typing
    ? tr("tool.caseconverter.catTyping", "Ooh, shiny letters…")
    : hasText
      ? tr("tool.caseconverter.catDone", "Converted to {{mode}}!", { mode: current.label })
      : tr("tool.caseconverter.catIdle", "Type or paste and pick a case!");

  const card =
    "rounded-3xl border border-white/80 bg-white/75 shadow-[0_24px_60px_-30px_rgba(162,28,175,0.5)] ring-1 ring-fuchsia-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:ring-fuchsia-300/10";
  const btn2 =
    "inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-200 bg-white/85 px-3 py-2 text-xs font-bold text-fuchsia-900 transition hover:bg-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-fuchsia-900/60 dark:bg-slate-900/60 dark:text-fuchsia-100";
  const chip = (active: boolean) =>
    `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? "border-fuchsia-600 bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/30" : "border-fuchsia-200 bg-white/80 text-fuchsia-900 hover:bg-fuchsia-50 dark:border-fuchsia-900/60 dark:bg-slate-900/60 dark:text-fuchsia-100"}`;
  const setOpt = (k: keyof Opts) => (e: React.ChangeEvent<HTMLInputElement>) => setOpts((o) => ({ ...o, [k]: e.target.checked }));
  const checkbox = "h-4 w-4 accent-fuchsia-600";

  return (
    <div className="zcc-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-8">
      <style>{`
        @keyframes zcc-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,30px,0) scale(1.12); } }
        @keyframes zcc-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-70px,-25px,0) scale(0.94); } }
        @keyframes zcc-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zcc-float { 0%,100% { transform: translate3d(0,0,0) rotate(-6deg); opacity: 0.75; } 50% { transform: translate3d(14px,-26px,0) rotate(8deg); opacity: 0.35; } }
        @keyframes zcc-chip { 0%,100% { transform: translate3d(0,0,0); opacity: 0.5; } 50% { transform: translate3d(20px,-24px,0); opacity: 0.95; } }
        @keyframes zcc-march { to { stroke-dashoffset: -28; } }
        @keyframes zcc-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes zcc-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(9deg); } }
        @keyframes zcc-look { 0%,100% { transform: translateY(0); } 50% { transform: translateY(1.5px); } }
        @keyframes zcc-wave { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
        @keyframes zcc-pop { from { transform: scale(0.96); opacity: 0.4; } to { transform: scale(1); opacity: 1; } }
        @keyframes zcc-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        .zcc-blob { will-change: transform; }
        .zcc-blob-a { animation: zcc-blob-a 24s ease-in-out infinite; }
        .zcc-blob-b { animation: zcc-blob-b 30s ease-in-out infinite; }
        .zcc-blob-c { animation: zcc-blob-c 27s ease-in-out infinite; }
        .zcc-letter { position: absolute; font-weight: 800; line-height: 1; color: rgba(192,38,211,0.4); animation: zcc-float 11s ease-in-out infinite; }
        .zcc-chip { position: absolute; white-space: nowrap; animation: zcc-chip ease-in-out infinite; }
        .zcc-box rect { animation: zcc-march 1.6s linear infinite; }
        .zcc-cat .zcc-head { animation: zcc-bob 3.6s ease-in-out infinite; }
        .zcc-cat .zcc-tail { animation: zcc-tail 2.6s ease-in-out infinite; }
        .zcc-cat .zcc-eyes { animation: zcc-look 3s ease-in-out infinite; }
        .zcc-cat.zcc-active .zcc-sign { animation: zcc-wave 0.8s ease-in-out infinite; }
        .zcc-out { animation: zcc-pop 0.25s ease-out both; }
        .zcc-shine { position: relative; overflow: hidden; }
        .zcc-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%); transform: translateX(-130%); animation: zcc-shine 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .zcc-blob, .zcc-letter, .zcc-chip, .zcc-box rect, .zcc-cat *, .zcc-out, .zcc-shine::after { animation: none !important; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-50 via-violet-50 to-pink-50 dark:from-slate-950 dark:via-fuchsia-950/50 dark:to-slate-900" />
        <div className="zcc-blob zcc-blob-a absolute -left-24 -top-24 h-96 w-[34rem] rounded-full bg-gradient-to-r from-fuchsia-300/55 to-violet-200/40 blur-3xl dark:from-fuchsia-500/25 dark:to-violet-500/15" />
        <div className="zcc-blob zcc-blob-b absolute -right-28 top-1/3 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-pink-200/60 to-purple-200/40 blur-3xl dark:from-pink-400/15 dark:to-purple-500/15" />
        <div className="zcc-blob zcc-blob-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-violet-200/55 to-fuchsia-200/40 blur-3xl dark:from-violet-500/20 dark:to-fuchsia-500/15" />
        {BG_LETTERS.map((p, i) => (
          <span key={`l-${i}`} className="zcc-letter" style={{ left: `${p.left}%`, top: `${p.top}%`, fontSize: p.s, animationDelay: `${p.delay}s` } as CSSProperties}>{p.ch}</span>
        ))}
        {BG_CHIPS.map((g, i) => (
          <span
            key={`c-${i}`}
            className="zcc-chip rounded-full border border-fuchsia-200/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-fuchsia-800/80 dark:border-white/10 dark:bg-white/5 dark:text-fuchsia-200/60"
            style={{ left: `${g.left}%`, top: `${g.top}%`, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` } as CSSProperties}
          >
            {g.text}
          </span>
        ))}
      </div>

      {/* mascot */}
      <div className="mb-2 flex items-end gap-3 px-1">
        <div className="relative mb-4 max-w-xs rounded-2xl rounded-bl-sm border border-fuchsia-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-fuchsia-950 shadow-sm dark:border-fuchsia-300/20 dark:bg-slate-900/80 dark:text-fuchsia-100">{bubble}</div>
        <div className={typing ? "zcc-cat zcc-active" : "zcc-cat"}>
          <SignCat mood={mood} mark={current.mark} />
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
          <label htmlFor="cc-text" className="text-xs font-bold text-ink-700 dark:text-ink-200">
            {tr("tool.caseconverter.inputLabel", "Type or paste your text")}
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={paste} className={btn2}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {tr("tool.caseconverter.paste", "Paste")}
            </button>
            <button type="button" onClick={() => onType(SAMPLE)} className={btn2}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {tr("tool.caseconverter.example", "Try an example")}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={btn2}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              {tr("tool.caseconverter.openFile", "Open a .txt file")}
            </button>
            <button type="button" onClick={() => { setText(""); setMsg(""); setHistory([]); }} disabled={!text} className={btn2}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {tr("tool.caseconverter.clear", "Clear")}
            </button>
            <input ref={fileRef} type="file" accept=".txt,.md,.markdown,.csv,.html,.htm,text/*" className="sr-only" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </div>
        <div className={`zcc-box relative rounded-2xl p-1 transition ${drag ? "bg-fuchsia-100/80 dark:bg-fuchsia-400/10" : ""}`}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <rect x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="16" fill="none" strokeWidth="2" strokeDasharray="10 8" className={drag ? "stroke-fuchsia-500" : "stroke-fuchsia-300/80 dark:stroke-fuchsia-300/40"} />
          </svg>
          <textarea
            id="cc-text"
            value={text}
            onChange={(e) => onType(e.target.value)}
            placeholder={tr("tool.caseconverter.placeholder", "Type or paste your text here, or drop a text file…")}
            rows={7}
            spellCheck={false}
            className="box-border block w-full resize-y rounded-xl border-0 bg-white/80 p-4 font-sans text-sm leading-7 text-ink-900 outline-none focus:ring-2 focus:ring-fuchsia-300/70 dark:bg-slate-950/50 dark:text-white"
          />
        </div>
        {msg && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {msg}
          </p>
        )}
        <p className="mt-2 text-[11px] text-ink-500 dark:text-ink-400">
          {tr("tool.caseconverter.privacy", "Your text stays in your browser. Nothing is uploaded or saved.")} · {nf.format(Array.from(text).length)} {tr("tool.caseconverter.chars", "characters")}
        </p>
      </section>

      {/* modes + result */}
      <section className={`${card} mt-5 p-4 sm:p-6`} aria-live="polite">
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-ink-500 dark:text-ink-400">{tr("tool.caseconverter.groupText", "Text cases")}</h2>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={tr("tool.caseconverter.groupText", "Text cases")}>
          {TEXT_MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => setMode(m.id)} className={chip(mode === m.id)}>{m.label}</button>
          ))}
        </div>
        <h2 className="mt-4 text-xs font-extrabold uppercase tracking-wide text-ink-500 dark:text-ink-400">{tr("tool.caseconverter.groupCode", "Developer cases")}</h2>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={tr("tool.caseconverter.groupCode", "Developer cases")}>
          {CODE_MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => setMode(m.id)} className={chip(mode === m.id)}>{m.label}</button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-ink-700 dark:text-ink-200">
          {mode === "title" && (
            <>
              <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={opts.small} onChange={setOpt("small")} className={checkbox} />{tr("tool.caseconverter.optSmall", "Keep small words lower case (a, the, of…)")}</label>
              <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={opts.acronyms} onChange={setOpt("acronyms")} className={checkbox} />{tr("tool.caseconverter.optAcronyms", "Keep short ALL-CAPS words")}</label>
            </>
          )}
          {isDev && (
            <>
              <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={opts.perLine} onChange={setOpt("perLine")} className={checkbox} />{tr("tool.caseconverter.optPerLine", "Convert each line separately")}</label>
              <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={opts.accents} onChange={setOpt("accents")} className={checkbox} />{tr("tool.caseconverter.optAccents", "Remove accents (é becomes e)")}</label>
            </>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={opts.turkish} onChange={setOpt("turkish")} className={checkbox} />{tr("tool.caseconverter.optTurkish", "Turkish letters (İ and ı)")}</label>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-ink-900 dark:text-white">{tr("tool.caseconverter.resultTitle", "Result")} · {current.label}</h3>
          </div>
          <div className="min-h-[7rem] rounded-2xl border border-fuchsia-100 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/50">
            {result ? (
              <pre key={mode + result.length} className="zcc-out m-0 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-ink-900 dark:text-white">{result}</pre>
            ) : (
              <p className="text-sm text-ink-400">{tr("tool.caseconverter.resultEmpty", "The converted text will appear here.")}</p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={!result} onClick={() => void copy("res", result)} className={`${btn2} zcc-shine`}>
              {copied === "res" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied === "res" ? tr("tool.caseconverter.copied", "Copied") : tr("tool.caseconverter.copy", "Copy result")}
            </button>
            <button type="button" disabled={!result} onClick={download} className={btn2}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              {tr("tool.caseconverter.download", "Download .txt")}
            </button>
            <button type="button" disabled={!result} onClick={useAsInput} className={btn2}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {tr("tool.caseconverter.useAsInput", "Use result as input")}
            </button>
            <button type="button" disabled={!history.length} onClick={undo} className={btn2}>
              {tr("tool.caseconverter.undo", "Undo")}
            </button>
          </div>
        </div>
      </section>

      {/* all at a glance */}
      <section className={`${card} mt-5 p-4 sm:p-6`}>
        <h2 className="text-sm font-extrabold text-ink-900 dark:text-white">{tr("tool.caseconverter.allTitle", "All cases at a glance")}</h2>
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{tr("tool.caseconverter.allHint", "Click a card to pick it, or copy any of them.")}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((p) => (
            <li key={p.id} className={`flex flex-col rounded-2xl border p-3 ${mode === p.id ? "border-fuchsia-400 bg-fuchsia-50/80 dark:border-fuchsia-400/50 dark:bg-fuchsia-400/10" : "border-fuchsia-100 bg-white/70 dark:border-white/10 dark:bg-white/5"}`}>
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setMode(p.id)} className="truncate text-left text-xs font-extrabold text-fuchsia-900 hover:underline dark:text-fuchsia-100">{p.label}</button>
                <button type="button" disabled={!p.out} onClick={() => void copy(`p-${p.id}`, convert(text, p.id, opts))} aria-label={tr("tool.caseconverter.copyAs", "Copy as {{mode}}", { mode: p.label })} className="shrink-0 rounded-lg p-1.5 text-fuchsia-700 transition hover:bg-fuchsia-100 disabled:opacity-40 dark:text-fuchsia-200 dark:hover:bg-white/10">
                  {copied === `p-${p.id}` ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <p className="mt-2 max-h-[3.75rem] overflow-hidden break-words text-xs leading-5 text-ink-700 dark:text-ink-300">{p.out || "—"}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* guide */}
      <article className="mt-8 rounded-3xl border border-white/80 bg-white/70 p-5 ring-1 ring-fuchsia-200/50 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-900/60 dark:ring-fuchsia-300/10">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl dark:text-white">{tr("tool.caseconverter.guideTitle", "How the case converter works")}</h2>
        <p className="mt-3 text-sm leading-7 text-ink-700 dark:text-ink-300">
          {tr("tool.caseconverter.guideIntro", "Type or paste your text and pick a case. You can write in sentence case, lower case, UPPER CASE, Capitalized Case or Title Case, or turn names into camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, dot.case or Train-Case for code. Everything is converted in your browser and your text is never uploaded.")}
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.caseconverter.titleTitle", "Title Case and Capitalized Case")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.caseconverter.titleText", "Capitalized Case starts every word with a capital letter. Title Case follows the common headline style: small words such as a, the, of and to stay lower case unless they are first or last. Style guides differ in the details, so check the one you must follow.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.caseconverter.sentenceTitle", "Sentence case")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.caseconverter.sentenceText", "Sentence case writes everything in lower case and then capitalises the first letter of each sentence. Names, places and acronyms are not detected, so capitalise those yourself after converting.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.caseconverter.devTitle", "Developer cases")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.caseconverter.devText", "Words are found even when your input is already in another style, so userProfile, user_profile and User Profile all give the same result. Turn on Remove accents if your code cannot use accented letters. Each line is converted separately, which is handy for lists of names.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.caseconverter.langTitle", "Other alphabets")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.caseconverter.langText", "Accented letters, Greek and Cyrillic are converted correctly. Arabic, Hebrew and Chinese have no upper and lower case, so those letters stay as they are. For Turkish, turn on the Turkish option so that i becomes İ and I becomes ı.")}
            </p>
          </section>
        </div>
        <section className="mt-6">
          <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.caseconverter.linksTitle", "More free writing tools")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {[
              { slug: "word-counter", fb: "Word Counter" },
              { slug: "sentence-counter", fb: "Sentence Counter" },
              { slug: "reading-time-calculator", fb: "Reading Time Calculator" },
              { slug: "text-to-slug", fb: "Text to Slug" },
              { slug: "ai-grammar-checker", fb: "Grammar Checker" },
              { slug: "text-diff-checker", fb: "Text Diff Checker" },
            ].map((l) => (
              <li key={l.slug}>
                <Link to={`/tools/${l.slug}`} className="inline-flex rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-fuchsia-900 transition hover:bg-fuchsia-100 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-100">
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
