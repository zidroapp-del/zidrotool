import { useState, useRef, useCallback } from "react";
import { Upload, Download, RotateCw, FlipHorizontal, FlipVertical, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImageRotator() {
  const [src, setSrc] = useState<string | null>(null);
  const [angle, setAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
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
    const img = new Image();
    img.onload = () => {
      const rad = (angle * Math.PI) / 180;
      const canvas = document.createElement("canvas");
      if (angle === 90 || angle === 270) {
        canvas.width = img.naturalHeight;
        canvas.height = img.naturalWidth;
      } else {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
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
          <div className="mb-4">
            <label className="label mb-2 block">Rotation</label>
            <div className="flex gap-1.5">
              {[0, 90, 180, 270].map((a) => (
                <button key={a} onClick={() => setAngle(a)} className={cn("btn btn-sm", angle === a ? "btn-primary" : "btn-secondary")}>
                  {a}°
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 flex gap-2">
            <button onClick={() => setFlipH(!flipH)} className={cn("btn btn-sm flex-1", flipH ? "btn-primary" : "btn-secondary")}>
              <FlipHorizontal className="h-4 w-4" /> Flip H
            </button>
            <button onClick={() => setFlipV(!flipV)} className={cn("btn btn-sm flex-1", flipV ? "btn-primary" : "btn-secondary")}>
              <FlipVertical className="h-4 w-4" /> Flip V
            </button>
          </div>
          <button onClick={handleApply} className="btn-primary w-full">
            <RotateCw className="h-4 w-4" /> Apply Transform
          </button>
        </div>
      )}

      {resultUrl && (
        <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
          <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">Result</p>
          <img src={resultUrl} alt="Result" className="max-h-48 rounded-lg" />
          <a href={resultUrl} download="rotated.png" className="btn-primary mt-3 inline-flex">
            <Download className="h-4 w-4" /> Download
          </a>
        </div>
      )}
    </div>
  );
}
