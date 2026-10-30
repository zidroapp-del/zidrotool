import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Info, Monitor, RotateCcw, Smartphone } from "lucide-react";
import { SeoToolShell, seoBtn, seoCard, seoField } from "@/components/SeoToolShell";


const CFG = {
  title: { font: "400 20px Arial, Helvetica, sans-serif" },
  description: { font: "400 14px Arial, Helvetica, sans-serif", desktopPx: 920, mobilePx: 680 },
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

/** Google result preview with editable title, URL and description (desktop + mobile, cut by pixel width). */
const SAMPLE = {
  title: "Free Online Tools for Everyone | ZidroTool",
  url: "https://zidrotool.com/tools",
  desc: "Fast, free and private online tools for images, PDF, text, SEO and more. Nothing is uploaded, everything runs in your browser.",
};

function crumbs(url: string): { host: string; path: string } {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    const parts = u.pathname.split("/").filter(Boolean);
    return { host: `${u.protocol}//${u.host}`, path: parts.length ? " › " + parts.join(" › ") : "" };
  } catch {
    return { host: url || "https://www.example.com", path: "" };
  }
}

export default function SerpPreview() {
  const [title, setTitle] = useState(SAMPLE.title);
  const [url, setUrl] = useState(SAMPLE.url);
  const [desc, setDesc] = useState(SAMPLE.desc);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const mobile = device === "mobile";

  const tPx = useMemo(() => widthOf(title.trim(), CFG.title.font), [title]);
  const dPx = useMemo(() => widthOf(desc.trim(), CFG.description.font), [desc]);
  const tLimit = 600;
  const dLimit = (mobile ? CFG.description.mobilePx : CFG.description.desktopPx) * 2 - 20;
  const tClip = clip(title.trim() || "Your page title preview", CFG.title.font, tLimit);
  const dClip = clip(desc.trim() || "Add a clear, relevant meta description to help searchers understand this page.", CFG.description.font, dLimit);
  const c = crumbs(url.trim());
  const bar = (px: number, limit: number) => (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
      <div className={`zseo-fill h-full rounded-full ${px > limit ? "bg-rose-500" : "bg-gradient-to-r from-sky-400 to-indigo-500"}`} style={{ width: `${Math.min(100, (px / limit) * 100)}%` }} />
    </div>
  );

  return (
    <SeoToolShell>
      <div className={`${seoCard} zseo-rise p-4 sm:p-6`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Edit your search result</h3>
          <button type="button" className={seoBtn} onClick={() => { setTitle(SAMPLE.title); setUrl(SAMPLE.url); setDesc(SAMPLE.desc); }}><RotateCcw className="h-4 w-4" />Example</button>
        </div>
        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="sp-title">
              <span>Title</span><span className={tPx > tLimit ? "text-rose-600" : "text-slate-500"}>{title.trim().length} chars · {tPx}px / {tLimit}px</span>
            </label>
            <input id="sp-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={seoField} />
            {bar(tPx, tLimit)}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="sp-url">URL</label>
            <input id="sp-url" type="text" value={url} onChange={(e) => setUrl(e.target.value)} className={seoField} />
          </div>
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="sp-desc">
              <span>Meta description</span><span className={dPx > dLimit ? "text-rose-600" : "text-slate-500"}>{desc.trim().length} chars · {dPx}px</span>
            </label>
            <textarea id="sp-desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value.replace(/\s*\n\s*/g, " "))} className={`${seoField} resize-y`} />
            {bar(dPx, dLimit)}
          </div>
        </div>
      </div>

      <div className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 1 } as CSSProperties}>
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
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500 dark:bg-slate-800">{(c.host.replace(/^https?:\/\/(www\.)?/, "")[0] || "z").toUpperCase()}</span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[13px] text-slate-800 dark:text-slate-200">{c.host.replace(/^https?:\/\/(www\.)?/, "")}</p>
                  <p className="truncate text-[12px] text-slate-500">{c.host}{c.path}</p>
                </div>
              </div>
              <p className="mt-2 break-words leading-[1.3] text-[#1a0dab] dark:text-[#8ab4f8]" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: mobile ? 18 : 20 }}>{tClip.text}</p>
              <p className="mt-1 break-words text-[14px] leading-[1.58] text-[#4d5156] dark:text-[#bdc1c6]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>{dClip.text}</p>
            </div>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />An estimate: Google decides the final title and description and may rewrite or shorten them.</p>
      </div>
    </SeoToolShell>
  );
}
