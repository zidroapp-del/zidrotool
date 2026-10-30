import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import {
  AlertCircle, Check, Download, FileArchive, FileText, ImageIcon, Loader2, Lock, RefreshCw, Shield, SlidersHorizontal,
  UploadCloud, X, Zap,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { downloadBytes } from "@/lib/utils";
import { SeoToolShell, seoBtn, seoCard } from "@/components/SeoToolShell";

if (typeof window !== "undefined") pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * PDF to image / PDF to JPG. Pages are drawn by the browser, nothing is uploaded.
 * Choose pages, format (JPG / PNG) and resolution, then download one by one or as a ZIP.
 */
type Props = { slug?: string; initial?: unknown };
type Out = { page: number; url: string; name: string; size: number; blob: Blob };

const MAX_THUMBS = 120;
const MAX_SIDE = 8000;
const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(2)} MB`);

/* ---- tiny ZIP writer (no compression: images are already compressed) ---- */
const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b: Uint8Array) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function makeZip(files: { name: string; data: Uint8Array }[]) {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [], central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 0x21, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true); lh.setUint16(26, name.length, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 0x21, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + size;
  }
  const cdSize = central.reduce((a, p) => a + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of all) { out.set(p, o); o += p.length; }
  return out;
}

/* ---- animated logo: a PDF sheet that turns into pictures ---- */
const LOGO_CSS = `
@keyframes zp2i-l { 0%,30% { transform: translate(18px,18px) scale(.5); opacity: 0; } 55%,85% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(0,0) scale(1); opacity: 0; } }
@keyframes zp2i-r { 0%,30% { transform: translate(-18px,14px) scale(.5); opacity: 0; } 55%,85% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(0,0) scale(1); opacity: 0; } }
@keyframes zp2i-sheet { 0%,25%,100% { transform: scale(1); } 40% { transform: scale(1.06); } 60% { transform: scale(.97); } }
@keyframes zp2i-glow { 0%,100% { opacity: .35; transform: scale(.92); } 55% { opacity: .85; transform: scale(1.08); } }
@keyframes zp2i-scan { 0%,10% { transform: translateY(0); opacity: 0; } 20% { opacity: 1; } 45% { transform: translateY(38px); opacity: 1; } 55%,100% { transform: translateY(38px); opacity: 0; } }
.zp2i-a { transform-box: fill-box; transform-origin: center; animation: zp2i-l 4.2s ease-in-out infinite; }
.zp2i-b { transform-box: fill-box; transform-origin: center; animation: zp2i-r 4.2s ease-in-out infinite; animation-delay: .25s; }
.zp2i-c { transform-box: fill-box; transform-origin: center; animation: zp2i-l 4.2s ease-in-out infinite; animation-delay: .5s; }
.zp2i-sheet { transform-box: fill-box; transform-origin: center; animation: zp2i-sheet 4.2s ease-in-out infinite; }
.zp2i-glow { animation: zp2i-glow 4.2s ease-in-out infinite; }
.zp2i-scan { animation: zp2i-scan 4.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .zp2i-a,.zp2i-b,.zp2i-c,.zp2i-sheet,.zp2i-glow,.zp2i-scan { animation: none !important; } }
`;
function PdfImgLogo({ size = 112 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <style>{LOGO_CSS}</style>
      <div className="zp2i-glow absolute inset-2 rounded-full bg-gradient-to-br from-rose-400/50 via-violet-400/50 to-sky-300/50 blur-xl" />
      <svg viewBox="0 0 96 96" className="relative h-full w-full drop-shadow-xl">
        <defs>
          <linearGradient id="p2i-sheet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#e0e7ff" /></linearGradient>
          <linearGradient id="p2i-badge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f43f5e" /><stop offset="1" stopColor="#e11d48" /></linearGradient>
          <linearGradient id="p2i-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
          <linearGradient id="p2i-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#ec4899" /></linearGradient>
          <linearGradient id="p2i-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient>
        </defs>
        <g className="zp2i-a"><rect x="4" y="10" width="26" height="22" rx="4" fill="url(#p2i-a)" /><circle cx="12" cy="18" r="3" fill="#fff" opacity=".85" /><path d="M6 30l8-8 6 5 5-4 5 7z" fill="#fff" opacity=".6" /></g>
        <g className="zp2i-b"><rect x="66" y="8" width="26" height="22" rx="4" fill="url(#p2i-b)" /><circle cx="74" cy="16" r="3" fill="#fff" opacity=".85" /><path d="M68 28l8-8 6 5 5-4 5 7z" fill="#fff" opacity=".6" /></g>
        <g className="zp2i-c"><rect x="68" y="50" width="24" height="20" rx="4" fill="url(#p2i-c)" /><circle cx="75" cy="57" r="2.6" fill="#fff" opacity=".85" /><path d="M70 68l7-7 5 4 5-4 4 7z" fill="#fff" opacity=".6" /></g>
        <g className="zp2i-sheet">
          <path d="M26 16h28l16 16v46a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6z" fill="url(#p2i-sheet)" stroke="#a5b4fc" strokeWidth="1.5" />
          <path d="M54 16v12a4 4 0 0 0 4 4h12z" fill="#c7d2fe" />
          <rect x="28" y="42" width="32" height="3" rx="1.5" fill="#c7d2fe" /><rect x="28" y="49" width="24" height="3" rx="1.5" fill="#c7d2fe" />
          <rect x="22" y="62" width="38" height="18" rx="5" fill="url(#p2i-badge)" />
          <text x="41" y="75.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1">PDF</text>
          <rect className="zp2i-scan" x="22" y="30" width="46" height="2.5" rx="1.2" fill="#6366f1" opacity=".8" />
        </g>
      </svg>
    </div>
  );
}

const FEATURES: [typeof Shield, string, string][] = [
  [Shield, "Private by design", "Your PDF is read inside your browser. It is never uploaded to a server."],
  [SlidersHorizontal, "Choose what you need", "Pick the pages, JPG or PNG, and the resolution from screen size up to print quality."],
  [FileArchive, "Download in one click", "Save a single page, or every page together in one ZIP file."],
];

export default function PdfToImageStudio({ slug = "pdf-to-image" }: Props) {
  const { error, success } = useToast();
  const jpgPage = slug === "pdf-to-jpg";
  const input = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<any>(null);
  const urls = useRef<string[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [format, setFormat] = useState<"jpg" | "png">(jpgPage ? "jpg" : "png");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(92);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");
  const [results, setResults] = useState<Out[]>([]);

  const revokeAll = () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); urls.current = []; };
  useEffect(() => () => { revokeAll(); pdfRef.current?.destroy?.(); }, []);
  useEffect(() => { setFormat(jpgPage ? "jpg" : "png"); }, [jpgPage]);

  const reset = () => {
    revokeAll(); pdfRef.current?.destroy?.(); pdfRef.current = null;
    setFile(null); setPages(0); setThumbs({}); setSel(new Set()); setResults([]); setMsg(""); setProgress(0);
  };

  const load = useCallback(async (f?: File | null) => {
    if (!f) return;
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { setMsg("Please choose a PDF file."); return; }
    reset();
    setFile(f); setLoading(true);
    try {
      const doc = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
      pdfRef.current = doc;
      setPages(doc.numPages);
      setSel(new Set(Array.from({ length: doc.numPages }, (_, i) => i + 1)));
      setLoading(false);
      // small previews, one after another, so the page stays responsive
      for (let n = 1; n <= Math.min(doc.numPages, MAX_THUMBS); n++) {
        if (pdfRef.current !== doc) return;
        const page = await doc.getPage(n);
        const vp0 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 160 / vp0.width });
        const c = document.createElement("canvas");
        c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
        const ctx = c.getContext("2d");
        if (!ctx) continue;
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const url = c.toDataURL("image/jpeg", 0.7);
        setThumbs((t) => ({ ...t, [n]: url }));
      }
    } catch (e: any) {
      console.error(e);
      setMsg(e?.name === "PasswordException" ? "This PDF is password-protected. Remove the password first, then try again." : "Could not open this PDF. The file may be damaged.");
      setFile(null); setLoading(false);
    }
  }, []);

  const toggle = (n: number) => { setSel((s) => { const c = new Set(s); c.has(n) ? c.delete(n) : c.add(n); return c; }); setResults([]); };
  const all = () => { setSel(new Set(Array.from({ length: pages }, (_, i) => i + 1))); setResults([]); };
  const none = () => { setSel(new Set()); setResults([]); };
  const invert = () => { setSel((s) => new Set(Array.from({ length: pages }, (_, i) => i + 1).filter((n) => !s.has(n)))); setResults([]); };

  const base = (file?.name || "document").replace(/\.pdf$/i, "").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "document";
  const pad = (n: number) => String(n).padStart(String(pages).length, "0");

  const convert = async () => {
    const doc = pdfRef.current;
    const list = [...sel].sort((a, b) => a - b);
    if (!doc || !list.length) { setMsg("Select at least one page."); return; }
    setBusy(true); setMsg(""); setProgress(0);
    revokeAll(); setResults([]);
    try {
      const out: Out[] = [];
      for (let i = 0; i < list.length; i++) {
        const n = list[i];
        const page = await doc.getPage(n);
        const vp0 = page.getViewport({ scale: 1 });
        const k = Math.min(scale, MAX_SIDE / Math.max(vp0.width, vp0.height));
        const vp = page.getViewport({ scale: k });
        const c = document.createElement("canvas");
        c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error("Canvas is not available in this browser.");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, format === "jpg" ? "image/jpeg" : "image/png", format === "jpg" ? quality / 100 : undefined));
        if (!blob) throw new Error("Could not create an image from one of the pages.");
        const url = URL.createObjectURL(blob);
        urls.current.push(url);
        out.push({ page: n, url, blob, size: blob.size, name: `${base}-page-${pad(n)}.${format}` });
        c.width = c.height = 0;
        setProgress(Math.round(((i + 1) / list.length) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
      setResults(out);
      success(`${out.length} image${out.length > 1 ? "s" : ""} ready`);
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || "Conversion failed. Try a lower resolution.");
      error("Conversion failed");
    } finally { setBusy(false); }
  };

  const saveOne = (o: Out) => { const a = document.createElement("a"); a.href = o.url; a.download = o.name; document.body.appendChild(a); a.click(); a.remove(); };
  const saveZip = async () => {
    const files = await Promise.all(results.map(async (o) => ({ name: o.name, data: new Uint8Array(await o.blob.arrayBuffer()) })));
    downloadBytes(`${base}-images.zip`, makeZip(files), "application/zip");
  };

  const total = results.reduce((a, r) => a + r.size, 0);
  const SCALES: [number, string, string][] = [[1, "Screen", "72 dpi"], [2, "Good", "144 dpi"], [3, "High", "216 dpi"], [4, "Print", "288 dpi"]];

  return (
    <SeoToolShell>
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { load(e.target.files?.[0]); e.target.value = ""; }} />

      {!file ? (
        <>
          <div className={`${seoCard} zseo-rise flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left`}>
            <PdfImgLogo size={120} />
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{jpgPage ? "PDF to JPG converter" : "PDF to image converter"}</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {jpgPage ? "Turn every page of a PDF into a JPG photo in seconds. Choose the pages and the quality, then download them one by one or as a ZIP." : "Turn PDF pages into JPG or PNG images in seconds. Choose the pages and the resolution, then download them one by one or as a ZIP."}
              </p>
              <p className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {["Free", "No upload", "JPG & PNG", "Up to print quality"].map((t) => (
                  <span key={t} className="rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-white/10 dark:bg-white/5 dark:text-indigo-100">{t}</span>
                ))}
              </p>
            </div>
          </div>

          <button type="button" onClick={() => input.current?.click()}
            onDragEnter={(e) => { if (e.dataTransfer.types.includes("Files")) setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]); }}
            className={`${seoCard} zseo-rise group flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-5 py-12 text-center transition ${drag ? "scale-[1.01] border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/10" : "border-indigo-300/80 hover:-translate-y-0.5 hover:border-indigo-500"}`}>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-110 ${drag ? "zseo-float" : ""}`}><UploadCloud className="h-6 w-6" /></span>
            <span className="text-base font-bold text-slate-900 dark:text-white">Drop your PDF here</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">or click to choose a file</span>
          </button>

          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
            {FEATURES.map(([Icon, t, d], i) => (
              <div key={t} style={{ ["--i" as any]: i }} className={`${seoCard} zseo-rise p-4 transition hover:-translate-y-1`}>
                <span className="zseo-float grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30" style={{ ["--i" as any]: i }}><Icon className="h-4 w-4" /></span>
                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{t}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{d}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={`${seoCard} zseo-rise flex flex-wrap items-center gap-3 p-4`}>
            <PdfImgLogo size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white" title={file.name}>{file.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{loading ? "Reading your PDF…" : `${pages} page${pages > 1 ? "s" : ""} · ${fmtSize(file.size)}`}</p>
            </div>
            <button type="button" onClick={() => input.current?.click()} className={seoBtn}><RefreshCw className="h-4 w-4" />Change file</button>
            <button type="button" onClick={reset} className={seoBtn} aria-label="Remove file"><X className="h-4 w-4" /></button>
          </div>

          {loading && <div className={`${seoCard} flex items-center justify-center gap-3 p-8 text-slate-600 dark:text-slate-300`}><Loader2 className="h-5 w-5 animate-spin" />Opening PDF…</div>}

          {!loading && pages > 0 && (
            <>
              <div className={`${seoCard} zseo-rise p-4 sm:p-5`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sel.size} of {pages} page{pages > 1 ? "s" : ""} selected</p>
                  <div className="flex gap-1.5 text-xs font-semibold">
                    {[["All", all], ["None", none], ["Invert", invert]].map(([l, fn]: any) => (
                      <button key={l} type="button" onClick={fn} className="rounded-lg px-2.5 py-1 text-indigo-700 transition hover:bg-indigo-100/70 dark:text-indigo-200 dark:hover:bg-white/10">{l}</button>
                    ))}
                  </div>
                </div>
                <ul className="grid max-h-[26rem] gap-3 overflow-y-auto p-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(7.5rem, 1fr))" }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
                    const on = sel.has(n);
                    return (
                      <li key={n}>
                        <button type="button" onClick={() => toggle(n)} aria-pressed={on}
                          className={`group relative block w-full overflow-hidden rounded-xl border-2 bg-white text-left transition hover:-translate-y-0.5 ${on ? "border-indigo-500 shadow-md shadow-indigo-500/20" : "border-slate-200 opacity-60 dark:border-white/10"}`}>
                          <div className="grid aspect-[3/4] place-items-center bg-slate-100 dark:bg-slate-900">
                            {thumbs[n] ? <img src={thumbs[n]} alt={`Page ${n}`} className="h-full w-full object-contain" /> : <FileText className="h-6 w-6 text-slate-300" />}
                          </div>
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] font-bold text-white">{n}</span>
                          <span className={`absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full text-white transition ${on ? "bg-indigo-600 scale-100" : "scale-0"}`}><Check className="h-3 w-3" /></span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {pages > MAX_THUMBS && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Previews are shown for the first {MAX_THUMBS} pages. All pages are converted.</p>}
              </div>

              <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 1 }}>
                <p className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">Image options</p>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))" }}>
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Format</p>
                    <div className="inline-flex rounded-xl border border-indigo-200/70 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/5">
                      {([["jpg", "JPG · smaller"], ["png", "PNG · sharpest"]] as const).map(([v, l]) => (
                        <button key={v} type="button" aria-pressed={format === v} onClick={() => { setFormat(v); setResults([]); }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${format === v ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-white/10"}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Resolution</p>
                    <div className="inline-flex flex-wrap rounded-xl border border-indigo-200/70 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/5">
                      {SCALES.map(([v, l, d]) => (
                        <button key={v} type="button" aria-pressed={scale === v} onClick={() => { setScale(v); setResults([]); }} title={d}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${scale === v ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-white/10"}`}>{l}<span className="ml-1 opacity-70">{d}</span></button>
                      ))}
                    </div>
                  </div>
                  {format === "jpg" && (
                    <div>
                      <label htmlFor="q" className="mb-1.5 flex justify-between text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"><span>JPG quality</span><span>{quality}%</span></label>
                      <input id="q" type="range" min={60} max={100} value={quality} onChange={(e) => { setQuality(Number(e.target.value)); setResults([]); }} className="w-full accent-indigo-600" />
                    </div>
                  )}
                </div>
              </div>

              <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 2 }}>
                {busy && (
                  <div className="mb-4">
                    <div className="h-2 overflow-hidden rounded-full bg-indigo-100 dark:bg-white/10"><div className="zseo-fill h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${progress}%` }} /></div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Converting… {progress}%</p>
                  </div>
                )}
                <button type="button" onClick={convert} disabled={busy || !sel.size} className="zseo-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:opacity-60">
                  {busy ? <><Loader2 className="h-5 w-5 animate-spin" />Converting…</> : <><ImageIcon className="h-5 w-5" />Convert {sel.size} page{sel.size > 1 ? "s" : ""} to {format.toUpperCase()}</>}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {msg && <div className={`${seoCard} flex items-start gap-3 p-4 text-sm text-amber-800 dark:text-amber-200`} role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{msg}</p></div>}

      {results.length > 0 && (
        <div className={`${seoCard} zseo-rise p-4 sm:p-5`}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"><Check className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 dark:text-white">{results.length} image{results.length > 1 ? "s" : ""} ready · {fmtSize(total)}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Click a picture to open it, or download everything.</p>
            </div>
            {results.length > 1 && <button type="button" onClick={saveZip} className="zseo-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"><FileArchive className="h-4 w-4" />Download ZIP</button>}
          </div>
          <ul className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))" }}>
            {results.map((o, i) => (
              <li key={o.page} style={{ ["--i" as any]: Math.min(i, 12) }} className="zseo-rise overflow-hidden rounded-2xl border border-indigo-100 bg-white/85 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/5">
                <a href={o.url} target="_blank" rel="noreferrer" className="block aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900"><img src={o.url} alt={`Page ${o.page}`} className="h-full w-full object-contain" /></a>
                <div className="flex items-center gap-2 p-2.5">
                  <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-800 dark:text-slate-100">Page {o.page}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">{fmtSize(o.size)}</p></div>
                  <button type="button" onClick={() => saveOne(o)} aria-label={`Download page ${o.page}`} className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700"><Download className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SeoToolShell>
  );
}
