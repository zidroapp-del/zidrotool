import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Copy, FileText, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";

/* ------------------------------------------------------------------ engine
 * Line diff with the Myers algorithm, then a word diff inside lines that changed.
 * Everything runs in the browser. Very large or very different texts fall back to
 * a simple "all removed / all added" result instead of freezing the page.
 */

const MAX_CHARS = 600000;
const MAX_D = 3000;
const STORE = "zidrotool-text-diff-v1";
const ROW_CAP = 1500;

type Op = "=" | "-" | "+";

function myers(a: string[], b: string[]): { ops: Op[]; ok: boolean } {
  const N = a.length;
  const M = b.length;
  if (N === 0) return { ops: b.map(() => "+" as Op), ok: true };
  if (M === 0) return { ops: a.map(() => "-" as Op), ok: true };
  const max = Math.min(N + M, MAX_D);
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace: Int32Array[] = [];
  let found = -1;
  for (let d = 0; d <= max && found < 0; d++) {
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])) x = v[off + k + 1];
      else x = v[off + k - 1] + 1;
      let y = x - k;
      while (x < N && y < M && a[x] === b[y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= N && y >= M) {
        found = d;
        break;
      }
    }
    trace.push(v.slice(off - (d + 1), off + (d + 1) + 1));
  }
  if (found < 0) {
    return { ops: [...a.map(() => "-" as Op), ...b.map(() => "+" as Op)], ok: false };
  }
  const ops: Op[] = [];
  let x = N;
  let y = M;
  for (let d = found; d > 0; d--) {
    const snap = trace[d - 1];
    const get = (k: number) => snap[k + d];
    const k = x - y;
    const prevK = k === -d || (k !== d && get(k - 1) < get(k + 1)) ? k + 1 : k - 1;
    const prevX = get(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push("=");
      x--;
      y--;
    }
    if (x === prevX) {
      ops.push("+");
      y--;
    } else {
      ops.push("-");
      x--;
    }
  }
  while (x > 0 && y > 0) {
    ops.push("=");
    x--;
    y--;
  }
  ops.reverse();
  return { ops, ok: true };
}

interface Opts {
  ignoreCase: boolean;
  ignoreSpace: boolean;
}

const keyOf = (s: string, o: Opts) => {
  let k = s;
  if (o.ignoreSpace) k = k.trim().replace(/\s+/g, " ");
  if (o.ignoreCase) k = k.toLowerCase();
  return k;
};

const TOKEN_RE = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;

interface Seg {
  t: string;
  mark: boolean;
}

function wordDiff(l: string, r: string, o: Opts): { left: Seg[]; right: Seg[]; sim: number } {
  const lt = l.match(TOKEN_RE) ?? [];
  const rt = r.match(TOKEN_RE) ?? [];
  const lk = lt.map((s) => (/^\s+$/.test(s) && o.ignoreSpace ? " " : keyOf(s, { ...o, ignoreSpace: false })));
  const rk = rt.map((s) => (/^\s+$/.test(s) && o.ignoreSpace ? " " : keyOf(s, { ...o, ignoreSpace: false })));
  const { ops } = myers(lk, rk);
  const left: Seg[] = [];
  const right: Seg[] = [];
  let i = 0;
  let j = 0;
  let same = 0;
  const push = (arr: Seg[], t: string, mark: boolean) => {
    const last = arr[arr.length - 1];
    if (last && last.mark === mark) last.t += t;
    else arr.push({ t, mark });
  };
  for (const op of ops) {
    if (op === "=") {
      push(left, lt[i], false);
      push(right, rt[j], false);
      if (/[\p{L}\p{N}]/u.test(lt[i])) same++;
      i++;
      j++;
    } else if (op === "-") {
      push(left, lt[i], true);
      i++;
    } else {
      push(right, rt[j], true);
      j++;
    }
  }
  const lw = lt.filter((s) => /[\p{L}\p{N}]/u.test(s)).length;
  const rw = rt.filter((s) => /[\p{L}\p{N}]/u.test(s)).length;
  const sim = lw + rw === 0 ? 1 : (2 * same) / (lw + rw);
  return { left, right, sim };
}

type Row =
  | { kind: "same"; l: string; r: string; ln: number; rn: number }
  | { kind: "removed"; l: string; ln: number }
  | { kind: "added"; r: string; rn: number }
  | { kind: "changed"; l: string; r: string; ln: number; rn: number; ls: Seg[]; rs: Seg[] };

