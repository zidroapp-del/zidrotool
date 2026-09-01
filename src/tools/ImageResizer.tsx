import { useState, useRef, useCallback } from "react";
import { Upload, Download, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImageResizer() {
  const [src, setSrc] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState<{ w: number; h: number } | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [maintain, setMaintain] = useState(true);
  const [quality, setQuality] = useState(0.9);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setSrc(reader.result as string);
        setOrigSize({ w: img.naturalWidth, h: img.naturalHeight });
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setResultUrl(null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleResize = () => {
    if (!src || !origSize) return;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setResultSize(`${(blob.size / 1024).toFixed(1)} KB`);
      }, "image/png", quality);
    };
    img.src = src;
  };

  const onWidthChange = (w: number) => {
    setWidth(w);
    if (maintain && origSize) setHeight(Math.round(w * origSize.h / origSize.w));
  };
  const onHeightChange = (h: number) => {
    setHeight(h);
    if (maintain && origSize) setWidth(Math.round(h * origSize.w / origSize.h));
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 py-12 transition-colors hover:border-brand-400 dark:border-ink-700"
      >
        {src ? (
          <img src={src} alt="Preview" className="max-h-48 rounded-lg object-contain" />
        ) : (
          <>
            <Upload className="h-10 w-10 text-ink-300 dark:text-ink-700" />
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">Drop an image or click to upload</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {error && <p className="mt-2 flex items-center gap-1.5 text-xs text-danger"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}

      {src && origSize && (
        <div className="mt-6">
          <p className="mb-3 text-xs text-ink-400">Original: {origSize.w} × {origSize.h} px</p>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Width (px)</label>
              <input type="number" value={width} onChange={(e) => onWidthChange(parseInt(e.target.value) || 0)} className="input" />
            </div>
            <div>
              <label className="label mb-1.5 block">Height (px)</label>
              <input type="number" value={height} onChange={(e) => onHeightChange(parseInt(e.target.value) || 0)} className="input" />
            </div>
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
            <input type="checkbox" checked={maintain} onChange={(e) => setMaintain(e.target.checked)} className="rounded" />
            Maintain aspect ratio
          </label>
          <div className="mb-4">
            <label className="label mb-1.5 block">Quality: {Math.round(quality * 100)}%</label>
            <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full" />
          </div>
          <button onClick={handleResize} className="btn-primary w-full">
            <ImageIcon className="h-4 w-4" />
            Resize Image
          </button>
        </div>
      )}

      {resultUrl && (
        <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
          <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">Result: {width} × {height} px — {resultSize}</p>
          <img src={resultUrl} alt="Resized" className="max-h-48 rounded-lg" />
          <a href={resultUrl} download="resized-image.png" className="btn-primary mt-3 inline-flex">
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      )}
    </div>
  );
}
