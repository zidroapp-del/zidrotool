import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AlignLeft, AlertTriangle, Check, CheckCircle2, Copy, Hash, Info, Monitor, RotateCcw, Ruler, Smartphone, Type } from "lucide-react";
import { SeoToolShell, seoBtn, seoCard, seoField } from "@/components/SeoToolShell";

/**
 * Meta title length & snippet checker.
 * Google: characters + pixel width (Google cuts by width), desktop / mobile preview.
 * Marketplaces: character limits only (eBay, Etsy, Amazon, Poshmark).
 * Limits are guidelines: Google may rewrite titles and every marketplace can change its rules.
 */
interface Props { slug?: string }

type PlatformKey = "google" | "ebay" | "etsy" | "amazon" | "poshmark";
const PLATFORMS: { key: PlatformKey; label: string; max: number; ideal: [number, number]; min: number; px?: number }[] = [
  { key: "google", label: "Google SEO", max: 60, ideal: [50, 60], min: 30, px: 600 },
  { key: "ebay", label: "eBay", max: 80, ideal: [65, 80], min: 30 },
  { key: "etsy", label: "Etsy", max: 140, ideal: [60, 140], min: 40 },
  { key: "amazon", label: "Amazon", max: 200, ideal: [80, 200], min: 50 },
  { key: "poshmark", label: "Poshmark", max: 50, ideal: [35, 50], min: 20 },
];

const FONT = "400 20px Arial, Helvetica, sans-serif";
const SAMPLE = "Meta Title Length Checker – Check Your SEO Title | ZidroTool";

let ctx: CanvasRenderingContext2D | null | undefined;
function widthOf(text: string): number {
  if (ctx === undefined) {
    try { ctx = document.createElement("canvas").getContext("2d"); } catch { ctx = null; }
  }
  if (!ctx) return Math.round(text.length * 10.2);
  ctx.font = FONT;
  return Math.round(ctx.measureText(text).width);
}

/** Cut text so that "text…" fits the pixel width, like a search result does. */
function clip(text: string, maxPx: number): string {
  if (widthOf(text) <= maxPx) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (widthOf(text.slice(0, mid).trimEnd() + "…") <= maxPx) lo = mid; else hi = mid - 1;
  }
  const cut = text.slice(0, lo);
  const sp = cut.lastIndexOf(" ");
  return (sp > lo * 0.6 ? cut.slice(0, sp) : cut).trimEnd() + "…";
}

