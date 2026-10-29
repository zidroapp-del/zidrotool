import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, Info, Monitor, RotateCcw, Smartphone } from "lucide-react";

/**
 * Meta title + meta description length checker.
 * Counts characters AND pixel width (Google cuts by width, not by characters), shows how the snippet
 * will probably look on desktop and mobile, and can check many lines at once.
 * The limits are guidelines: Google may rewrite titles and descriptions.
 */
type Kind = "title" | "description";
interface Props { slug?: string; initial?: { kind?: Kind } }

const CFG = {
  title: {
    label: "Meta title (SEO title)",
    placeholder: "Free Online Tools for Everyone | ZidroTool",
    font: '400 20px Arial, Helvetica, sans-serif',
    desktopPx: 600, mobilePx: 600, lines: 1,
    min: 30, ideal: [50, 60] as const, max: 60,
    sample: "Meta Title Length Checker – Check Your SEO Title | ZidroTool",
  },
  description: {
    label: "Meta description",
    placeholder: "Check how long your meta description is and see how it will look in Google results on desktop and mobile.",
    font: '400 14px Arial, Helvetica, sans-serif',
    desktopPx: 920, mobilePx: 680, lines: 2,
    min: 70, ideal: [120, 155] as const, max: 160,
    sample: "Paste your meta description to see its length in characters and pixels, and a preview of how Google may show it on desktop and mobile.",
  },
} as const;

let ctx: CanvasRenderingContext2D | null | undefined;
function widthOf(text: string, font: string): number {
  if (ctx === undefined) {
    try { ctx = document.createElement("canvas").getContext("2d"); } catch { ctx = null; }
  }
  if (!ctx) return Math.round(text.length * (font.includes("20px") ? 10.2 : 7.1));
  ctx.font = font;
  return Math.round(ctx.measureText(text).width);
}

/** Cut text so that "text…" fits the pixel width, like a search result does. */
function clip(text: string, font: string, maxPx: number): { text: string; cut: boolean } {
  if (widthOf(text, font) <= maxPx) return { text, cut: false };
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (widthOf(text.slice(0, mid).trimEnd() + "…", font) <= maxPx) lo = mid; else hi = mid - 1;
  }
  const cut = text.slice(0, lo);
  const sp = cut.lastIndexOf(" ");
  return { text: (sp > lo * 0.6 ? cut.slice(0, sp) : cut).trimEnd() + "…", cut: true };
}

type Level = "empty" | "short" | "good" | "long";
function judge(kind: Kind, text: string) {
  const c = CFG[kind];
  const chars = text.trim().length;
  const px = widthOf(text.trim(), c.font);
  const limitPx = c.desktopPx * c.lines;
  let level: Level = "good";
  if (!chars) level = "empty";
  else if (px > limitPx || chars > c.max + 5) level = "long";
  else if (chars < c.min) level = "short";
  return { chars, px, level, limitPx };
}

