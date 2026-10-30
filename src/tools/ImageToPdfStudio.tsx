import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import {
  AlertCircle, ArrowDown, ArrowUp, Check, Download, FilePlus2, FileText, GripVertical, ImagePlus, Loader2, Lock,
  RotateCw, Shield, SlidersHorizontal, Trash2, UploadCloud, Zap,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { downloadBytes } from "@/lib/utils";
import { SeoToolShell, seoBtn, seoCard, seoField } from "@/components/SeoToolShell";

/**
 * Images to PDF (also used for JPG to PDF). Everything runs in the browser: the images never leave the device.
 * Reorder (drag or arrows), rotate, choose page size / orientation / margin, then download one PDF.
 */
type Props = { slug?: string; initial?: unknown };
type Item = { id: number; file: File; url: string; w: number; h: number; rot: 0 | 90 | 180 | 270 };

const PAGE = { a4: [595.28, 841.89], letter: [612, 792] } as const;
const MM = 72 / 25.4;
const MAX_SIDE = 6000;

const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(2)} MB`);
const isImage = (f: File) => /^image\//i.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name);

const COPY: Record<string, { drop: string; sub: string }> = {
  "image-to-pdf": { drop: "Drop your images here", sub: "JPG, PNG, WebP and more · add as many as you like" },
  "jpg-to-pdf": { drop: "Drop your JPG images here", sub: "JPG / JPEG (PNG and WebP also work) · add as many as you like" },
};

async function renderToBytes(it: Item, kind: "png" | "jpg"): Promise<Uint8Array> {
  const bmp = await createImageBitmap(it.file); // respects the photo's orientation
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const swap = it.rot === 90 || it.rot === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? h : w;
  canvas.height = swap ? w : h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  if (kind === "jpg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((it.rot * Math.PI) / 180);
  ctx.drawImage(bmp, -w / 2, -h / 2, w, h);
  bmp.close?.();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, kind === "png" ? "image/png" : "image/jpeg", 0.92));
  if (!blob) throw new Error("Could not read one of the images.");
  return new Uint8Array(await blob.arrayBuffer());
}

/** A JPEG can be embedded untouched, unless the photo carries a rotation flag that PDF viewers ignore. */
async function jpegNeedsCanvas(it: Item) {
  try {
    const raw = await createImageBitmap(it.file, { imageOrientation: "none" } as ImageBitmapOptions);
    const differs = raw.width !== it.w || raw.height !== it.h;
    raw.close?.();
    return differs;
  } catch { return true; }
}


const LOGO_CSS = `
@keyframes zpdf-in-l { 0% { transform: translate(-30px,6px) rotate(-14deg) scale(.8); opacity: 0; } 25% { opacity: 1; } 55%,100% { transform: translate(14px,24px) rotate(-3deg) scale(.55); opacity: 0; } }
@keyframes zpdf-in-r { 0% { transform: translate(34px,-4px) rotate(14deg) scale(.8); opacity: 0; } 25% { opacity: 1; } 55%,100% { transform: translate(-10px,26px) rotate(4deg) scale(.55); opacity: 0; } }
@keyframes zpdf-sheet { 0%,45%,100% { transform: translateY(0) scale(1); } 60% { transform: translateY(-3px) scale(1.05); } 75% { transform: translateY(0) scale(1); } }
@keyframes zpdf-glow { 0%,100% { opacity: .35; transform: scale(.92); } 60% { opacity: .85; transform: scale(1.08); } }
@keyframes zpdf-badge { 0%,50% { transform: scale(1); } 62% { transform: scale(1.18); } 75%,100% { transform: scale(1); } }
@keyframes zpdf-spark { 0%,100% { opacity: 0; transform: scale(.4); } 62% { opacity: 1; transform: scale(1); } 85% { opacity: 0; transform: scale(1.4); } }
.zpdf-c1 { transform-box: fill-box; transform-origin: center; animation: zpdf-in-l 4s ease-in-out infinite; }
.zpdf-c2 { transform-box: fill-box; transform-origin: center; animation: zpdf-in-r 4s ease-in-out infinite; animation-delay: .35s; }
.zpdf-c3 { transform-box: fill-box; transform-origin: center; animation: zpdf-in-l 4s ease-in-out infinite; animation-delay: .8s; }
.zpdf-sheet { transform-box: fill-box; transform-origin: center; animation: zpdf-sheet 4s ease-in-out infinite; }
.zpdf-badge { transform-box: fill-box; transform-origin: center; animation: zpdf-badge 4s ease-in-out infinite; }
.zpdf-glow { animation: zpdf-glow 4s ease-in-out infinite; }
.zpdf-spark { transform-box: fill-box; transform-origin: center; animation: zpdf-spark 4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .zpdf-c1,.zpdf-c2,.zpdf-c3,.zpdf-sheet,.zpdf-badge,.zpdf-glow,.zpdf-spark { animation: none !important; } .zpdf-c1,.zpdf-c2,.zpdf-c3 { opacity: 0; } }
`;

/** Animated logo: pictures fly into a PDF sheet. */
function PdfLogo({ size = 112 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <style>{LOGO_CSS}</style>
      <div className="zpdf-glow absolute inset-2 rounded-full bg-gradient-to-br from-indigo-400/60 via-violet-400/50 to-sky-300/50 blur-xl" />
      <svg viewBox="0 0 96 96" className="relative h-full w-full drop-shadow-xl">
        <defs>
          <linearGradient id="zp-sheet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e0e7ff" /></linearGradient>
          <linearGradient id="zp-badge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f43f5e" /><stop offset="1" stopColor="#e11d48" /></linearGradient>
          <linearGradient id="zp-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
          <linearGradient id="zp-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#ec4899" /></linearGradient>
          <linearGradient id="zp-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient>
        </defs>
        {/* flying pictures */}
        <g className="zpdf-c1"><rect x="4" y="12" width="26" height="22" rx="4" fill="url(#zp-a)" /><circle cx="12" cy="20" r="3" fill="#fff" opacity=".85" /><path d="M6 32l8-8 6 5 5-4 5 7z" fill="#fff" opacity=".6" /></g>
        <g className="zpdf-c2"><rect x="66" y="8" width="26" height="22" rx="4" fill="url(#zp-b)" /><circle cx="74" cy="16" r="3" fill="#fff" opacity=".85" /><path d="M68 28l8-8 6 5 5-4 5 7z" fill="#fff" opacity=".6" /></g>
        <g className="zpdf-c3"><rect x="2" y="44" width="24" height="20" rx="4" fill="url(#zp-c)" /><circle cx="9" cy="51" r="2.6" fill="#fff" opacity=".85" /><path d="M4 62l7-7 5 4 5-4 4 7z" fill="#fff" opacity=".6" /></g>
        {/* PDF sheet */}
        <g className="zpdf-sheet">
          <path d="M28 14h28l16 16v48a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" fill="url(#zp-sheet)" stroke="#a5b4fc" strokeWidth="1.5" />
          <path d="M56 14v12a4 4 0 0 0 4 4h12z" fill="#c7d2fe" />
          <rect x="30" y="40" width="34" height="3" rx="1.5" fill="#c7d2fe" />
          <rect x="30" y="47" width="26" height="3" rx="1.5" fill="#c7d2fe" />
          <rect x="30" y="54" width="30" height="3" rx="1.5" fill="#c7d2fe" />
          <g className="zpdf-badge"><rect x="24" y="64" width="38" height="18" rx="5" fill="url(#zp-badge)" /><text x="43" y="77.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1">PDF</text></g>
        </g>
        <g className="zpdf-spark"><path d="M80 52l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fbbf24" /></g>
      </svg>
    </div>
  );
}

const FEATURES: [typeof Shield, string, string][] = [
  [Shield, "Private by design", "Your images are turned into a PDF inside your browser. Nothing is uploaded to a server."],
  [SlidersHorizontal, "Full control", "Reorder by dragging, rotate any picture, and choose A4, Letter or the original size."],
  [Zap, "Fast and free", "No sign-up, no watermark and no limit on the number of pages."],
];

export default function ImageToPdfStudio({ slug = "image-to-pdf" }: Props) {
  const { error, success } = useToast();
  const copy = COPY[slug] || COPY["image-to-pdf"];
  const input = useRef<HTMLInputElement>(null);
  const idRef = useRef(1);
  const urls = useRef<string[]>([]);

  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [size, setSize] = useState<"fit" | "a4" | "letter">("fit");
  const [orient, setOrient] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState(0);
  const [name, setName] = useState("images");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<{ bytes: Uint8Array; pages: number } | null>(null);

  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const add = useCallback(async (list: FileList | File[] | null) => {
    if (!list) return;
    const all = Array.from(list);
    const files = all.filter(isImage);
    if (all.length && !files.length) { setMsg("Those files are not images. Choose JPG, PNG or WebP files."); return; }
    setMsg(all.length > files.length ? "Some files were skipped because they are not images." : "");
    setResult(null);
    const next: Item[] = [];
    for (const file of files) {
      try {
        const bmp = await createImageBitmap(file);
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        next.push({ id: idRef.current++, file, url, w: bmp.width, h: bmp.height, rot: 0 });
        bmp.close?.();
      } catch { setMsg(`“${file.name}” could not be read and was skipped.`); }
    }
    setItems((x) => [...x, ...next]);
  }, []);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((x) => { const c = [...x]; const [m] = c.splice(from, 1); c.splice(to, 0, m); return c; });
    setResult(null);
  };
  const remove = (id: number) => { setItems((x) => x.filter((i) => i.id !== id)); setResult(null); };
  const rotate = (id: number) => { setItems((x) => x.map((i) => (i.id === id ? { ...i, rot: ((i.rot + 90) % 360) as Item["rot"] } : i))); setResult(null); };
  const clear = () => { setItems([]); setResult(null); setMsg(""); };

  const create = async () => {
    if (!items.length) return;
    setBusy(true); setMsg(""); setResult(null); setProgress(0);
    try {
      const pdf = await PDFDocument.create();
      const m = margin * MM;
      for (let n = 0; n < items.length; n++) {
        const it = items[n];
        const swap = it.rot === 90 || it.rot === 270;
        const iw = swap ? it.h : it.w, ih = swap ? it.w : it.h;

        const type = it.file.type.toLowerCase();
        let img;
        if (it.rot === 0 && type === "image/png") img = await pdf.embedPng(new Uint8Array(await it.file.arrayBuffer()));
        else if (it.rot === 0 && /image\/jpe?g/.test(type) && !(await jpegNeedsCanvas(it))) img = await pdf.embedJpg(new Uint8Array(await it.file.arrayBuffer()));
        else img = type === "image/png" ? await pdf.embedPng(await renderToBytes(it, "png")) : await pdf.embedJpg(await renderToBytes(it, "jpg"));

        let pw: number, ph: number, scale: number;
        if (size === "fit") { scale = 0.75; pw = iw * scale + 2 * m; ph = ih * scale + 2 * m; }
        else {
          const [bw, bh] = PAGE[size];
          const landscape = orient === "auto" ? iw > ih : orient === "landscape";
          pw = landscape ? bh : bw; ph = landscape ? bw : bh;
          scale = Math.min((pw - 2 * m) / iw, (ph - 2 * m) / ih);
        }
        const dw = iw * scale, dh = ih * scale;
        const page = pdf.addPage([pw, ph]);
        page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
        setProgress(Math.round(((n + 1) / items.length) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
      const bytes = await pdf.save();
      setResult({ bytes, pages: items.length });
      success("Your PDF is ready");
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || "Could not create the PDF. Try different images.");
      error("PDF creation failed");
    } finally { setBusy(false); }
  };

  const fileName = `${(name.trim() || "images").replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-")}.pdf`;
  const total = items.reduce((a, i) => a + i.file.size, 0);

  const Seg = ({ value, set, opts }: { value: string; set: (v: any) => void; opts: [string, string][] }) => (
    <div className="inline-flex flex-wrap rounded-xl border border-indigo-200/70 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/5" role="group">
      {opts.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => { set(v); setResult(null); }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${value === v ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-white/10"}`}>{l}</button>
      ))}
    </div>
  );

  return (
    <SeoToolShell>
      {/* header */}
      {items.length === 0 ? (
        <div className={`${seoCard} zseo-rise flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left`}>
          <PdfLogo size={120} />
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{slug === "jpg-to-pdf" ? "JPG to PDF converter" : "Images to PDF converter"}</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {slug === "jpg-to-pdf"
                ? "Turn one or many JPG photos into a single, clean PDF in seconds. Put them in the order you want, rotate them, and download."
                : "Combine JPG, PNG and WebP pictures into one PDF in seconds. Put them in the order you want, rotate them, and download."}
            </p>
            <p className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {["Free", "No watermark", "No upload", "Any number of pages"].map((t) => (
                <span key={t} className="rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-white/10 dark:bg-white/5 dark:text-indigo-100">{t}</span>
              ))}
            </p>
          </div>
        </div>
      ) : (
        <div className="zseo-rise flex flex-wrap items-center gap-3 px-1">
          <PdfLogo size={52} />
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">Turn your pictures into one PDF</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3 text-emerald-500" />Files never leave your device</span>
              <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-indigo-500" />Free, no watermark</span>
            </p>
          </div>
        </div>
      )}

      {/* drop zone */}
      <input ref={input} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <button type="button"
        onClick={() => input.current?.click()}
        onDragEnter={(e) => { if (e.dataTransfer.types.includes("Files")) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
        onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); } }}
        className={`${seoCard} zseo-rise group flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-5 text-center transition ${items.length ? "py-6" : "py-12"} ${drag ? "scale-[1.01] border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/10" : "border-indigo-300/80 hover:-translate-y-0.5 hover:border-indigo-500"}`}>
        <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-110 ${drag ? "zseo-float" : ""}`}>
          {items.length ? <ImagePlus className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
        </span>
        <span className="text-base font-bold text-slate-900 dark:text-white">{items.length ? "Add more images" : copy.drop}</span>
        <span className="text-xs text-slate-600 dark:text-slate-300">{items.length ? "or drop them here" : copy.sub}</span>
      </button>

      {msg && (
        <div className={`${seoCard} flex items-start gap-3 p-4 text-sm text-amber-800 dark:text-amber-200`} role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{msg}</p></div>
      )}

      {items.length > 0 && (
        <>
          {/* list */}
          <div className={`${seoCard} zseo-rise p-4 sm:p-5`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{items.length} image{items.length > 1 ? "s" : ""} · {fmtSize(total)} · drag to reorder</p>
              <button type="button" onClick={clear} className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-300">Remove all</button>
            </div>
            <ul className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(10.5rem, 1fr))" }}>
              {items.map((it, i) => (
                <li key={it.id} draggable
                  onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
                  onDragOver={(e) => { if (dragIdx !== null) { e.preventDefault(); setOverIdx(i); } }}
                  onDrop={(e) => { if (dragIdx !== null) { e.preventDefault(); move(dragIdx, i); } setDragIdx(null); setOverIdx(null); }}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  style={{ ["--i" as any]: Math.min(i, 12) }}
                  className={`zseo-rise group relative overflow-hidden rounded-2xl border bg-white/85 shadow-sm transition dark:bg-white/5 ${overIdx === i && dragIdx !== i ? "border-indigo-500 ring-2 ring-indigo-400/40" : "border-indigo-100 dark:border-white/10"} ${dragIdx === i ? "opacity-40" : "hover:-translate-y-0.5 hover:shadow-lg"}`}>
                  <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img src={it.url} alt={it.file.name} draggable={false} className="max-h-full max-w-full object-contain transition-transform duration-300" style={{ transform: `rotate(${it.rot}deg) scale(${it.rot % 180 ? 0.75 : 1})` }} />
                    <span className="absolute left-2 top-2 grid h-6 min-w-[1.5rem] place-items-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white shadow">{i + 1}</span>
                    <GripVertical className="absolute right-2 top-2 h-4 w-4 cursor-grab text-slate-400 opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100" title={it.file.name}>{it.file.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{it.w}×{it.h} · {fmtSize(it.file.size)}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier" className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-indigo-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move later" className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-indigo-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => rotate(it.id)} aria-label="Rotate" className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-indigo-100 dark:text-slate-300 dark:hover:bg-white/10"><RotateCw className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => remove(it.id)} aria-label="Remove" className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-rose-500 transition hover:bg-rose-100 dark:hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* options */}
          <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 1 }}>
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">PDF options</p>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Page size</p>
                <Seg value={size} set={setSize} opts={[["fit", "Same as image"], ["a4", "A4"], ["letter", "Letter"]]} />
              </div>
              {size !== "fit" && (
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Orientation</p>
                  <Seg value={orient} set={setOrient} opts={[["auto", "Auto"], ["portrait", "Portrait"], ["landscape", "Landscape"]]} />
                </div>
              )}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Margin</p>
                <Seg value={String(margin)} set={(v) => setMargin(Number(v))} opts={[["0", "None"], ["10", "Small"], ["20", "Big"]]} />
              </div>
              <div>
                <label htmlFor="pdf-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">File name</label>
                <input id="pdf-name" className={seoField} value={name} onChange={(e) => setName(e.target.value)} placeholder="images" />
              </div>
            </div>
          </div>

          {/* action */}
          <div className={`${seoCard} zseo-rise p-4 sm:p-5`} style={{ ["--i" as any]: 2 }}>
            {busy && (
              <div className="mb-4">
                <div className="h-2 overflow-hidden rounded-full bg-indigo-100 dark:bg-white/10"><div className="zseo-fill h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${progress}%` }} /></div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Building page {Math.max(1, Math.ceil((progress / 100) * items.length))} of {items.length}…</p>
              </div>
            )}
            {result ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"><Check className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">{fileName}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{result.pages} page{result.pages > 1 ? "s" : ""} · {fmtSize(result.bytes.length)}</p>
                </div>
                <button type="button" onClick={() => downloadBytes(fileName, result.bytes, "application/pdf")} className="zseo-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"><Download className="h-4 w-4" />Download PDF</button>
                <button type="button" onClick={clear} className={seoBtn}><FilePlus2 className="h-4 w-4" />New PDF</button>
              </div>
            ) : (
              <button type="button" onClick={create} disabled={busy} className="zseo-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:opacity-60">
                {busy ? <><Loader2 className="h-5 w-5 animate-spin" />Creating your PDF…</> : <><FileText className="h-5 w-5" />Create PDF ({items.length} page{items.length > 1 ? "s" : ""})</>}
              </button>
            )}
          </div>
        </>
      )}
      {items.length === 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
          {FEATURES.map(([Icon, t, d], i) => (
            <div key={t} style={{ ["--i" as any]: i }} className={`${seoCard} zseo-rise p-4 transition hover:-translate-y-1`}>
              <span className="zseo-float grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30" style={{ ["--i" as any]: i }}><Icon className="h-4 w-4" /></span>
              <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{t}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{d}</p>
            </div>
          ))}
        </div>
      )}
    </SeoToolShell>
  );
}