function compare(a: string, b: string, o: Opts) {
  const al = a === "" ? [] : a.split(/\r\n|\r|\n/);
  const bl = b === "" ? [] : b.split(/\r\n|\r|\n/);
  const ak = al.map((s) => keyOf(s, o));
  const bk = bl.map((s) => keyOf(s, o));
  // trim common prefix and suffix first: it keeps big texts with local edits fast
  let pre = 0;
  while (pre < ak.length && pre < bk.length && ak[pre] === bk[pre]) pre++;
  let suf = 0;
  while (suf < ak.length - pre && suf < bk.length - pre && ak[ak.length - 1 - suf] === bk[bk.length - 1 - suf]) suf++;
  const { ops: mid, ok } = myers(ak.slice(pre, ak.length - suf), bk.slice(pre, bk.length - suf));
  const ops: Op[] = [...Array<Op>(pre).fill("="), ...mid, ...Array<Op>(suf).fill("=")];

  const rows: Row[] = [];
  let i = 0;
  let j = 0;
  let idx = 0;
  let same = 0;
  let removed = 0;
  let added = 0;
  let changed = 0;
  let credit = 0;
  let blocks = 0;
  while (idx < ops.length) {
    if (ops[idx] === "=") {
      rows.push({ kind: "same", l: al[i], r: bl[j], ln: i + 1, rn: j + 1 });
      same++;
      i++;
      j++;
      idx++;
      continue;
    }
    const dels: number[] = [];
    const adds: number[] = [];
    while (idx < ops.length && ops[idx] !== "=") {
      if (ops[idx] === "-") dels.push(i++);
      else adds.push(j++);
      idx++;
    }
    blocks++;
    const pairs = Math.min(dels.length, adds.length);
    for (let p = 0; p < pairs; p++) {
      const wd = wordDiff(al[dels[p]], bl[adds[p]], o);
      rows.push({ kind: "changed", l: al[dels[p]], r: bl[adds[p]], ln: dels[p] + 1, rn: adds[p] + 1, ls: wd.left, rs: wd.right });
      changed++;
      credit += wd.sim;
    }
    for (let p = pairs; p < dels.length; p++) {
      rows.push({ kind: "removed", l: al[dels[p]], ln: dels[p] + 1 });
      removed++;
    }
    for (let p = pairs; p < adds.length; p++) {
      rows.push({ kind: "added", r: bl[adds[p]], rn: adds[p] + 1 });
      added++;
    }
  }
  const total = al.length + bl.length;
  let similarity = total === 0 ? 100 : Math.round(((2 * (same + credit)) / total) * 100);
  if (blocks > 0 && similarity >= 100) similarity = 99;
  return { rows, same, removed, added, changed, blocks, similarity, ok, aLines: al.length, bLines: bl.length };
}

const SAMPLE_A =
  "Our store opens at 9 am on weekdays.\nDelivery is free for orders over $50.\nReturns are accepted within 14 days.\nContact us by email for any questions.\nThank you for shopping with us.";
const SAMPLE_B =
  "Our store opens at 8 am on weekdays.\nDelivery is free for orders over $60.\nReturns are accepted within 14 days.\nYou can also reach us by phone.\nContact us by email for any questions.\nThank you for shopping with us.";

const BG_MARKS = [
  { ch: "+", left: 7, top: 14, s: 36, delay: 0, c: "text-emerald-500/50" },
  { ch: "−", left: 20, top: 68, s: 36, delay: 2, c: "text-rose-500/50" },
  { ch: "≠", left: 38, top: 8, s: 32, delay: 4, c: "text-orange-500/50" },
  { ch: "=", left: 57, top: 82, s: 32, delay: 1, c: "text-orange-500/50" },
  { ch: "+", left: 73, top: 14, s: 30, delay: 3, c: "text-emerald-500/50" },
  { ch: "−", left: 89, top: 62, s: 32, delay: 5, c: "text-rose-500/50" },
];

const BG_CHIPS = [
  { text: "- 9 am", left: 4, top: 42, dur: 25, delay: -4 },
  { text: "+ 8 am", left: 76, top: 34, dur: 28, delay: -12 },
  { text: "92% match", left: 44, top: 78, dur: 26, delay: -17 },
  { text: "3 changes", left: 84, top: 84, dur: 30, delay: -7 },
  { text: "@@", left: 22, top: 90, dur: 27, delay: -2 },
];

type Mood = "idle" | "typing" | "same" | "diff";

