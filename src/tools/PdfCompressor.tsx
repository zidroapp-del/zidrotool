import { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { PDFDocument } from "pdf-lib";
import { Download, Loader2, Upload } from "lucide-react";
import { bytesToBlob } from "@/lib/utils";

if (typeof window !== "undefined") pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type Level = "balanced" | "strong";
const fmt = (n: number) => n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(2)} MB`;

export default function PdfCompressor() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<Level>("balanced");
  const [quality, setQuality] = useState<"standard" | "smaller">("standard");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [message, setMessage] = useState("");

  const choose = (f?: File) => { if (!f) return; if (f.type !== "application/pdf" && !f.name.endsWith(".pdf")) { setMessage("Please select a valid PDF file."); return; } setFile(f); setResult(null); setMessage(""); };

  const compress = async () => {
    if (!file) return; setBusy(true); setMessage("");
    try {
      const original = await file.arrayBuffer();
      let output: Uint8Array;
      if (level === "balanced") {
        const doc = await PDFDocument.load(original);
        output = await doc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
      } else {
        // Strong mode rasterizes pages to JPEG. It produces a genuinely smaller PDF for image-heavy documents.
        const pdf = await pdfjsLib.getDocument({ data: original }).promise;
        const out = await PDFDocument.create();
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 1.25 });
          const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable");
          await page.render({ canvasContext: ctx, viewport }).promise;
          const jpegQuality = quality === "smaller" ? 0.48 : 0.68;
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", jpegQuality));
          if (!blob) throw new Error("Could not encode page");
          const jpg = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
          const outPage = out.addPage([jpg.width, jpg.height]); outPage.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height });
        }
        output = await out.save({ useObjectStreams: true });
      }
      const blob = bytesToBlob(output, "application/pdf");
      const url = URL.createObjectURL(blob); setResult({ url, size: blob.size });
      const saved = Math.max(0, ((file.size - blob.size) / file.size) * 100);
      setMessage(saved > 0 ? `Done. Reduced by ${saved.toFixed(1)}%.` : "The generated PDF is not smaller than the original. Try Strong compression for image-heavy PDFs.");
    } catch (e) { console.error(e); setMessage("Could not compress this PDF. Password-protected or damaged PDFs may not be supported."); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto w-full max-w-3xl space-y-5">
    {!file && <button type="button" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choose(e.dataTransfer.files?.[0]); }} onClick={() => input.current?.click()} className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-300 bg-white px-5 py-12 text-center hover:border-brand-400 dark:border-ink-700 dark:bg-ink-950"><input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => choose(e.target.files?.[0])}/><Upload className="mb-3 h-8 w-8 text-brand-600"/><strong>Drop your PDF here</strong><span className="mt-1 text-sm text-ink-500">or click to choose a PDF</span></button>}
    {file && <div className="space-y-5 rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-950"><div className="flex items-center justify-between"><div><strong>{file.name}</strong><p className="text-xs text-ink-500">Original: {fmt(file.size)}</p></div><button type="button" onClick={() => { setFile(null); setResult(null); setMessage(""); }} className="text-sm text-ink-500">Change</button></div>
      <div className="grid gap-3 sm:grid-cols-2">{(["balanced", "strong"] as Level[]).map(v => <button type="button" key={v} onClick={() => setLevel(v)} className={`rounded-xl border p-4 text-left ${level === v ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-ink-200 dark:border-ink-800"}`}><strong>{v === "balanced" ? "Balanced" : "Strong compression"}</strong><p className="mt-1 text-xs text-ink-500">{v === "balanced" ? "Optimizes the PDF structure without rasterizing pages." : "Rebuilds pages as compressed JPEG images. Best for scans and image-heavy PDFs."}</p></button>)}</div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setQuality("standard")} className={`rounded-xl border p-3 text-left ${quality === "standard" ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-ink-200 dark:border-ink-800"}`}><strong>Standard quality</strong><p className="mt-1 text-xs text-ink-500">Better readability for scans and documents.</p></button><button type="button" onClick={() => setQuality("smaller")} className={`rounded-xl border p-3 text-left ${quality === "smaller" ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-ink-200 dark:border-ink-800"}`}><strong>Smaller file</strong><p className="mt-1 text-xs text-ink-500">More aggressive JPEG compression.</p></button></div><button type="button" className="btn-primary w-full" disabled={busy} onClick={compress}>{busy ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Compressing…</> : <><Download className="mr-2 inline h-4 w-4"/>Compress PDF</>}</button>
      {result && <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30"><p className="font-medium">Compressed file: {fmt(result.size)}</p><a className="btn-primary mt-3 inline-flex" href={result.url} download={`compressed-${file.name}`}><Download className="mr-2 h-4 w-4"/>Download PDF</a></div>}
    </div>}
    {message && <p className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm dark:border-ink-800 dark:bg-ink-900">{message}</p>}
  </div>;
}
