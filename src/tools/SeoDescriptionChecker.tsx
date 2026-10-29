import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, Hash, Info, Monitor, Ruler, RotateCcw, Smartphone, Type, AlignLeft, Gauge } from "lucide-react";
import { SeoToolShell, seoBtn, seoCard, seoField } from "@/components/SeoToolShell";

/**
 * Meta title + meta description length checker.
 * Counts characters AND pixel width (Google cuts by width, not by characters), shows how the snippet
 * will probably look on desktop and mobile, and can check many lines at once.
 * The limits are guidelines: Google may rewrite titles and descriptions.
 */
type Kind = "title" | "description";

interface Props {
  slug?: string;
  kind?: Kind;
}
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

const LEVEL_UI: Record<Level, { label: string; cls: string; bar: string; pill: string; dot: string }> = {
  empty: { label: "Start typing", cls: "text-slate-500", bar: "bg-slate-400", pill: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300", dot: "bg-slate-400" },
  short: { label: "Too short", cls: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", pill: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200", dot: "bg-amber-500" },
  good: { label: "Good length", cls: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200", dot: "bg-emerald-500" },
  long: { label: "Too long – may be cut", cls: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", pill: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200", dot: "bg-rose-500" },
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
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-md dark:border-white/10 dark:bg-slate-950 ${mobile ? "max-w-[360px]" : "max-w-[680px]"}`}>
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

export default function SeoDescriptionChecker({ kind = "description" }: Props) {
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
  const scale = c.max + 20;
  const pinPct = Math.min(100, (j.chars / scale) * 100);
  const pxPct = Math.min(100, (j.px / j.limitPx) * 100);
  const rows = useMemo(
    () => bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 200).map((l) => ({ text: l, ...judge(kind, l) })),
    [bulk, kind],
  );

  const copyCsv = async () => {
    const csv = ["text,characters,pixels,status", ...rows.map((r) => `"${r.text.replace(/"/g, '""')}",${r.chars},${r.px},${LEVEL_UI[r.level].label}`)].join("\n");
    try { await navigator.clipboard.writeText(csv); setCopied(true); timer.current = window.setTimeout(() => setCopied(false), 1400); } catch { /* ignore */ }
  };

  const stats = [
    { k: "Characters", v: String(j.chars), Icon: Type, tone: "from-indigo-500 to-violet-500" },
    { k: "Pixels (approx.)", v: `${j.chars ? j.px : 0}px`, Icon: Ruler, tone: "from-sky-500 to-cyan-500" },
    { k: "Words", v: String((text.match(/\S+/g) ?? []).length), Icon: AlignLeft, tone: "from-fuchsia-500 to-pink-500" },
    { k: j.chars > c.max ? "Over by" : "Left", v: String(Math.abs(c.max - j.chars)), Icon: Hash, tone: j.chars > c.max ? "from-rose-500 to-orange-500" : "from-emerald-500 to-teal-500" },
  ];
  const zone = (from: number, to: number) => ({ left: `${(from / scale) * 100}%`, width: `${((to - from) / scale) * 100}%` });

  return (
    <SeoToolShell>
      {/* header */}
      <div className={`${seoCard} zseo-rise flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
        <div className="flex items-center gap-3">
          <span className="zseo-ico zseo-float flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-white shadow-lg shadow-indigo-500/30"><Ruler className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">{kind === "title" ? "Meta title length checker" : "Meta description length checker"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Characters + pixels + Google preview</p>
          </div>
        </div>
        <div className="inline-flex rounded-xl border border-indigo-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5" role="tablist">
          {(["single", "bulk"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${mode === m ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 hover:text-indigo-700 dark:text-slate-300"}`}>
              {m === "single" ? "One " + kind : "Many (one per line)"}
            </button>
          ))}
        </div>
      </div>

      {mode === "single" ? (
        <>
          <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 1 } as CSSProperties}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="seo-len-input">{c.label}</label>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${ui.pill}`}>
                <span className="relative flex h-2 w-2"><span className={`zseo-dot absolute inline-flex h-full w-full rounded-full ${ui.dot}`} /><span className={`relative inline-flex h-2 w-2 rounded-full ${ui.dot}`} /></span>
                {ui.label}
              </span>
            </div>
            {kind === "title" ? (
              <input id="seo-len-input" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={c.placeholder} className={seoField} />
            ) : (
              <textarea id="seo-len-input" rows={4} value={text} onChange={(e) => setText(e.target.value.replace(/\s*\n\s*/g, " "))} placeholder={c.placeholder} className={`${seoField} min-h-[120px] resize-y`} />
            )}

            {/* ruler: zones + moving pin */}
            <div className="relative mt-9 mb-7 px-1" role="progressbar" aria-valuenow={j.chars} aria-valuemax={c.max} aria-label="Length">
              <div className="relative h-3.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <span className="absolute inset-y-0 bg-amber-300/70 dark:bg-amber-400/40" style={zone(0, c.ideal[0])} />
                <span className="absolute inset-y-0 bg-emerald-400/80 dark:bg-emerald-400/55" style={zone(c.ideal[0], c.max)} />
                <span className="absolute inset-y-0 bg-rose-400/70 dark:bg-rose-400/45" style={zone(c.max, scale)} />
                <span className="zseo-shine absolute inset-0" />
              </div>
              <div className="zseo-pin absolute -top-8 -translate-x-1/2" style={{ left: `${pinPct}%` }}>
                <span className={`block rounded-lg px-2 py-0.5 text-center text-xs font-extrabold tabular-nums text-white shadow-lg ${ui.bar}`}>{j.chars}</span>
                <span className={`mx-auto block h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent ${j.level === "long" ? "border-t-rose-500" : j.level === "good" ? "border-t-emerald-500" : j.level === "short" ? "border-t-amber-500" : "border-t-slate-400"}`} />
              </div>
              <div className="relative mt-1.5 h-4 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="absolute left-0">0</span>
                <span className="absolute -translate-x-1/2" style={{ left: `${(c.ideal[0] / scale) * 100}%` }}>{c.ideal[0]}</span>
                <span className="absolute -translate-x-1/2" style={{ left: `${(c.max / scale) * 100}%` }}>{c.max}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10" title={`Pixel width ${j.px}px of about ${j.limitPx}px`}>
                <div className={`zseo-fill h-full rounded-full ${pxPct > 100 || j.px > j.limitPx ? "bg-rose-500" : "bg-gradient-to-r from-sky-400 to-indigo-500"}`} style={{ width: `${pxPct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Width: {j.chars ? j.px : 0}px of about {j.limitPx}px · Recommended {c.ideal[0]}–{c.ideal[1]} characters</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(({ k, v, Icon, tone }, n) => (
                <div key={k} className="zseo-rise rounded-2xl border border-white/80 bg-white/70 p-3.5 text-center dark:border-white/10 dark:bg-white/5" style={{ "--i": n + 2 } as CSSProperties}>
                  <span className={`zseo-ico mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-md`} style={{ "--i": n } as CSSProperties}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{v}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 2 } as CSSProperties}>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="seo-len-kw">Target keyword (optional)</label>
            <input id="seo-len-kw" type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} className={`${seoField} sm:max-w-sm`} placeholder="e.g. meta description length" />
            {advice.length > 0 && (
              <ul className="mt-4 space-y-2" aria-live="polite">
                {advice.map((a, i) => (
                  <li key={i} className={`zseo-rise flex items-start gap-2.5 rounded-xl border p-3 text-sm ${a.ok ? "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"}`} style={{ "--i": i } as CSSProperties}>
                    {a.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                    <span>{a.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 3 } as CSSProperties}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white"><Gauge className="h-4 w-4 text-indigo-500" />Google result preview</h3>
              <div className="inline-flex rounded-xl border border-indigo-200/70 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/5">
                {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
                  <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${device === d ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 dark:text-slate-300"}`}>
                    <Icon className="h-3.5 w-3.5" />{d === "desktop" ? "Desktop" : "Mobile"}
                  </button>
                ))}
              </div>
            </div>
            <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900 ${device === "mobile" ? "max-w-[400px]" : "max-w-[720px]"}`}>
              <div className="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2 dark:border-white/10">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 flex-1 truncate rounded-full bg-white px-3 py-1 text-[11px] text-slate-500 dark:bg-slate-800">your search…</span>
              </div>
              <div className="p-3"><Snippet kind={kind} text={text.trim()} device={device} /></div>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />The preview is an estimate. Google decides the final text and may rewrite or shorten it, so use the numbers as a safe target.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={seoBtn} onClick={() => setText(c.sample)}>Try an example</button>
              <button type="button" className={seoBtn} onClick={() => { setText(""); setKeyword(""); }}><RotateCcw className="h-4 w-4" />Reset</button>
            </div>
          </section>
        </>
      ) : (
        <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 1 } as CSSProperties}>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="seo-len-bulk">Paste one {kind} per line (up to 200)</label>
          <textarea id="seo-len-bulk" value={bulk} onChange={(e) => setBulk(e.target.value)} className={`${seoField} min-h-[160px] resize-y`} placeholder={`${c.sample}\n${c.placeholder}`} />
          {rows.length > 0 && (
            <>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-indigo-100 dark:border-white/10">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-indigo-50/80 text-xs uppercase tracking-wide text-indigo-700 dark:bg-white/5 dark:text-indigo-200">
                    <tr><th className="p-3">Text</th><th className="p-3">Chars</th><th className="p-3">Pixels</th><th className="p-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="zseo-rise border-t border-indigo-50 dark:border-white/5" style={{ "--i": Math.min(i, 10) } as CSSProperties}>
                        <td className="max-w-[320px] truncate p-3" title={r.text}>{r.text}</td>
                        <td className="p-3 tabular-nums">{r.chars}</td>
                        <td className="p-3 tabular-nums">{r.px}</td>
                        <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${LEVEL_UI[r.level].pill}`}>{LEVEL_UI[r.level].label}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className={`${seoBtn} mt-3`} onClick={copyCsv}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy as CSV"}</button>
            </>
          )}
        </section>
      )}
    </SeoToolShell>
  );
}
