import { useState, useRef, useCallback } from "react";
import { Upload, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS: { label: string; value: string; fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }[] = [
  { label: "Grayscale", value: "grayscale", fn: (ctx, w, h) => {
    const data = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < data.data.length; i += 4) {
      const avg = data.data[i] * 0.3 + data.data[i + 1] * 0.59 + data.data[i + 2] * 0.11;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = avg;
    }
    ctx.putImageData(data, 0, 0);
  }},
  { label: "Invert", value: "invert", fn: (ctx, w, h) => {
    const data = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = 255 - data.data[i];
      data.data[i + 1] = 255 - data.data[i + 1];
      data.data[i + 2] = 255 - data.data[i + 2];
    }
    ctx.putImageData(data, 0, 0);
  }},
  { label: "Sepia", value: "sepia", fn: (ctx, w, h) => {
    const data = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
      data.data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data.data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data.data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
    ctx.putImageData(data, 0, 0);
  }},
  { label: "Brightness", value: "brightness", fn: (ctx, w, h) => {
    const data = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = Math.min(255, data.data[i] + 40);
      data.data[i + 1] = Math.min(255, data.data[i + 1] + 40);
      data.data[i + 2] = Math.min(255, data.data[i + 2] + 40);
    }
    ctx.putImageData(data, 0, 0);
  }},
  { label: "Contrast", value: "contrast", fn: (ctx, w, h) => {
    const data = ctx.getImageData(0, 0, w, h);
    const factor = 1.3;
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = Math.min(255, Math.max(0, (data.data[i] - 128) * factor + 128));
      data.data[i + 1] = Math.min(255, Math.max(0, (data.data[i + 1] - 128) * factor + 128));
      data.data[i + 2] = Math.min(255, Math.max(0, (data.data[i + 2] - 128) * factor + 128));
    }
    ctx.putImageData(data, 0, 0);
  }},
];

export default function ImageFilter() {
  const [src, setSrc] = useState<string | null>(null);
  const [filter, setFilter] = useState("grayscale");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => { setSrc(reader.result as string); setResultUrl(null); };
    reader.readAsDataURL(file);
  }, []);

  const handleApply = () => {
    if (!src) return;
    const selected = FILTERS.find((f) => f.value === filter);
    if (!selected) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      selected.fn(ctx, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        setResultUrl(URL.createObjectURL(blob));
      }, "image/png");
    };
    img.src = src;
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !src && fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 py-12 transition-colors hover:border-brand-400 dark:border-ink-700"
      >
        {src ? <img src={src} alt="Preview" className="max-h-48 rounded-lg object-contain" /> : (
          <>
            <Upload className="h-10 w-10 text-ink-300 dark:text-ink-700" />
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">Drop an image or click to upload</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {error && <p className="mt-2 flex items-center gap-1.5 text-xs text-danger"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}

      {src && (
        <div className="mt-6">
          <label className="label mb-2 block">Filter</label>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button key={f.value} onClick={() => setFilter(f.value)} className={cn("btn btn-sm", filter === f.value ? "btn-primary" : "btn-secondary")}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={handleApply} className="btn-primary w-full">Apply Filter</button>
        </div>
      )}

      {resultUrl && (
        <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
          <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">{FILTERS.find((f) => f.value === filter)?.label} applied</p>
          <img src={resultUrl} alt="Filtered" className="max-h-48 rounded-lg" />
          <a href={resultUrl} download="filtered.png" className="btn-primary mt-3 inline-flex">
            <Download className="h-4 w-4" /> Download
          </a>
        </div>
      )}
    </div>
  );
}