type Level = "empty" | "short" | "good" | "long";
const LEVEL: Record<Level, { label: string; bar: string; pill: string; dot: string; arrow: string }> = {
  empty: { label: "Start typing", bar: "bg-slate-400", pill: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300", dot: "bg-slate-400", arrow: "border-t-slate-400" },
  short: { label: "Too short", bar: "bg-amber-500", pill: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200", dot: "bg-amber-500", arrow: "border-t-amber-500" },
  good: { label: "Good length", bar: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200", dot: "bg-emerald-500", arrow: "border-t-emerald-500" },
  long: { label: "Too long – may be cut", bar: "bg-rose-500", pill: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200", dot: "bg-rose-500", arrow: "border-t-rose-500" },
};

function judge(text: string, p: (typeof PLATFORMS)[number]) {
  const t = text.trim();
  const chars = t.length;
  const px = widthOf(t);
  let level: Level = "good";
  if (!chars) level = "empty";
  else if (chars > p.max || (p.px && px > p.px)) level = "long";
  else if (chars < p.min) level = "short";
  return { chars, px, level };
}

function advice(text: string, keyword: string, p: (typeof PLATFORMS)[number]): { ok: boolean; text: string }[] {
  const t = text.trim();
  if (!t) return [];
  const j = judge(t, p);
  const out: { ok: boolean; text: string }[] = [];
  if (j.level === "good") out.push({ ok: true, text: p.px ? `${j.chars} characters and about ${j.px}px: it should fit in a desktop result.` : `${j.chars} characters: within the ${p.label} limit of ${p.max}.` });
  else if (j.level === "long") out.push({ ok: false, text: p.px && j.px > p.px && j.chars <= p.max ? `About ${j.px}px wide (limit ≈ ${p.px}px). The end will probably be replaced by "…". Move the important words to the beginning.` : `${j.chars - p.max} characters over the ${p.label} limit of ${p.max}. Shorten it and keep the main words first.` });
  else out.push({ ok: false, text: `Only ${j.chars} characters. There is room to add the main benefit or a specific detail (target ${p.ideal[0]}–${p.ideal[1]}).` });
  const k = keyword.trim().toLowerCase();
  if (k) {
    const pos = t.toLowerCase().indexOf(k);
    out.push(pos < 0
      ? { ok: false, text: `The keyword "${keyword.trim()}" is not in the title.` }
      : pos <= 30
        ? { ok: true, text: `The keyword "${keyword.trim()}" is included near the start.` }
        : { ok: false, text: `The keyword appears late (character ${pos + 1}). Consider moving it closer to the start.` });
  }
  if (t.length > 8 && t === t.toUpperCase() && /[A-Z]/.test(t)) out.push({ ok: false, text: "All capital letters is harder to read and wider in pixels." });
  const words = t.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
  const seen = new Map<string, number>();
  words.filter((w) => w.length > 3).forEach((w) => seen.set(w, (seen.get(w) ?? 0) + 1));
  const rep = [...seen.entries()].find(([, n]) => n >= 3);
  if (rep) out.push({ ok: false, text: `"${rep[0]}" is repeated ${rep[1]} times. Repeating the same word looks spammy.` });
  if (/[|\-–—:]\s.*[|\-–—:]\s.*[|\-–—:]/.test(t)) out.push({ ok: false, text: "Three or more separators (| - :) make a title look crowded. One is usually enough." });
  return out;
}

export default function SeoTitleChecker(_props: Props) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [platform, setPlatform] = useState<PlatformKey>("google");
  const [text, setText] = useState("");
  const [bulk, setBulk] = useState("");
  const [keyword, setKeyword] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const p = PLATFORMS.find((x) => x.key === platform) ?? PLATFORMS[0];
  const j = useMemo(() => judge(text, p), [text, p]);
  const ui = LEVEL[j.level];
  const tips = useMemo(() => advice(text, keyword, p), [text, keyword, p]);
  const rows = useMemo(() => bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 200).map((l) => ({ text: l, ...judge(l, p) })), [bulk, p]);

  const scale = p.max + Math.max(10, Math.round(p.max * 0.25));
  const pinPct = Math.min(100, (j.chars / scale) * 100);
  const zone = (a: number, b: number): CSSProperties => ({ left: `${(a / scale) * 100}%`, width: `${((b - a) / scale) * 100}%` });
  const pxPct = p.px ? Math.min(100, (j.px / p.px) * 100) : 0;

  const clipped = clip(text.trim() || "Your page title preview", 600);
  const mobile = device === "mobile";

  const copyCsv = async () => {
    const csv = ["title,characters,pixels,status", ...rows.map((r) => `"${r.text.replace(/"/g, '""')}",${r.chars},${r.px},${LEVEL[r.level].label}`)].join("\n");
    try { await navigator.clipboard.writeText(csv); setCopied(true); timer.current = window.setTimeout(() => setCopied(false), 1400); } catch { /* ignore */ }
  };

  const stats = [
    { k: "Characters", v: `${j.chars}`, sub: `/ ${p.max}`, Icon: Type, tone: "from-indigo-500 to-violet-500" },
    { k: "Words", v: String((text.match(/\S+/g) ?? []).length), sub: "", Icon: AlignLeft, tone: "from-fuchsia-500 to-pink-500" },
    { k: "Pixel width (approx.)", v: `${j.chars ? j.px : 0}px`, sub: p.px ? `/ ${p.px}px` : "Google only", Icon: Ruler, tone: "from-sky-500 to-cyan-500" },
    { k: j.chars > p.max ? "Over by" : "Left", v: String(Math.abs(p.max - j.chars)), sub: "", Icon: Hash, tone: j.chars > p.max ? "from-rose-500 to-orange-500" : "from-emerald-500 to-teal-500" },
  ];

  return (
    <SeoToolShell>
      <div className={`${seoCard} zseo-rise flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
        <div className="flex items-center gap-3">
          <span className="zseo-ico zseo-float flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-white shadow-lg shadow-indigo-500/30"><Type className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">Meta title length checker</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Characters + pixels + Google preview · marketplace limits</p>
          </div>
        </div>
        <div className="inline-flex rounded-xl border border-indigo-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5" role="tablist">
          {(["single", "bulk"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${mode === m ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 hover:text-indigo-700 dark:text-slate-300"}`}>
              {m === "single" ? "One title" : "Many (one per line)"}
            </button>
          ))}
        </div>
      </div>

      {/* platform */}
      <section className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ "--i": 1 } as CSSProperties} aria-label="Platform">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Choose a platform</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PLATFORMS.map((x) => (
            <button key={x.key} type="button" onClick={() => setPlatform(x.key)} aria-pressed={platform === x.key}
              className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${platform === x.key ? "border-transparent bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30" : "border-white/80 bg-white/70 text-slate-800 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"}`}>
              <span className="block text-sm font-extrabold">{x.label}</span>
              <span className={`block text-xs ${platform === x.key ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"}`}>{x.max} characters{x.px ? ` · ${x.px}px` : ""}</span>
            </button>
          ))}
        </div>
      </section>

      {mode === "single" ? (
        <>
          <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 2 } as CSSProperties}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="st-input">Enter your title</label>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${ui.pill}`}>
                <span className="relative flex h-2 w-2"><span className={`zseo-dot absolute inline-flex h-full w-full rounded-full ${ui.dot}`} /><span className={`relative inline-flex h-2 w-2 rounded-full ${ui.dot}`} /></span>
                {ui.label}
              </span>
            </div>
            <textarea id="st-input" rows={2} value={text} onChange={(e) => setText(e.target.value.replace(/\s*\n\s*/g, " "))} placeholder="Type or paste an SEO title or product listing title…" className={`${seoField} resize-y`} />

            <div className="relative mb-7 mt-9 px-1" role="progressbar" aria-valuenow={j.chars} aria-valuemax={p.max} aria-label="Title length">
              <div className="relative h-3.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <span className="absolute inset-y-0 bg-amber-300/70 dark:bg-amber-400/40" style={zone(0, p.ideal[0])} />
                <span className="absolute inset-y-0 bg-emerald-400/80 dark:bg-emerald-400/55" style={zone(p.ideal[0], p.max)} />
                <span className="absolute inset-y-0 bg-rose-400/70 dark:bg-rose-400/45" style={zone(p.max, scale)} />
                <span className="zseo-shine absolute inset-0" />
              </div>
              <div className="zseo-pin absolute -top-8 -translate-x-1/2" style={{ left: `${pinPct}%` }}>
                <span className={`block rounded-lg px-2 py-0.5 text-center text-xs font-extrabold tabular-nums text-white shadow-lg ${ui.bar}`}>{j.chars}</span>
                <span className={`mx-auto block h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent ${ui.arrow}`} />
              </div>
              <div className="relative mt-1.5 h-4 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="absolute left-0">0</span>
                <span className="absolute -translate-x-1/2" style={{ left: `${(p.ideal[0] / scale) * 100}%` }}>{p.ideal[0]}</span>
                <span className="absolute -translate-x-1/2" style={{ left: `${(p.max / scale) * 100}%` }}>{p.max}</span>
              </div>
              {p.px && (
                <>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10" title={`Pixel width ${j.px}px of about ${p.px}px`}>
                    <div className={`zseo-fill h-full rounded-full ${j.px > p.px ? "bg-rose-500" : "bg-gradient-to-r from-sky-400 to-indigo-500"}`} style={{ width: `${pxPct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Width: {j.chars ? j.px : 0}px of about {p.px}px</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(({ k, v, sub, Icon, tone }, n) => (
                <div key={k} className="zseo-rise rounded-2xl border border-white/80 bg-white/70 p-3.5 text-center dark:border-white/10 dark:bg-white/5" style={{ "--i": n + 2 } as CSSProperties}>
                  <span className={`zseo-ico mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-md`} style={{ "--i": n } as CSSProperties}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{v}<span className="ml-1 text-xs font-semibold text-slate-400">{sub}</span></p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 3 } as CSSProperties}>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="st-kw">Target keyword (optional)</label>
            <input id="st-kw" type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} className={`${seoField} sm:max-w-sm`} placeholder="e.g. meta title length" />
            {tips.length > 0 && (
              <ul className="mt-4 space-y-2" aria-live="polite">
                {tips.map((a, i) => (
                  <li key={i} className={`zseo-rise flex items-start gap-2.5 rounded-xl border p-3 text-sm ${a.ok ? "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"}`} style={{ "--i": i } as CSSProperties}>
                    {a.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                    <span>{a.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 4 } as CSSProperties}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Google search preview</h3>
              <div className="inline-flex rounded-xl border border-indigo-200/70 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/5">
                {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
                  <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${device === d ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 dark:text-slate-300"}`}>
                    <Icon className="h-3.5 w-3.5" />{d === "desktop" ? "Desktop" : "Mobile"}
                  </button>
                ))}
              </div>
            </div>
            <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900 ${mobile ? "max-w-[400px]" : "max-w-[720px]"}`}>
              <div className="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2 dark:border-white/10">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 flex-1 truncate rounded-full bg-white px-3 py-1 text-[11px] text-slate-500 dark:bg-slate-800">your search…</span>
              </div>
              <div className="p-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-md dark:border-white/10 dark:bg-slate-950">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500 dark:bg-slate-800">Z</span>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-[13px] text-slate-800 dark:text-slate-200">zidrotool.com</p>
                      <p className="truncate text-[12px] text-slate-500">https://zidrotool.com › tools</p>
                    </div>
                  </div>
                  <p className="mt-2 break-words leading-[1.3] text-[#1a0dab] dark:text-[#8ab4f8]" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: mobile ? 18 : 20 }}>{clipped}</p>
                  <p className="mt-1 text-[14px] leading-[1.58] text-[#4d5156] dark:text-[#bdc1c6]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>Your meta description will appear here, under the title, in the search result.</p>
                </div>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />The preview is an estimate. Google decides the final title and may rewrite or shorten it. Marketplace limits can change, so check the platform's own rules too.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={seoBtn} onClick={() => setText(SAMPLE)}>Try an example</button>
              <button type="button" className={seoBtn} onClick={() => { setText(""); setKeyword(""); }}><RotateCcw className="h-4 w-4" />Reset</button>
            </div>
          </section>
        </>
      ) : (
        <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 2 } as CSSProperties}>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="st-bulk">Paste one title per line (up to 200)</label>
          <textarea id="st-bulk" value={bulk} onChange={(e) => setBulk(e.target.value)} className={`${seoField} min-h-[160px] resize-y`} placeholder={`${SAMPLE}\nFree Online Tools for Everyone | ZidroTool`} />
          {rows.length > 0 && (
            <>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-indigo-100 dark:border-white/10">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-indigo-50/80 text-xs uppercase tracking-wide text-indigo-700 dark:bg-white/5 dark:text-indigo-200">
                    <tr><th className="p-3">Title</th><th className="p-3">Chars</th><th className="p-3">Pixels</th><th className="p-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="zseo-rise border-t border-indigo-50 dark:border-white/5" style={{ "--i": Math.min(i, 10) } as CSSProperties}>
                        <td className="max-w-[320px] truncate p-3" title={r.text}>{r.text}</td>
                        <td className="p-3 tabular-nums">{r.chars}</td>
                        <td className="p-3 tabular-nums">{r.px}</td>
                        <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${LEVEL[r.level].pill}`}>{LEVEL[r.level].label}</span></td>
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
