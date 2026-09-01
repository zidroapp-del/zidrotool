import { useEffect, useRef, useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { Download, FileImage, Loader2, RotateCw, Stamp, Trash2, Upload } from "lucide-react";
import { downloadBytes } from "@/lib/utils";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

type Props = { slug?: string };
type ImageResult = { page: number; url: string; filename: string };
type ImageFormat = "png" | "jpg";

const titles: Record<string, { title: string; description: string; action: string }> = {
  "pdf-to-image": { title: "PDF to Image", description: "Convert PDF pages to PNG or JPG images in your browser.", action: "Convert to Images" },
  "pdf-rotator": { title: "Rotate PDF", description: "Rotate all pages or selected pages by 90°, 180°, or 270° clockwise.", action: "Rotate PDF" },
  "pdf-page-remover": { title: "Remove PDF Pages", description: "Remove selected pages and download a new PDF without them.", action: "Remove Pages" },
  "pdf-watermark": { title: "Watermark PDF", description: "Add a text watermark to every page or selected pages.", action: "Add Watermark" },
};

function saveBytes(bytes: Uint8Array, filename: string) {
  downloadBytes(filename, bytes, "application/pdf");
}

function parsePages(value: string, max: number) {
  const result = new Set<number>();
  if (!value.trim()) return Array.from({ length: max }, (_, i) => i);
  for (const part of value.split(",")) {
    const p = part.trim();
    if (!p) continue;
    if (p.includes("-")) {
      const pieces = p.split("-").map(Number);
      if (pieces.length !== 2 || !pieces.every(Number.isInteger)) continue;
      const [a, b] = pieces;
      const start = Math.max(1, Math.min(a, b)); const end = Math.min(max, Math.max(a, b));
      for (let n = start; n <= end; n++) result.add(n - 1);
    } else {
      const n = Number(p); if (Number.isInteger(n) && n >= 1 && n <= max) result.add(n - 1);
    }
  }
  return [...result].sort((a, b) => a - b);
}

function hasInvalidPageToken(value: string, max: number) {
  if (!value.trim()) return false;
  return value.split(",").some(part => {
    const p = part.trim();
    if (!p) return false;
    if (/^\d+-\d+$/.test(p)) {
      const [a, b] = p.split("-").map(Number);
      return a < 1 || b < 1 || a > max || b > max;
    }
    const n = Number(p);
    return !Number.isInteger(n) || n < 1 || n > max;
  });
}

export default function PdfEditorTool({ slug = "pdf-rotator" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState("");
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [watermark, setWatermark] = useState("ZidroTool");
  const [format, setFormat] = useState<ImageFormat>("png");
  const [scale, setScale] = useState<1 | 1.5 | 2>(1.5);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [images, setImages] = useState<ImageResult[]>([]);
  const [dragging, setDragging] = useState(false);
  const meta = titles[slug] ?? titles["pdf-rotator"];

  useEffect(() => () => images.forEach(i => URL.revokeObjectURL(i.url)), [images]);

  const acceptFile = async (next: File | null) => {
    if (!next) return;
    if (next.type !== "application/pdf" && !next.name.toLowerCase().endsWith(".pdf")) {
      setStatus("Please choose a valid PDF file."); return;
    }
    setFile(next); setStatus(""); setImages([]); setPageCount(0); setRange("");
    try {
      const pdf = await PDFDocument.load(await next.arrayBuffer(), { ignoreEncryption: false });
      setPageCount(pdf.getPageCount());
      if (!pdf.getPageCount()) throw new Error("This PDF has no pages.");
    } catch {
      setPageCount(0); setStatus("This PDF could not be opened. It may be corrupted or password-protected.");
    }
  };

  const process = async () => {
    if (!file || !pageCount) return;
    setBusy(true); setStatus(""); setImages([]);
    try {
      if (hasInvalidPageToken(range, pageCount)) throw new Error(`Enter pages between 1 and ${pageCount}, for example 2,4-6.`);
      const bytes = await file.arrayBuffer();
      const selected = parsePages(range, pageCount);

      if (slug === "pdf-to-image") {
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        const wanted = range.trim() ? selected.map(i => i + 1) : Array.from({ length: pdf.numPages }, (_, i) => i + 1);
        const results: ImageResult[] = [];
        for (const pageNumber of wanted) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas is unavailable in this browser.");
          await page.render({ canvasContext: ctx, viewport }).promise;
          const mime = format === "jpg" ? "image/jpeg" : "image/png";
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, format === "jpg" ? 0.92 : undefined));
          if (!blob) throw new Error("Could not create the image.");
          const ext = format === "jpg" ? "jpg" : "png";
          results.push({ page: pageNumber, url: URL.createObjectURL(blob), filename: `${file.name.replace(/\.pdf$/i, "")}-page-${pageNumber}.${ext}` });
        }
        await pdf.destroy();
        setImages(results); setStatus(`${results.length} page(s) converted successfully.`); return;
      }

      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      const pages = doc.getPages();
      const indexes = range.trim() ? selected : pages.map((_, i) => i);

      if (slug === "pdf-page-remover") {
        if (!range.trim()) throw new Error("Enter the pages you want to remove, for example 2,4-6.");
        if (selected.length >= pages.length) throw new Error("You cannot remove every page from the PDF.");
        [...selected].sort((a, b) => b - a).forEach(i => doc.removePage(i));
      } else if (slug === "pdf-rotator") {
        indexes.forEach(i => {
          const page = pages[i]; if (!page) return;
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + rotation) % 360));
        });
      } else if (slug === "pdf-watermark") {
        const text = watermark.trim();
        if (!text) throw new Error("Enter watermark text before continuing.");
        const font = await doc.embedFont(StandardFonts.HelveticaBold);
        indexes.forEach(i => {
          const page = pages[i]; if (!page) return;
          const { width, height } = page.getSize();
          const size = Math.max(18, Math.min(42, width / 16));
          const textWidth = font.widthOfTextAtSize(text, size);
          page.drawText(text, {
            x: (width - textWidth) / 2, y: height / 2,
            size, font, color: rgb(0.35, 0.35, 0.35), opacity: 0.25, rotate: degrees(35),
          });
        });
      }

      saveBytes(await doc.save({ useObjectStreams: true }), `${file.name.replace(/\.pdf$/i, "")}-${slug}.pdf`);
      setStatus("Done. Your PDF was generated successfully in your browser.");
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : "Could not process this PDF.");
    } finally { setBusy(false); }
  };

  const reset = () => { setFile(null); setPageCount(0); setRange(""); setStatus(""); setImages([]); };

  return <div className="space-y-5">
    <div className="rounded-2xl border border-ink-200 bg-ink-50/70 p-6 dark:border-ink-800 dark:bg-ink-900/50">
      <div className="flex items-center gap-3"><FileImage className="h-6 w-6 text-brand-600"/><div><h2 className="font-semibold text-ink-900 dark:text-ink-100">{meta.title}</h2><p className="text-sm text-ink-500 dark:text-ink-400">{meta.description}</p></div></div>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => acceptFile(e.target.files?.[0] || null)} />
      <button type="button" onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0] || null); }} onClick={() => inputRef.current?.click()} className={`mt-5 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-5 py-10 text-sm font-medium transition ${dragging ? "border-brand-500 bg-brand-50" : "border-ink-300 bg-white hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900"}`}><Upload className="h-6 w-6"/><span>{file ? file.name : "Drop your PDF here or click to choose a file"}</span><span className="text-xs font-normal text-ink-500">PDF only • files are processed locally in your browser</span></button>
    </div>

    {file && pageCount > 0 && <div className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-950/40">
      <div className="mb-4 flex items-center justify-between"><div><p className="font-medium">{file.name}</p><p className="text-xs text-ink-500">{pageCount} page(s)</p></div><button type="button" onClick={reset} className="rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-ink-100">Change file</button></div>
      {slug !== "pdf-to-image" && <label className="mb-4 block text-sm"><span className="mb-1 block font-medium">Pages</span><input className="input w-full" value={range} onChange={e => setRange(e.target.value)} placeholder={slug === "pdf-page-remover" ? "Example: 2, 4-6" : "Leave empty to apply to all pages"}/><span className="mt-1 block text-xs text-ink-500">Use page numbers like 1,3,5-7.</span></label>}
      {slug === "pdf-to-image" && <div className="mb-4 grid gap-4 sm:grid-cols-2"><label className="text-sm"><span className="mb-1 block font-medium">Image format</span><select className="input w-full" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="png">PNG — lossless</option><option value="jpg">JPG — smaller files</option></select></label><label className="text-sm"><span className="mb-1 block font-medium">Quality / scale</span><select className="input w-full" value={scale} onChange={e => setScale(Number(e.target.value) as 1 | 1.5 | 2)}><option value={1}>1× — faster</option><option value={1.5}>1.5× — balanced</option><option value={2}>2× — high resolution</option></select></label></div>}
      {slug === "pdf-rotator" && <div className="mb-4"><span className="mb-2 block text-sm font-medium">Rotation</span><div className="grid grid-cols-3 gap-2">{([90, 180, 270] as const).map(v => <button type="button" key={v} onClick={() => setRotation(v)} className={`rounded-xl border px-3 py-2 text-sm ${rotation === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200"}`}><RotateCw className="mr-1 inline h-4 w-4"/>{v}°</button>)}</div></div>}
      {slug === "pdf-watermark" && <label className="mb-4 block text-sm"><span className="mb-1 block font-medium"><Stamp className="mr-1 inline h-4 w-4"/>Watermark text</span><input className="input w-full" value={watermark} onChange={e => setWatermark(e.target.value)} placeholder="ZidroTool"/></label>}
      <button type="button" className="btn-primary w-full" disabled={busy} onClick={process}>{busy ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Processing…</> : <><Download className="mr-2 inline h-4 w-4"/>{meta.action}</>}</button>
    </div>}

    {images.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{images.map(image => <div key={image.page} className="overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950"><img src={image.url} alt={`PDF page ${image.page}`} className="max-h-96 w-full object-contain"/><div className="flex items-center justify-between p-3"><span className="text-sm">Page {image.page}</span><a href={image.url} download={image.filename} className="btn-secondary"><Download className="mr-1 inline h-4 w-4"/>Download</a></div></div>)}</div>}
    {status && <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200">{status}</div>}
  </div>;
}