const LEVEL_UI: Record<Level, { label: string; cls: string; bar: string }> = {
  empty: { label: "Start typing", cls: "text-ink-500", bar: "bg-ink-300" },
  short: { label: "Too short", cls: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  good: { label: "Good length", cls: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  long: { label: "Too long – may be cut", cls: "text-red-600 dark:text-red-400", bar: "bg-red-500" },
};

function tips(kind: Kind, text: string, keyword: string): { ok: boolean; text: string }[] {
  const t = text.trim();
  if (!t) return [];
  const out: { ok: boolean; text: string }[] = [];
  const c = CFG[kind];
  const j = judge(kind, t);
  out.push(
    j.level === "good"
      ? { ok: true, text: `${j.chars} characters and about ${j.px}px: it should fit in a desktop result.` }
      : j.level === "long"
        ? { ok: false, text: `About ${j.px}px wide (limit ≈ ${j.limitPx}px). The end will probably be replaced by "…". Move the important words to the beginning.` }
        : { ok: false, text: `Only ${j.chars} characters. You have room to add the main benefit or a specific detail (target ${c.ideal[0]}–${c.ideal[1]}).` },
  );
  if (keyword.trim()) {
    const k = keyword.trim().toLowerCase();
    const pos = t.toLowerCase().indexOf(k);
    out.push(pos < 0
      ? { ok: false, text: `The keyword "${keyword.trim()}" is not in the ${kind}.` }
      : pos <= 30 || kind === "description"
        ? { ok: true, text: `The keyword "${keyword.trim()}" is included${pos <= 30 ? " near the start" : ""}.` }
        : { ok: false, text: `The keyword appears late (character ${pos + 1}). Consider moving it closer to the start.` });
  }
  if (t.length > 8 && t === t.toUpperCase() && /[A-Z]/.test(t)) out.push({ ok: false, text: "All capital letters is harder to read and wider in pixels." });
  const words = t.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
  const seen = new Map<string, number>();
  words.filter((w) => w.length > 3).forEach((w) => seen.set(w, (seen.get(w) ?? 0) + 1));
  const rep = [...seen.entries()].filter(([, n]) => n >= 3).map(([w]) => w);
  if (rep.length) out.push({ ok: false, text: `"${rep[0]}" is repeated ${seen.get(rep[0])} times. Repeating the same word looks spammy.` });
  if (/[|\-–—:]\s.*[|\-–—:]\s.*[|\-–—:]/.test(t) && kind === "title") out.push({ ok: false, text: "Three or more separators (| - :) make a title look crowded. One is usually enough." });
  if (kind === "description" && !/[.!?…]$/.test(t) && j.level === "good") out.push({ ok: false, text: "Ending with a full stop or a call to action reads more naturally." });
  return out;
}

function Snippet({ kind, text, device }: { kind: Kind; text: string; device: "desktop" | "mobile" }) {
  const mobile = device === "mobile";
  const titleFont = CFG.title.font, descFont = CFG.description.font;
  const title = kind === "title" ? text : "Your page title";
  const desc = kind === "description" ? text : "Your meta description will appear here, under the title, in the search result.";
  const tClip = clip(title || CFG.title.sample, titleFont, 600 * (mobile ? 1 : 1));
  const dMax = (mobile ? CFG.description.mobilePx : CFG.description.desktopPx) * 2 - 20;
  const dClip = clip(desc || CFG.description.sample, descFont, dMax);
  return (
    <div className={`rounded-2xl border border-ink-200 bg-white p-4 text-left shadow-sm dark:border-ink-700 dark:bg-ink-950 ${mobile ? "max-w-[360px]" : "max-w-[680px]"}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-500 dark:bg-ink-800">Z</span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] text-ink-800 dark:text-ink-200">ZidroTool</p>
          <p className="truncate text-[12px] text-ink-500">https://zidrotool.com › tools</p>
        </div>
      </div>
      <p className="mt-2 break-words text-[20px] leading-[1.3] text-[#1a0dab] dark:text-[#8ab4f8]" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: mobile ? 18 : 20 }}>{tClip.text}</p>
      <p className="mt-1 break-words text-[14px] leading-[1.58] text-[#4d5156] dark:text-[#bdc1c6]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>{dClip.text}</p>
    </div>
  );
}

export default function SeoLengthChecker({ slug = "", initial }: Props) {
  const kind: Kind = initial?.kind ?? (slug.includes("description") ? "description" : "title");
  const c = CFG[kind];
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [text, setText] = useState("");
  const [bulk, setBulk] = useState("");
  const [keyword, setKeyword] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const j = useMemo(() => judge(kind, text), [kind, text]);
  const ui = LEVEL_UI[j.level];
  const advice = useMemo(() => tips(kind, text, keyword), [kind, text, keyword]);
  const pct = Math.min(100, (j.chars / (c.max + 10)) * 100);
  const rows = useMemo(
    () => bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 200).map((l) => ({ text: l, ...judge(kind, l) })),
    [bulk, kind],
  );

  const copyCsv = async () => {
    const csv = ["text,characters,pixels,status", ...rows.map((r) => `"${r.text.replace(/"/g, '""')}",${r.chars},${r.px},${LEVEL_UI[r.level].label}`)].join("\n");
    try { await navigator.clipboard.writeText(csv); setCopied(true); timer.current = window.setTimeout(() => setCopied(false), 1400); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-xl border border-ink-200 bg-ink-50 p-1 dark:border-ink-700 dark:bg-ink-900" role="tablist">
        {(["single", "bulk"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${mode === m ? "bg-white text-brand-700 shadow-sm dark:bg-ink-800 dark:text-brand-300" : "text-ink-500"}`}>
            {m === "single" ? "One " + kind : "Many (one per line)"}
          </button>
        ))}
      </div>

      {mode === "single" ? (
        <>
          <div>
            <label className="label mb-2 block" htmlFor="seo-len-input">{c.label}</label>
            {kind === "title" ? (
              <input id="seo-len-input" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={c.placeholder} className="input w-full" />
            ) : (
              <textarea id="seo-len-input" rows={4} value={text} onChange={(e) => setText(e.target.value.replace(/\s*\n\s*/g, " "))} placeholder={c.placeholder} className="input min-h-[110px] w-full resize-y" />
            )}
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800" role="progressbar" aria-valuenow={j.chars} aria-valuemax={c.max} aria-label="Length">
              <div className={`h-full rounded-full transition-all duration-300 ${ui.bar}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
              <span className={`font-bold ${ui.cls}`}>{ui.label}</span>
              <span>Recommended: {c.ideal[0]}–{c.ideal[1]} characters (max ≈ {c.max})</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Characters", String(j.chars)],
              ["Pixels (approx.)", j.chars ? `${j.px}px` : "0px"],
              ["Words", String((text.match(/\S+/g) ?? []).length)],
              [j.chars > c.max ? "Over by" : "Left", String(Math.abs(c.max - j.chars))],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-ink-200 p-3 text-center dark:border-ink-700">
                <p className="text-2xl font-extrabold tabular-nums text-ink-900 dark:text-ink-100">{v}</p>
                <p className="text-xs text-ink-500">{k}</p>
              </div>
            ))}
          </div>

          <div>
            <label className="label mb-2 block" htmlFor="seo-len-kw">Target keyword (optional)</label>
            <input id="seo-len-kw" type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="input w-full sm:max-w-sm" placeholder="e.g. meta title length" />
          </div>

          {advice.length > 0 && (
            <ul className="space-y-2" aria-live="polite">
              {advice.map((a, i) => (
                <li key={i} className="flex items-start gap-2 rounded-xl border border-ink-200 p-3 text-sm dark:border-ink-700">
                  {a.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                  <span>{a.text}</span>
                </li>
              ))}
            </ul>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Google result preview</h3>
              <div className="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
                {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
                  <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold ${device === d ? "bg-brand-600 text-white" : "text-ink-500"}`}>
                    <Icon className="h-3.5 w-3.5" />{d === "desktop" ? "Desktop" : "Mobile"}
                  </button>
                ))}
              </div>
            </div>
            <Snippet kind={kind} text={text.trim()} device={device} />
            <p className="mt-3 flex items-start gap-2 text-xs text-ink-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />The preview is an estimate. Google decides the final text and may rewrite or shorten it, so use the numbers as a safe target.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setText(c.sample)}>Try an example</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setText(""); setKeyword(""); }}><RotateCcw className="h-4 w-4" />Reset</button>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="label mb-2 block" htmlFor="seo-len-bulk">Paste one {kind} per line (up to 200)</label>
            <textarea id="seo-len-bulk" value={bulk} onChange={(e) => setBulk(e.target.value)} className="input min-h-[150px] w-full resize-y" placeholder={`${c.sample}\n${c.placeholder}`} />
          </div>
          {rows.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-2xl border border-ink-200 dark:border-ink-700">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:bg-ink-900">
                    <tr><th className="p-3">Text</th><th className="p-3">Chars</th><th className="p-3">Pixels</th><th className="p-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-ink-100 dark:border-ink-800">
                        <td className="max-w-[320px] truncate p-3" title={r.text}>{r.text}</td>
                        <td className="p-3 tabular-nums">{r.chars}</td>
                        <td className="p-3 tabular-nums">{r.px}</td>
                        <td className={`p-3 font-semibold ${LEVEL_UI[r.level].cls}`}>{LEVEL_UI[r.level].label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn btn-secondary" onClick={copyCsv}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy as CSV"}</button>
            </>
          )}
        </>
      )}
    </div>
  );
}
