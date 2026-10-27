import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Copy, Download, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";

/* ------------------------------------------------------------------ logic
 * The page calls the site's own /api/youtube?action=video endpoint (one call per link).
 * Everything after that (links, hashtags, timestamps, counts) is computed in the browser.
 */

const MAX_URLS = 10;
const MAX_INPUT = 4000;

type VideoData = {
  id?: string;
  title?: string;
  description?: string;
  channelTitle?: string;
  viewCount?: number | null;
  lengthSeconds?: number;
  publishedAt?: string;
  source?: string;
};

type Row = {
  key: string;
  url: string;
  id: string;
  status: "loading" | "done" | "error";
  data?: VideoData;
  error?: string;
};

function videoIdOf(input: string): string {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = u.hostname.toLowerCase().replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return (u.pathname.split("/").filter(Boolean)[0] ?? "").slice(0, 11);
    if (!/(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$/.test(host)) return "";
    const v = u.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    return u.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/)?.[1] ?? "";
  } catch {
    return "";
  }
}

function parseInput(text: string): string[] {
  const tokens = text.split(/\s+|,/).map((x) => x.trim()).filter(Boolean);
  // keep anything that is, or looks like, a link; a stray sentence becomes one invalid entry
  let parts = tokens.filter((x) => videoIdOf(x) || /[./]/.test(x));
  if (parts.length === 0 && text.trim()) parts = [text.trim().slice(0, 80)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = videoIdOf(p) || p;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out.slice(0, MAX_URLS);
}

async function fetchVideo(url: string): Promise<VideoData> {
  const r = await fetch(`/api/youtube?${new URLSearchParams({ action: "video", url })}`, { headers: { accept: "application/json" } });
  const raw = await r.text();
  let j: { ok?: boolean; error?: string; data?: VideoData } | null = null;
  try {
    j = JSON.parse(raw);
  } catch {
    throw new Error("bad-response");
  }
  if (!r.ok || !j?.ok || !j.data) throw new Error(j?.error || `http-${r.status}`);
  return j.data;
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
const TAG_RE = /(?:^|\s)(#[\p{L}\p{N}_]{2,})/gu;
const TIME_RE = /^\s*[\-–•*]?\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\b\s*[\-–—:]?\s*(.*)$/;

function analyse(description: string) {
  const links = [...new Set((description.match(URL_RE) ?? []).map((l) => l.replace(/[.,;:!?]+$/, "")))];
  const tags = [...new Set([...description.matchAll(TAG_RE)].map((m) => m[1]!))];
  const stamps: { time: string; label: string }[] = [];
  for (const line of description.split(/\r?\n/)) {
    const m = TIME_RE.exec(line);
    if (m) stamps.push({ time: m[1]!, label: m[2]!.trim() });
  }
  const words = (description.match(/[\p{L}\p{N}']+/gu) ?? []).length;
  return { links, tags, stamps, words, chars: description.length, lines: description ? description.split(/\r?\n/).length : 0 };
}

function fmtDuration(sec: number): string {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function safeName(s: string): string {
  return (s || "description").replace(/[\\/:*?"<>|\n\r]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "description";
}

function saveText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ------------------------------------------------------------------ visuals */

const BG_SHAPES = [
  { left: 5, top: 16, s: 26, delay: 0, c: "text-rose-300/70" },
  { left: 16, top: 70, s: 20, delay: 2, c: "text-amber-300/70" },
  { left: 33, top: 8, s: 18, delay: 4, c: "text-orange-300/70" },
  { left: 52, top: 84, s: 28, delay: 1, c: "text-rose-300/60" },
  { left: 68, top: 12, s: 22, delay: 3, c: "text-amber-300/70" },
  { left: 82, top: 66, s: 24, delay: 5, c: "text-orange-300/60" },
  { left: 93, top: 24, s: 18, delay: 2.5, c: "text-rose-300/70" },
];

const BG_CHIPS = [
  { text: "#shorts", left: 6, top: 38, dur: 24, delay: -4 },
  { text: "00:00 Intro", left: 72, top: 30, dur: 28, delay: -11 },
  { text: "https://", left: 48, top: 72, dur: 26, delay: -16 },
  { text: "#tutorial", left: 84, top: 78, dur: 30, delay: -7 },
  { text: "02:45 Chapter", left: 20, top: 88, dur: 27, delay: -2 },
];

/** the cat walks along the link box as you type, chases the link while it loads, and sits happy when done */
function WalkingCat({ x, mode }: { x: number; mode: "idle" | "typing" | "busy" | "done" }) {
  return (
    <div
      className="zyd-walker pointer-events-none absolute -top-[3.6rem] z-10 w-24"
      style={{ left: `calc(${(x * 100).toFixed(2)}% - ${(x * 6).toFixed(2)}rem)` }}
      data-mode={mode}
      aria-hidden="true"
    >
      <svg viewBox="0 0 90 70" className="zyd-cat h-[5rem] w-24 overflow-visible">
        <g className="zyd-tail" style={{ transformOrigin: "70px 50px" }}>
          <path d="M68 52 C86 52 90 36 80 28" fill="none" stroke="#fdba74" strokeWidth="6" strokeLinecap="round" />
        </g>
        <g className="zyd-body">
          <ellipse cx="42" cy="54" rx="26" ry="12" fill="#fed7aa" />
          <g className="zyd-legs">
            <rect className="zyd-leg zyd-leg-a" x="24" y="58" width="7" height="9" rx="3.5" fill="#fdba74" />
            <rect className="zyd-leg zyd-leg-b" x="36" y="58" width="7" height="9" rx="3.5" fill="#fdba74" />
            <rect className="zyd-leg zyd-leg-b" x="48" y="58" width="7" height="9" rx="3.5" fill="#fdba74" />
            <rect className="zyd-leg zyd-leg-a" x="58" y="58" width="7" height="9" rx="3.5" fill="#fdba74" />
          </g>
        </g>
        <g className="zyd-head" style={{ transformOrigin: "32px 38px" }}>
          <path d="M16 28 L19 8 L33 20 Z" fill="#fdba74" />
          <path d="M48 28 L45 8 L31 20 Z" fill="#fdba74" />
          <path d="M20 24 L21 14 L28 20 Z" fill="#fff1e6" />
          <path d="M44 24 L43 14 L36 20 Z" fill="#fff1e6" />
          <ellipse cx="32" cy="34" rx="20" ry="17" fill="#fed7aa" />
          <ellipse cx="32" cy="40" rx="9" ry="6.5" fill="#fff7ed" />
          {mode === "done" ? (
            <>
              <path d="M19 33 Q23 27 27 33" fill="none" stroke="#7c2d12" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M37 33 Q41 27 45 33" fill="none" stroke="#7c2d12" strokeWidth="2.2" strokeLinecap="round" />
            </>
          ) : (
            <g className="zyd-eyes" style={{ transformOrigin: "32px 33px" }}>
              <ellipse cx="23" cy="33" rx="3.6" ry={mode === "busy" ? 2.4 : 4.2} fill="#7c2d12" />
              <ellipse cx="41" cy="33" rx="3.6" ry={mode === "busy" ? 2.4 : 4.2} fill="#7c2d12" />
              <circle cx="24.2" cy="31.6" r="1.2" fill="#fff" />
              <circle cx="42.2" cy="31.6" r="1.2" fill="#fff" />
            </g>
          )}
          <path d="M30 38 L34 38 L32 41 Z" fill="#c2410c" />
          <path d="M32 41 Q29 44 26.5 42.5 M32 41 Q35 44 37.5 42.5" fill="none" stroke="#7c2d12" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="14" cy="40" r="3.6" fill="#fda4af" opacity="0.55" />
          <circle cx="50" cy="40" r="3.6" fill="#fda4af" opacity="0.55" />
          <path d="M13 37 L3 35 M13 41 L3 43 M51 37 L61 35 M51 41 L61 43" stroke="#fb923c" strokeWidth="1.1" strokeLinecap="round" />
        </g>
        <g className="zyd-ball">
          <circle cx="78" cy="62" r="5.5" fill="#fb7185" />
          <path d="M74 60 L82 64 M75 66 L81 58" stroke="#fff" strokeWidth="1" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

function PlayLogo({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ component */

export default function YouTubeDescriptionExtractor() {
  const { t, i18n } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;
  const lang = i18n?.language || "en";
  const nf = useMemo(() => new Intl.NumberFormat(lang), [lang]);

  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState("");
  const [typing, setTyping] = useState(false);
  const [msg, setMsg] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const typingTimer = useRef<number | undefined>(undefined);
  const copyTimer = useRef<number | undefined>(undefined);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () => () => {
      runRef.current++;
      window.clearTimeout(typingTimer.current);
      window.clearTimeout(copyTimer.current);
    },
    [],
  );

  // the textarea grows with its content (up to 5 lines)
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input]);

  const loading = rows.some((r) => r.status === "loading");
  const done = rows.filter((r) => r.status === "done").length;

  const catMode: "idle" | "typing" | "busy" | "done" = loading ? "busy" : typing ? "typing" : done > 0 ? "done" : "idle";
  const lastLine = input.split(/\r?\n/).pop() ?? "";
  // 0 → 1 position along the box: follows what you type, runs to the end while it works
  const catX = loading ? 0.92 : done > 0 && !typing ? 0.82 : Math.min(0.9, 0.02 + lastLine.length / 70);

  const bubble = loading
    ? tr("tool.ytdesc.catBusy", "Fetching the description…")
    : typing
      ? tr("tool.ytdesc.catTyping", "Nice link! Keep going…")
      : done > 0
        ? tr("tool.ytdesc.catDone", "Got it! Copy what you need.")
        : tr("tool.ytdesc.catIdle", "Paste a YouTube link and I'll fetch it!");

  const onType = (v: string) => {
    setInput(v.slice(0, MAX_INPUT));
    setTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTyping(false), 1400);
  };

  const run = useCallback(async () => {
    const urls = parseInput(input);
    if (urls.length === 0) {
      setMsg(tr("tool.ytdesc.errEmpty", "Paste at least one YouTube link."));
      return;
    }
    const run = ++runRef.current;
    setMsg("");
    const fresh: Row[] = urls.map((u, i) => ({ key: `${run}-${i}`, url: u, id: videoIdOf(u), status: "loading" }));
    setRows(fresh);
    for (const row of fresh) {
      if (runRef.current !== run) return;
      if (!row.id) {
        setRows((prev) => prev.map((p) => (p.key === row.key ? { ...p, status: "error", error: tr("tool.ytdesc.errLink", "This is not a valid YouTube video link.") } : p)));
        continue;
      }
      try {
        const data = await fetchVideo(row.id);
        if (runRef.current !== run) return;
        setRows((prev) => prev.map((p) => (p.key === row.key ? { ...p, status: "done", data } : p)));
      } catch (e) {
        if (runRef.current !== run) return;
        const m = e instanceof Error ? e.message : "";
        const text = /bad-response|http-5/.test(m)
          ? tr("tool.ytdesc.errServer", "YouTube could not be reached right now. Please try again in a moment.")
          : /not found|unavailable|private|404/i.test(m)
            ? tr("tool.ytdesc.errMissing", "This video is private, removed or unavailable.")
            : tr("tool.ytdesc.errFetch", "The description could not be loaded for this video.");
        setRows((prev) => prev.map((p) => (p.key === row.key ? { ...p, status: "error", error: text } : p)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const paste = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) onType(input ? `${input.trim()}\n${txt.trim()}` : txt.trim());
    } catch {
      setMsg(tr("tool.ytdesc.errPaste", "Your browser did not allow pasting. Press Ctrl+V in the box instead."));
    }
  };

  const copy = async (id: string, text: string) => {
    if (!text) return;
    await copyToClipboard(text);
    setCopied(id);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(""), 1600);
  };

  const reset = () => {
    runRef.current++;
    setRows([]);
    setInput("");
    setMsg("");
  };

  const doneRows = rows.filter((r) => r.status === "done" && r.data);
  const downloadAll = () => {
    const body = doneRows
      .map((r) => `${r.data!.title ?? ""}\nhttps://www.youtube.com/watch?v=${r.id}\n${"-".repeat(40)}\n${r.data!.description ?? ""}`)
      .join("\n\n==========\n\n");
    saveText("youtube-descriptions.txt", body);
  };

  const card =
    "rounded-3xl border border-white/80 bg-white/75 shadow-[0_24px_60px_-30px_rgba(225,29,72,0.45)] ring-1 ring-rose-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:ring-rose-300/10";
  const btn2 =
    "inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white/85 px-3 py-2 text-xs font-bold text-rose-800 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/60 dark:bg-slate-900/60 dark:text-rose-100";

  return (
    <div className="zyd-root relative isolate overflow-hidden rounded-[2rem] p-3 pt-16 sm:p-8 sm:pt-20">
      <style>{`
        @keyframes zyd-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,30px,0) scale(1.12); } }
        @keyframes zyd-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-70px,-25px,0) scale(0.94); } }
        @keyframes zyd-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zyd-float { 0%,100% { transform: translate3d(0,0,0) rotate(0deg); opacity: 0.8; } 50% { transform: translate3d(12px,-26px,0) rotate(18deg); opacity: 0.4; } }
        @keyframes zyd-chip { 0%,100% { transform: translate3d(0,0,0); opacity: 0.5; } 50% { transform: translate3d(20px,-24px,0); opacity: 0.95; } }
        @keyframes zyd-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes zyd-march { to { stroke-dashoffset: -28; } }
        @keyframes zyd-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes zyd-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(10deg); } }
        @keyframes zyd-blink { 0%,92%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes zyd-step-a { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes zyd-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-9px); } }
        @keyframes zyd-roll { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes zyd-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        @keyframes zyd-skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .zyd-blob { will-change: transform; }
        .zyd-blob-a { animation: zyd-blob-a 24s ease-in-out infinite; }
        .zyd-blob-b { animation: zyd-blob-b 30s ease-in-out infinite; }
        .zyd-blob-c { animation: zyd-blob-c 27s ease-in-out infinite; }
        .zyd-shape { position: absolute; animation: zyd-float 10s ease-in-out infinite; }
        .zyd-chip { position: absolute; white-space: nowrap; animation: zyd-chip ease-in-out infinite; }
        .zyd-rise { animation: zyd-rise 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .zyd-box rect { animation: zyd-march 1.6s linear infinite; }
        .zyd-walker { transition: left 0.55s cubic-bezier(0.34,1.4,0.64,1); }
        .zyd-walker[data-mode="busy"] { transition-duration: 1.1s; }
        .zyd-cat .zyd-head { animation: zyd-bob 3.6s ease-in-out infinite; }
        .zyd-cat .zyd-tail { animation: zyd-tail 2.6s ease-in-out infinite; }
        .zyd-cat .zyd-eyes { animation: zyd-blink 5.5s ease-in-out infinite; }
        .zyd-cat .zyd-ball { opacity: 0; transform-box: fill-box; transform-origin: center; }
        .zyd-walker[data-mode="typing"] .zyd-leg-a, .zyd-walker[data-mode="busy"] .zyd-leg-a { animation: zyd-step-a 0.38s ease-in-out infinite; }
        .zyd-walker[data-mode="typing"] .zyd-leg-b, .zyd-walker[data-mode="busy"] .zyd-leg-b { animation: zyd-step-a 0.38s ease-in-out infinite reverse; }
        .zyd-walker[data-mode="busy"] .zyd-ball { opacity: 1; animation: zyd-roll 0.7s linear infinite; }
        .zyd-walker[data-mode="done"] .zyd-body { animation: zyd-hop 1.8s ease-in-out infinite; }
        .zyd-shine { position: relative; overflow: hidden; }
        .zyd-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%); transform: translateX(-130%); animation: zyd-shine 4.5s ease-in-out infinite; }
        .zyd-skel { background: linear-gradient(90deg, rgba(244,63,94,0.10) 25%, rgba(244,63,94,0.22) 50%, rgba(244,63,94,0.10) 75%); background-size: 200% 100%; animation: zyd-skel 1.4s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .zyd-blob, .zyd-shape, .zyd-chip, .zyd-rise, .zyd-box rect, .zyd-cat *, .zyd-shine::after, .zyd-skel { animation: none !important; }
          .zyd-walker { transition: none; }
        }
      `}</style>

      {/* animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-rose-950/50 dark:to-slate-900" />
        <div className="zyd-blob zyd-blob-a absolute -left-24 -top-24 h-96 w-[34rem] rounded-full bg-gradient-to-r from-rose-300/55 to-orange-200/40 blur-3xl dark:from-rose-500/25 dark:to-orange-500/15" />
        <div className="zyd-blob zyd-blob-b absolute -right-28 top-1/3 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-amber-200/60 to-pink-200/40 blur-3xl dark:from-amber-400/15 dark:to-pink-500/15" />
        <div className="zyd-blob zyd-blob-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-orange-200/55 to-rose-200/40 blur-3xl dark:from-orange-500/20 dark:to-rose-500/15" />
        {BG_SHAPES.map((p, i) => (
          <PlayLogo key={`s-${i}`} className={`zyd-shape ${p.c}`} style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.s, height: p.s, animationDelay: `${p.delay}s` }} />
        ))}
        {BG_CHIPS.map((g, i) => (
          <span
            key={`c-${i}`}
            className="zyd-chip rounded-full border border-rose-200/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-rose-700/80 dark:border-white/10 dark:bg-white/5 dark:text-rose-200/60"
            style={{ left: `${g.left}%`, top: `${g.top}%`, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` } as CSSProperties}
          >
            {g.text}
          </span>
        ))}
      </div>

      {/* link box with the walking cat */}
      <section className={`${card} p-3 sm:p-5`}>
        <div className="relative">
          <WalkingCat x={catX} mode={catMode} />
          <div className="absolute -top-[2.7rem] left-0 hidden max-w-[16rem] rounded-2xl rounded-bl-sm border border-rose-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-rose-900 shadow-sm sm:block dark:border-rose-300/20 dark:bg-slate-900/80 dark:text-rose-100">
            {bubble}
          </div>
          <div ref={boxRef} className="zyd-box relative rounded-2xl bg-white/60 p-3 dark:bg-white/5">
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              <rect x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="16" fill="none" strokeWidth="2" strokeDasharray="10 8" className="stroke-rose-400/80 dark:stroke-rose-300/50" />
            </svg>
            <label htmlFor="ytd-input" className="mb-1.5 block px-1 text-xs font-bold text-ink-700 dark:text-ink-200">
              {tr("tool.ytdesc.label", "YouTube video link (one per line, up to {{n}})", { n: MAX_URLS })}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <textarea
                id="ytd-input"
                ref={taRef}
                rows={1}
                value={input}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void run();
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=…"
                spellCheck={false}
                autoComplete="off"
                className="box-border block min-h-[3rem] flex-1 resize-none rounded-xl border border-rose-200 bg-white/90 px-4 py-3 font-sans text-sm text-ink-900 shadow-inner outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200/70 dark:border-rose-900/50 dark:bg-slate-950/60 dark:text-white"
              />
              <div className="flex gap-2">
                <button type="button" onClick={paste} className={`${btn2} min-h-[3rem] px-4`}>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  {tr("tool.ytdesc.paste", "Paste")}
                </button>
                <button
                  type="button"
                  onClick={() => void run()}
                  disabled={loading}
                  className="zyd-shine inline-flex min-h-[3rem] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 px-6 text-sm font-extrabold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80 sm:flex-none"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                  {loading ? tr("tool.ytdesc.fetching", "Fetching…") : tr("tool.ytdesc.extract", "Extract description")}
                </button>
              </div>
            </div>
            <p className="mt-2 px-1 text-[11px] text-ink-500 dark:text-ink-400">{tr("tool.ytdesc.hint", "Works with watch, youtu.be, Shorts and live links. Only public videos can be read.")}</p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-rose-900 sm:hidden dark:text-rose-100">{bubble}</p>
        {msg && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {msg}
          </p>
        )}
      </section>

      {/* results */}
      {rows.length > 0 && (
        <section className="mt-5 space-y-4" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 className="text-sm font-extrabold text-ink-900 dark:text-white">{tr("tool.ytdesc.results", "Results")}</h2>
            <div className="flex flex-wrap gap-2">
              {doneRows.length > 1 && (
                <button type="button" onClick={downloadAll} className={btn2}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {tr("tool.ytdesc.downloadAll", "Download all (.txt)")}
                </button>
              )}
              <button type="button" onClick={reset} className={btn2}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {tr("tool.ytdesc.clear", "Clear")}
              </button>
            </div>
          </div>

          {rows.map((r) => {
            if (r.status === "loading") {
              return (
                <article key={r.key} className={`${card} zyd-rise p-4 sm:p-6`}>
                  <div className="flex gap-4">
                    <div className="zyd-skel h-24 w-40 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="zyd-skel h-4 w-2/3 rounded" />
                      <div className="zyd-skel h-3 w-1/3 rounded" />
                      <div className="zyd-skel h-3 w-full rounded" />
                      <div className="zyd-skel h-3 w-5/6 rounded" />
                    </div>
                  </div>
                </article>
              );
            }
            if (r.status === "error") {
              return (
                <article key={r.key} className={`${card} zyd-rise flex items-start gap-3 p-4 sm:p-5`}>
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink-900 dark:text-white">{r.url}</p>
                    <p className="mt-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">{r.error}</p>
                  </div>
                </article>
              );
            }
            const d = r.data!;
            const desc = d.description ?? "";
            const a = analyse(desc);
            const hasDesc = desc.trim().length > 0;
            const blocked = d.source === "youtube-oembed";
            return (
              <article key={r.key} className={`${card} zyd-rise p-4 sm:p-6`}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <img
                    src={`/api/youtube?action=thumbnail&videoId=${r.id}&size=hqdefault`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full shrink-0 rounded-xl bg-rose-100 object-cover sm:w-52 dark:bg-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-extrabold leading-snug text-ink-900 dark:text-white">{d.title || r.id}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-600 dark:text-ink-300">
                      {d.channelTitle && <span className="font-semibold">{d.channelTitle}</span>}
                      {d.lengthSeconds ? <span>· {fmtDuration(d.lengthSeconds)}</span> : null}
                      {typeof d.viewCount === "number" ? <span>· {tr("tool.ytdesc.views", "{{n}} views", { n: nf.format(d.viewCount) })}</span> : null}
                      {d.publishedAt ? <span>· {d.publishedAt.slice(0, 10)}</span> : null}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-800 dark:bg-rose-400/15 dark:text-rose-100">{tr("tool.ytdesc.nChars", "{{n}} characters", { n: nf.format(a.chars) })}</span>
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-800 dark:bg-orange-400/15 dark:text-orange-100">{tr("tool.ytdesc.nWords", "{{n}} words", { n: nf.format(a.words) })}</span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800 dark:bg-amber-400/15 dark:text-amber-100">{tr("tool.ytdesc.nLinks", "{{n}} links", { n: a.links.length })}</span>
                      <span className="rounded-full bg-pink-100 px-2.5 py-1 text-pink-800 dark:bg-pink-400/15 dark:text-pink-100">{tr("tool.ytdesc.nTags", "{{n}} hashtags", { n: a.tags.length })}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {hasDesc ? (
                    <>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wide text-ink-500 dark:text-ink-400">{tr("tool.ytdesc.full", "Full description")}</h4>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => void copy(`${r.key}-d`, desc)} className={btn2}>
                            {copied === `${r.key}-d` ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                            {copied === `${r.key}-d` ? tr("tool.ytdesc.copied", "Copied") : tr("tool.ytdesc.copy", "Copy description")}
                          </button>
                          <button type="button" onClick={() => saveText(`${safeName(d.title ?? "")}.txt`, desc)} className={btn2}>
                            <Download className="h-4 w-4" aria-hidden="true" />
                            {tr("tool.ytdesc.download", "Download .txt")}
                          </button>
                        </div>
                      </div>
                      <textarea
                        readOnly
                        value={desc}
                        rows={Math.min(14, Math.max(5, a.lines + 1))}
                        className="box-border block w-full resize-y rounded-xl border border-rose-100 bg-white/85 p-3 font-sans text-sm leading-6 text-ink-800 outline-none dark:border-white/10 dark:bg-slate-950/50 dark:text-ink-100"
                      />
                    </>
                  ) : (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                      {blocked
                        ? tr("tool.ytdesc.limited", "YouTube only returned the basic details for this video, so the description could not be read. Try again later.")
                        : tr("tool.ytdesc.noDesc", "This video has no description.")}
                    </p>
                  )}
                </div>

                {hasDesc && (a.links.length > 0 || a.tags.length > 0 || a.stamps.length > 0) && (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {[
                      { id: "l", title: tr("tool.ytdesc.links", "Links"), items: a.links, text: a.links.join("\n") },
                      { id: "h", title: tr("tool.ytdesc.hashtags", "Hashtags"), items: a.tags, text: a.tags.join(" ") },
                      { id: "t", title: tr("tool.ytdesc.timestamps", "Timestamps"), items: a.stamps.map((s) => `${s.time} ${s.label}`.trim()), text: a.stamps.map((s) => `${s.time} ${s.label}`.trim()).join("\n") },
                    ].map((box) => (
                      <div key={box.id} className="rounded-2xl border border-rose-100 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-ink-800 dark:text-ink-100">
                            {box.title} <span className="font-semibold text-ink-400">({box.items.length})</span>
                          </h4>
                          <button type="button" disabled={box.items.length === 0} onClick={() => void copy(`${r.key}-${box.id}`, box.text)} className="rounded-lg p-1.5 text-rose-700 transition hover:bg-rose-50 disabled:opacity-30 dark:text-rose-200 dark:hover:bg-white/10" aria-label={`${tr("tool.ytdesc.copyShort", "Copy")} ${box.title}`}>
                            {copied === `${r.key}-${box.id}` ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </div>
                        {box.items.length === 0 ? (
                          <p className="text-xs text-ink-400">{tr("tool.ytdesc.none", "None found")}</p>
                        ) : (
                          <ul className="max-h-40 space-y-1 overflow-auto text-xs text-ink-700 dark:text-ink-200">
                            {box.items.slice(0, 40).map((it, i) => (
                              <li key={`${it}-${i}`} className="break-all">
                                {box.id === "l" ? (
                                  <a href={it} target="_blank" rel="noopener noreferrer nofollow" className="text-rose-700 underline-offset-2 hover:underline dark:text-rose-300">
                                    {it}
                                  </a>
                                ) : (
                                  it
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* guide */}
      <article className="mt-8 rounded-3xl border border-white/80 bg-white/70 p-5 ring-1 ring-rose-200/50 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-900/60 dark:ring-rose-300/10">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl dark:text-white">{tr("tool.ytdesc.guideTitle", "Extract a YouTube video description")}</h2>
        <p className="mt-3 text-sm leading-7 text-ink-700 dark:text-ink-300">
          {tr("tool.ytdesc.guideIntro", "Paste any public YouTube link and get the full description as text you can copy or download. The tool also pulls out the links, hashtags and chapter timestamps for you, and can read up to 10 videos in one go.")}
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.ytdesc.useTitle", "What people use it for")}</h3>
            <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm leading-7 text-ink-700 dark:text-ink-300">
              <li>{tr("tool.ytdesc.use1", "Copying the links, resources and affiliate links a creator listed.")}</li>
              <li>{tr("tool.ytdesc.use2", "Studying how successful videos in your niche structure their descriptions, hashtags and chapters.")}</li>
              <li>{tr("tool.ytdesc.use3", "Saving a description before it is edited or the video is removed.")}</li>
              <li>{tr("tool.ytdesc.use4", "Reusing your own description as a template for a new upload.")}</li>
            </ul>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.ytdesc.limitsTitle", "Good to know")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.ytdesc.limitsText", "Only public videos can be read. Private, removed or age-restricted videos return no description. YouTube allows up to 5,000 characters in a description. Descriptions belong to their creators, so respect their copyright when you reuse the text.")}
            </p>
          </section>
        </div>
        <section className="mt-6">
          <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.ytdesc.linksTitle", "More free YouTube tools")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {[
              { slug: "youtube-tag-extractor", fallback: "YouTube Tag Extractor" },
              { slug: "youtube-title-extractor", fallback: "YouTube Title Extractor" },
              { slug: "youtube-hashtag-extractor", fallback: "YouTube Hashtag Extractor" },
              { slug: "youtube-thumbnail-downloader", fallback: "YouTube Thumbnail Downloader" },
              { slug: "youtube-description-generator", fallback: "YouTube Description Generator" },
              { slug: "youtube-video-statistics", fallback: "YouTube Video Statistics" },
            ].map((l) => (
              <li key={l.slug}>
                <Link
                  to={`/tools/${l.slug}`}
                  className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100"
                >
                  {tr(`tool.${l.slug}.name`, l.fallback)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