function MagnifierCat({ mood }: { mood: Mood }) {
  return (
    <svg viewBox="0 0 150 120" className="zdf-cat h-24 w-28 shrink-0" role="img" aria-label="Cat with a magnifying glass">
      <g className="zdf-tail" style={{ transformOrigin: "112px 100px" }}>
        <path d="M108 102 C134 102 142 80 130 66" fill="none" stroke="#fdba74" strokeWidth="9" strokeLinecap="round" />
      </g>
      <ellipse cx="75" cy="104" rx="40" ry="16" fill="#fed7aa" />
      <g className="zdf-head" style={{ transformOrigin: "75px 70px" }}>
        <path d="M44 52 L48 24 L68 40 Z" fill="#fdba74" />
        <path d="M106 52 L102 24 L82 40 Z" fill="#fdba74" />
        <path d="M50 44 L52 32 L61 40 Z" fill="#fff7ed" />
        <path d="M100 44 L98 32 L89 40 Z" fill="#fff7ed" />
        <ellipse cx="75" cy="64" rx="34" ry="29" fill="#fed7aa" />
        <ellipse cx="75" cy="74" rx="13" ry="9" fill="#fff7ed" />
        <g className="zdf-eyes">
          {mood === "same" ? (
            <>
              <path d="M54 62 Q60 54 66 62" fill="none" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
              <path d="M84 62 Q90 54 96 62" fill="none" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="60" cy="62" r={mood === "diff" ? 6.4 : 5.2} fill="#431407" />
              <circle cx="90" cy="62" r={mood === "diff" ? 6.4 : 5.2} fill="#431407" />
              <circle cx="61.8" cy="60.2" r="1.7" fill="#fff" />
              <circle cx="91.8" cy="60.2" r="1.7" fill="#fff" />
            </>
          )}
        </g>
        <path d="M72 71 L78 71 L75 75 Z" fill="#ea580c" />
        <path d="M75 75 Q70 80 66 77 M75 75 Q80 80 84 77" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="46" cy="76" r="5.5" fill="#fda4af" opacity="0.55" />
        <circle cx="104" cy="76" r="5.5" fill="#fda4af" opacity="0.55" />
      </g>
      <g>
        <rect x="28" y="92" width="34" height="24" rx="4" fill="#fff" stroke="#ea580c" strokeWidth="2" />
        <path d="M33 99 L56 99 M33 105 L50 105 M33 111 L54 111" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
        <rect x="88" y="92" width="34" height="24" rx="4" fill="#fff" stroke="#ea580c" strokeWidth="2" />
        <path d="M93 99 L116 99 M93 105 L110 105 M93 111 L114 111" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
        <path d="M95 105 L108 105" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M35 105 L47 105" stroke="#f43f5e" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <g className="zdf-glass" style={{ transformOrigin: "75px 104px" }}>
        <circle cx="75" cy="100" r="9" fill="#fff7ed" fillOpacity="0.7" stroke="#9a3412" strokeWidth="2.4" />
        <path d="M82 107 L92 117" stroke="#9a3412" strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <ellipse className="zdf-paw" cx="64" cy="110" rx="8" ry="5.5" fill="#fff7ed" />
    </svg>
  );
}

export default function TextDiffChecker({ initial }: { initial?: { ignoreCase?: boolean; ignoreSpace?: boolean; onlyChanges?: boolean; view?: "split" | "unified" } }) {
  const { t, i18n } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;
  const lang = i18n?.language || "en";
  const nf = useMemo(() => new Intl.NumberFormat(lang), [lang]);

  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(initial?.ignoreCase ?? false);
  const [ignoreSpace, setIgnoreSpace] = useState(initial?.ignoreSpace ?? false);
  const [onlyChanges, setOnlyChanges] = useState(initial?.onlyChanges ?? false);
  const [view, setView] = useState<"split" | "unified">(initial?.view ?? "split");
  const [showAll, setShowAll] = useState(false);
  const [cur, setCur] = useState(-1);
  const [typing, setTyping] = useState(false);
  const [copied, setCopied] = useState("");
  const [msg, setMsg] = useState("");
  const typingTimer = useRef<number | undefined>(undefined);
  const copyTimer = useRef<number | undefined>(undefined);
  const fileA = useRef<HTMLInputElement>(null);
  const fileB = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = initial ? null : localStorage.getItem(STORE);
      if (raw) {
        const v = JSON.parse(raw) as { ignoreCase?: boolean; ignoreSpace?: boolean; onlyChanges?: boolean; view?: string };
        if (typeof v.ignoreCase === "boolean") setIgnoreCase(v.ignoreCase);
        if (typeof v.ignoreSpace === "boolean") setIgnoreSpace(v.ignoreSpace);
        if (typeof v.onlyChanges === "boolean") setOnlyChanges(v.onlyChanges);
        if (v.view === "split" || v.view === "unified") setView(v.view);
      } else if (!initial?.view && typeof window !== "undefined" && window.innerWidth < 768) {
        setView("unified");
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (initial) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ ignoreCase, ignoreSpace, onlyChanges, view }));
    } catch {
      /* ignore */
    }
  }, [initial, ignoreCase, ignoreSpace, onlyChanges, view]);
  useEffect(
    () => () => {
      window.clearTimeout(typingTimer.current);
      window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const [dA, setDA] = useState("");
  const [dB, setDB] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => {
      setDA(a);
      setDB(b);
    }, 200);
    return () => window.clearTimeout(id);
  }, [a, b]);

  const res = useMemo(() => compare(dA, dB, { ignoreCase, ignoreSpace }), [dA, dB, ignoreCase, ignoreSpace]);
  const hasBoth = dA !== "" || dB !== "";
  const identical = hasBoth && res.blocks === 0;
  const mood: Mood = typing ? "typing" : !hasBoth ? "idle" : identical ? "same" : "diff";

  // visible rows (collapse long unchanged stretches)
  const display = useMemo(() => {
    type D = { row: Row; ci: number } | { gap: number };
    const out: D[] = [];
    const changedIdx: number[] = [];
    res.rows.forEach((r, i) => {
      if (r.kind !== "same") changedIdx.push(i);
    });
    const keep = new Uint8Array(res.rows.length);
    if (onlyChanges) {
      for (const i of changedIdx) for (let k = Math.max(0, i - 2); k <= Math.min(res.rows.length - 1, i + 2); k++) keep[k] = 1;
    } else keep.fill(1);
    let ci = -1;
    let prevChanged = false;
    let gap = 0;
    res.rows.forEach((r, i) => {
      const isCh = r.kind !== "same";
      if (isCh && !prevChanged) ci++;
      prevChanged = isCh;
      if (!keep[i]) {
        gap++;
        return;
      }
      if (gap) {
        out.push({ gap });
        gap = 0;
      }
      out.push({ row: r, ci: isCh ? ci : -1 });
    });
    if (gap) out.push({ gap });
    return out;
  }, [res.rows, onlyChanges]);
  const shown = showAll ? display : display.slice(0, ROW_CAP);

  const go = (dir: 1 | -1) => {
    if (!res.blocks) return;
    const next = cur < 0 ? (dir === 1 ? 0 : res.blocks - 1) : (cur + dir + res.blocks) % res.blocks;
    setCur(next);
    setShowAll(true);
    window.setTimeout(() => document.getElementById(`zdf-ch-${next}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 60);
  };

  const onType = (which: "a" | "b", v: string) => {
    (which === "a" ? setA : setB)(v.slice(0, MAX_CHARS));
    setShowAll(false);
    setCur(-1);
    setTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTyping(false), 1100);
  };

  const readFile = async (which: "a" | "b", f: File | undefined) => {
    if (!f) return;
    if (f.size > 3 * 1024 * 1024 || !/^text\/|\.(txt|md|markdown|csv|json|html?|xml|js|ts|css|log)$/i.test(f.type + f.name)) {
      setMsg(tr("tool.textdiff.errFile", "Only text files up to 3 MB can be opened (.txt, .md, .csv, .json, .html…)."));
      return;
    }
    setMsg("");
    onType(which, await f.text());
  };

  const copy = async (id: string, value: string) => {
    await copyToClipboard(value);
    setCopied(id);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(""), 1600);
  };

  const unifiedText = useMemo(
    () =>
      [
        `--- ${tr("tool.textdiff.original", "Original")}`,
        `+++ ${tr("tool.textdiff.modified", "Modified")}`,
        ...res.rows.flatMap((r) =>
          r.kind === "same" ? [`  ${r.l}`] : r.kind === "removed" ? [`- ${r.l}`] : r.kind === "added" ? [`+ ${r.r}`] : [`- ${r.l}`, `+ ${r.r}`],
        ),
      ].join("\n"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [res.rows],
  );

  const download = () => {
    try {
      const blob = new Blob([unifiedText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const el = document.createElement("a");
      el.href = url;
      el.download = "differences.diff";
      document.body.appendChild(el);
      el.click();
      el.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMsg(tr("tool.textdiff.errDownload", "The download could not be started."));
    }
  };

  const bubble = typing
    ? tr("tool.textdiff.catTyping", "Hmm, let me look closer…")
    : !hasBoth
      ? tr("tool.textdiff.catIdle", "Paste two texts and I'll find the differences!")
      : identical
        ? tr("tool.textdiff.catSame", "Both texts are identical!")
        : tr("tool.textdiff.catDiff", "I found {{n}} changed spots!", { n: nf.format(res.blocks) });

  const card =
    "rounded-3xl border border-white/80 bg-white/75 shadow-[0_24px_60px_-30px_rgba(234,88,12,0.5)] ring-1 ring-orange-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:ring-orange-300/10";
  const btn2 =
    "inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white/85 px-3 py-2 text-xs font-bold text-orange-900 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-900/60 dark:bg-slate-900/60 dark:text-orange-100";
  const chip = (active: boolean) =>
    `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? "border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-500/30" : "border-orange-200 bg-white/80 text-orange-900 hover:bg-orange-50 dark:border-orange-900/60 dark:bg-slate-900/60 dark:text-orange-100"}`;
  const checkbox = "h-4 w-4 accent-orange-600";

  const segs = (list: Seg[], side: "l" | "r") =>
    list.map((s, i) =>
      s.mark ? (
        <mark key={i} className={`rounded px-0.5 ${side === "l" ? "bg-rose-300/70 text-rose-950 dark:bg-rose-500/40 dark:text-rose-50" : "bg-emerald-300/70 text-emerald-950 dark:bg-emerald-500/40 dark:text-emerald-50"}`}>{s.t}</mark>
      ) : (
        <Fragment key={i}>{s.t}</Fragment>
      ),
    );

  const lineBox = (sign: string, n: number | null, content: React.ReactNode, tone: "rem" | "add" | "same" | "none") => (
    <div className={`flex min-w-0 items-start gap-2 px-2 py-1 ${tone === "rem" ? "bg-rose-50 dark:bg-rose-500/10" : tone === "add" ? "bg-emerald-50 dark:bg-emerald-500/10" : tone === "none" ? "bg-ink-50/60 dark:bg-white/5" : ""}`}>
      <span className="w-8 shrink-0 select-none text-right text-[10px] leading-6 text-ink-400">{n ?? ""}</span>
      <span aria-hidden="true" className={`w-3 shrink-0 select-none text-center text-xs font-black leading-6 ${tone === "rem" ? "text-rose-600" : tone === "add" ? "text-emerald-600" : "text-ink-300"}`}>{sign}</span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6 text-ink-800 dark:text-ink-100">{content === "" ? " " : content}</span>
    </div>
  );

  const side = (which: "a" | "b") => {
    const value = which === "a" ? a : b;
    const set = which === "a" ? setA : setB;
    const label = which === "a" ? tr("tool.textdiff.original", "Original") : tr("tool.textdiff.modified", "Modified");
    return (
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={`td-${which}`} className="text-xs font-bold text-ink-700 dark:text-ink-200">{label}</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => (which === "a" ? fileA : fileB).current?.click()} className={btn2}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              {tr("tool.textdiff.openFile", "Open file")}
            </button>
            <button type="button" onClick={() => set("")} disabled={!value} className={btn2}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {tr("tool.textdiff.clear", "Clear")}
            </button>
            <input ref={which === "a" ? fileA : fileB} type="file" accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.js,.ts,.css,.log,text/*" className="sr-only" onChange={(e) => { void readFile(which, e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </div>
        <textarea
          id={`td-${which}`}
          value={value}
          onChange={(e) => onType(which, e.target.value)}
          placeholder={which === "a" ? tr("tool.textdiff.placeholderA", "Paste the original text here…") : tr("tool.textdiff.placeholderB", "Paste the changed text here…")}
          rows={9}
          spellCheck={false}
          className="box-border block w-full resize-y rounded-2xl border border-orange-200 bg-white/80 p-3 font-mono text-[13px] leading-6 text-ink-900 outline-none focus:ring-2 focus:ring-orange-300/70 dark:border-orange-900/50 dark:bg-slate-950/50 dark:text-white"
        />
        <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
          {nf.format(value === "" ? 0 : value.split(/\r\n|\r|\n/).length)} {tr("tool.textdiff.linesWord", "lines")} · {nf.format(Array.from(value).length)} {tr("tool.textdiff.charsWord", "characters")}
        </p>
      </div>
    );
  };

  return (
    <div className="zdf-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-8">
      <style>{`
        @keyframes zdf-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,30px,0) scale(1.12); } }
        @keyframes zdf-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-70px,-25px,0) scale(0.94); } }
        @keyframes zdf-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zdf-float { 0%,100% { transform: translate3d(0,0,0) rotate(-6deg); opacity: 0.75; } 50% { transform: translate3d(14px,-26px,0) rotate(8deg); opacity: 0.35; } }
        @keyframes zdf-chip { 0%,100% { transform: translate3d(0,0,0); opacity: 0.5; } 50% { transform: translate3d(20px,-24px,0); opacity: 0.95; } }
        @keyframes zdf-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes zdf-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(9deg); } }
        @keyframes zdf-look { 0%,100% { transform: translateX(-1.5px); } 50% { transform: translateX(1.5px); } }
        @keyframes zdf-scan { 0%,100% { transform: translateX(-18px) rotate(-6deg); } 50% { transform: translateX(18px) rotate(6deg); } }
        @keyframes zdf-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes zdf-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        .zdf-blob { will-change: transform; }
        .zdf-blob-a { animation: zdf-blob-a 24s ease-in-out infinite; }
        .zdf-blob-b { animation: zdf-blob-b 30s ease-in-out infinite; }
        .zdf-blob-c { animation: zdf-blob-c 27s ease-in-out infinite; }
        .zdf-mark { position: absolute; font-weight: 800; line-height: 1; animation: zdf-float 11s ease-in-out infinite; }
        .zdf-chip { position: absolute; white-space: nowrap; animation: zdf-chip ease-in-out infinite; }
        .zdf-cat .zdf-head { animation: zdf-bob 3.6s ease-in-out infinite; }
        .zdf-cat .zdf-tail { animation: zdf-tail 2.6s ease-in-out infinite; }
        .zdf-cat .zdf-eyes { animation: zdf-look 3s ease-in-out infinite; }
        .zdf-cat.zdf-active .zdf-glass { animation: zdf-scan 1.6s ease-in-out infinite; }
        .zdf-rise { animation: zdf-rise 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .zdf-shine { position: relative; overflow: hidden; }
        .zdf-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%); transform: translateX(-130%); animation: zdf-shine 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .zdf-blob, .zdf-mark, .zdf-chip, .zdf-cat *, .zdf-rise, .zdf-shine::after { animation: none !important; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 dark:from-slate-950 dark:via-orange-950/40 dark:to-slate-900" />
        <div className="zdf-blob zdf-blob-a absolute -left-24 -top-24 h-96 w-[34rem] rounded-full bg-gradient-to-r from-orange-300/55 to-amber-200/40 blur-3xl dark:from-orange-500/25 dark:to-amber-500/15" />
        <div className="zdf-blob zdf-blob-b absolute -right-28 top-1/3 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-rose-200/60 to-yellow-200/40 blur-3xl dark:from-rose-400/15 dark:to-yellow-500/15" />
        <div className="zdf-blob zdf-blob-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-amber-200/55 to-orange-200/40 blur-3xl dark:from-amber-500/20 dark:to-orange-500/15" />
        {BG_MARKS.map((p, i) => (
          <span key={`m-${i}`} className={`zdf-mark ${p.c}`} style={{ left: `${p.left}%`, top: `${p.top}%`, fontSize: p.s, animationDelay: `${p.delay}s` } as CSSProperties}>{p.ch}</span>
        ))}
        {BG_CHIPS.map((g, i) => (
          <span
            key={`c-${i}`}
            className="zdf-chip rounded-full border border-orange-200/70 bg-white/60 px-3 py-1 font-mono text-[11px] font-semibold text-orange-800/80 dark:border-white/10 dark:bg-white/5 dark:text-orange-200/60"
            style={{ left: `${g.left}%`, top: `${g.top}%`, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` } as CSSProperties}
          >
            {g.text}
          </span>
        ))}
      </div>

      {/* mascot */}
      <div className="mb-2 flex items-end gap-3 px-1">
        <div className="relative mb-4 max-w-xs rounded-2xl rounded-bl-sm border border-orange-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-orange-950 shadow-sm dark:border-orange-300/20 dark:bg-slate-900/80 dark:text-orange-100">{bubble}</div>
        <div className={typing ? "zdf-cat zdf-active" : "zdf-cat"}>
          <MagnifierCat mood={mood} />
        </div>
      </div>

      {/* inputs */}
      <section className={`${card} p-3 sm:p-5`}>
        <div className="grid gap-4 md:grid-cols-2">
          {side("a")}
          {side("b")}
        </div>
        {msg && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {msg}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setA(SAMPLE_A); setB(SAMPLE_B); setCur(-1); setShowAll(false); }} className={btn2}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {tr("tool.textdiff.example", "Try an example")}
          </button>
          <button type="button" onClick={() => { setA(b); setB(a); setCur(-1); }} disabled={!a && !b} className={btn2}>
            {tr("tool.textdiff.swap", "Swap texts")}
          </button>
          <span className="text-[11px] text-ink-500 dark:text-ink-400">{tr("tool.textdiff.privacy", "Your texts stay in your browser. Nothing is uploaded or saved.")}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-ink-700 dark:text-ink-200">
          <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} className={checkbox} />{tr("tool.textdiff.optCase", "Ignore upper and lower case")}</label>
          <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={ignoreSpace} onChange={(e) => setIgnoreSpace(e.target.checked)} className={checkbox} />{tr("tool.textdiff.optSpace", "Ignore extra spaces")}</label>
        </div>
      </section>

      {/* result */}
      <section className={`${card} mt-5 p-4 sm:p-6`} aria-live="polite">
        {!hasBoth ? (
          <p className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4 text-sm text-orange-950 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-100">{tr("tool.textdiff.empty", "The differences will appear here: added text in green, removed text in red.")}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                [tr("tool.textdiff.sSimilar", "Similarity"), `${res.similarity}%`, true],
                [tr("tool.textdiff.sBlocks", "Changed spots"), nf.format(res.blocks), false],
                [tr("tool.textdiff.sChanged", "Edited lines"), nf.format(res.changed), false],
                [tr("tool.textdiff.sAdded", "Added lines"), nf.format(res.added), false],
                [tr("tool.textdiff.sRemoved", "Removed lines"), nf.format(res.removed), false],
                [tr("tool.textdiff.sSame", "Unchanged lines"), nf.format(res.same), false],
              ].map(([k, v, hero], i) => (
                <div key={i} className={`rounded-2xl border p-3 text-center ${hero ? "border-orange-300 bg-gradient-to-b from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/25" : "border-orange-100 bg-white/70 dark:border-white/10 dark:bg-white/5"}`}>
                  <p className={`text-2xl font-black leading-none ${hero ? "" : "text-ink-900 dark:text-white"}`}>{v}</p>
                  <p className={`mt-1.5 text-[11px] font-bold ${hero ? "text-orange-50" : "text-ink-500 dark:text-ink-400"}`}>{k}</p>
                </div>
              ))}
            </div>

            {identical ? (
              <p className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
                {tr("tool.textdiff.identical", "The two texts are identical with the current options.")}
              </p>
            ) : (
              <>
                {!res.ok && (
                  <p role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {tr("tool.textdiff.tooDifferent", "The texts are too different to match line by line, so every line is shown as removed or added.")}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tr("tool.textdiff.viewLabel", "View")}>
                    <button type="button" role="radio" aria-checked={view === "split"} onClick={() => setView("split")} className={chip(view === "split")}>{tr("tool.textdiff.viewSplit", "Side by side")}</button>
                    <button type="button" role="radio" aria-checked={view === "unified"} onClick={() => setView("unified")} className={chip(view === "unified")}>{tr("tool.textdiff.viewUnified", "One column")}</button>
                    <label className="ms-2 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-ink-700 dark:text-ink-200">
                      <input type="checkbox" checked={onlyChanges} onChange={(e) => { setOnlyChanges(e.target.checked); setShowAll(false); }} className={checkbox} />
                      {tr("tool.textdiff.onlyChanges", "Show only changes")}
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => go(-1)} className={btn2}>{tr("tool.textdiff.prev", "Previous change")}</button>
                    <button type="button" onClick={() => go(1)} className={`${btn2} zdf-shine`}>{tr("tool.textdiff.next", "Next change")}{cur >= 0 ? ` · ${cur + 1}/${res.blocks}` : ""}</button>
                  </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-2xl border border-orange-100 bg-white/80 dark:border-white/10 dark:bg-slate-950/40">
                  {view === "split" && (
                    <div className="grid grid-cols-2 border-b border-orange-100 bg-orange-100/60 text-[11px] font-extrabold uppercase tracking-wide text-orange-950 dark:border-white/10 dark:bg-orange-400/10 dark:text-orange-100">
                      <span className="px-3 py-1.5">{tr("tool.textdiff.original", "Original")}</span>
                      <span className="border-s border-orange-100 px-3 py-1.5 dark:border-white/10">{tr("tool.textdiff.modified", "Modified")}</span>
                    </div>
                  )}
                  <div className="max-h-[36rem] overflow-auto">
                    {shown.map((d, n) => {
                      if ("gap" in d) {
                        return (
                          <div key={`g-${n}`} className="border-y border-dashed border-orange-200 bg-orange-50/60 px-3 py-1 text-center text-[11px] font-semibold text-orange-800 dark:border-white/10 dark:bg-white/5 dark:text-orange-200">
                            {tr("tool.textdiff.gap", "{{n}} unchanged lines", { n: nf.format(d.gap) })}
                          </div>
                        );
                      }
                      const r = d.row;
                      const anchor = d.ci >= 0 && (n === 0 || !("row" in shown[n - 1]) || (shown[n - 1] as { ci: number }).ci !== d.ci) ? `zdf-ch-${d.ci}` : undefined;
                      const ring = d.ci >= 0 && d.ci === cur ? "ring-2 ring-inset ring-orange-500" : "";
                      if (view === "split") {
                        const left =
                          r.kind === "same" ? lineBox(" ", r.ln, r.l, "same") : r.kind === "removed" ? lineBox("−", r.ln, r.l, "rem") : r.kind === "added" ? lineBox("", null, "", "none") : lineBox("−", r.ln, segs(r.ls, "l"), "rem");
                        const right =
                          r.kind === "same" ? lineBox(" ", r.rn, r.r, "same") : r.kind === "added" ? lineBox("+", r.rn, r.r, "add") : r.kind === "removed" ? lineBox("", null, "", "none") : lineBox("+", r.rn, segs(r.rs, "r"), "add");
                        return (
                          <div key={n} id={anchor} className={`grid grid-cols-2 ${ring}`}>
                            <div className="min-w-0">{left}</div>
                            <div className="min-w-0 border-s border-orange-100 dark:border-white/10">{right}</div>
                          </div>
                        );
                      }
                      return (
                        <div key={n} id={anchor} className={ring}>
                          {r.kind === "same" && lineBox(" ", r.rn, r.r, "same")}
                          {(r.kind === "removed" || r.kind === "changed") && lineBox("−", r.ln, r.kind === "changed" ? segs(r.ls, "l") : r.l, "rem")}
                          {(r.kind === "added" || r.kind === "changed") && lineBox("+", r.rn, r.kind === "changed" ? segs(r.rs, "r") : r.r, "add")}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {!showAll && display.length > shown.length && (
                  <button type="button" onClick={() => setShowAll(true)} className={`${btn2} mt-3`}>
                    {tr("tool.textdiff.showAll", "Show all {{n}} rows", { n: nf.format(display.length) })}
                  </button>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void copy("diff", unifiedText)} className={btn2}>
                    {copied === "diff" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    {copied === "diff" ? tr("tool.textdiff.copied", "Copied") : tr("tool.textdiff.copyDiff", "Copy the differences")}
                  </button>
                  <button type="button" onClick={download} className={btn2}>
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    {tr("tool.textdiff.download", "Download .diff")}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* guide */}
      <article className="mt-8 rounded-3xl border border-white/80 bg-white/70 p-5 ring-1 ring-orange-200/50 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-900/60 dark:ring-orange-300/10">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl dark:text-white">{tr("tool.textdiff.guideTitle", "How this text comparison works")}</h2>
        <p className="mt-3 text-sm leading-7 text-ink-700 dark:text-ink-300">
          {tr("tool.textdiff.guideIntro", "Paste the original text on the left and the changed text on the right. The tool matches lines between the two, so an added or deleted line does not shift everything below it, and then highlights the exact words that changed inside edited lines. Added text is green and removed text is red.")}
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.textdiff.howTitle", "Lines first, then words")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.textdiff.howText", "First the texts are compared line by line to find the longest set of lines that stay the same. Where a line was edited, its words are compared again, so you see which words were added or removed. The similarity score shows how much of the text is shared.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.textdiff.optTitle", "Ignore case and spaces")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.textdiff.optText", "Turn on the options to ignore upper and lower case, or extra spaces at the start, end and between words. This is useful when two versions differ only in formatting.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.textdiff.useTitle", "What you can compare")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.textdiff.useText", "Two drafts of an essay, versions of a contract or policy, lists of names, configuration files or code snippets. Use Show only changes to hide the unchanged parts of a long text, and Next change to jump from one difference to the next.")}
            </p>
          </section>
          <section>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.textdiff.limitsTitle", "Good to know")}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700 dark:text-ink-300">
              {tr("tool.textdiff.limitsText", "This tool shows differences between two texts. It is not a plagiarism checker, because it does not search other sources. A moved paragraph appears as one removal and one addition.")}
            </p>
          </section>
        </div>
        <section className="mt-6">
          <h3 className="text-base font-bold text-ink-900 dark:text-white">{tr("tool.textdiff.linksTitle", "More free writing tools")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {[
              { slug: "word-counter", fb: "Word Counter" },
              { slug: "sentence-counter", fb: "Sentence Counter" },
              { slug: "case-converter", fb: "Case Converter" },
              { slug: "find-and-replace", fb: "Find and Replace" },
              { slug: "reading-time-calculator", fb: "Reading Time Calculator" },
              { slug: "ai-grammar-checker", fb: "Grammar Checker" },
            ].map((l) => (
              <li key={l.slug}>
                <Link to={`/tools/${l.slug}`} className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-900 transition hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-100">
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
