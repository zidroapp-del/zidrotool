import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Download, Crop, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImageCropper() {
  const [src, setSrc] = useState<string | null>(null);
  const [imgDim, setImgDim] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [drag, setDrag] = useState<{ sx: number; sy: number } | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
        setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
        setSrc(reader.result as string);
        setResultUrl(null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCrop = () => {
    if (!src || !crop.w || !crop.h) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(crop.w);
      canvas.height = Math.round(crop.h);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
      canvas.toBlob((blob) => {
        if (!blob) return;
        setResultUrl(URL.createObjectURL(blob));
      }, "image/png");
    };
    img.src = src;
  };

  useEffect(() => {
    if (!src || !imgDim || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const displayW = Math.min(600, imgDim.w);
    const scale = displayW / imgDim.w;
    canvas.width = displayW;
    canvas.height = imgDim.h * scale;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (crop.w && crop.h) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.strokeRect(crop.x * scale, crop.y * scale, crop.w * scale, crop.h * scale);
        ctx.fillStyle = "rgba(239,68,68,0.1)";
        ctx.fillRect(crop.x * scale, crop.y * scale, crop.w * scale, crop.h * scale);
      }
    };
    img.src = src;
  }, [src, imgDim, crop]);

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current || !imgDim) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = imgDim.w / canvasRef.current.width;
    setDrag({ sx: (e.clientX - rect.left) * scale, sy: (e.clientY - rect.top) * scale });
    setCrop({ x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale, w: 0, h: 0 });
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (!drag || !canvasRef.current || !imgDim) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = imgDim.w / canvasRef.current.width;
    const cx = (e.clientX - rect.left) * scale;
    const cy = (e.clientY - rect.top) * scale;
    setCrop({ x: Math.min(drag.sx, cx), y: Math.min(drag.sy, cy), w: Math.abs(cx - drag.sx), h: Math.abs(cy - drag.sy) });
  };

  const onCanvasMouseUp = () => setDrag(null);

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !src && fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 py-12 transition-colors hover:border-brand-400 dark:border-ink-700"
      >
        {!src && (
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
          <p className="mb-2 text-xs text-ink-400">Drag on the image to select crop area</p>
          <canvas
            ref={canvasRef}
            onMouseDown={onCanvasMouseDown}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onMouseLeave={onCanvasMouseUp}
            className="max-w-full rounded-lg border border-ink-200 dark:border-ink-700"
            style={{ cursor: "crosshair" }}
          />
          {crop.w > 0 && crop.h > 0 && (
            <p className="mt-2 text-xs text-ink-400">Selection: {Math.round(crop.w)} × {Math.round(crop.h)} px</p>
          )}
          <button onClick={handleCrop} disabled={crop.w < 1 || crop.h < 1} className="btn-primary mt-3 w-full">
            <Crop className="h-4 w-4" /> Crop Image
          </button>
        </div>
      )}

      {resultUrl && (
        <div className="mt-6 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
          <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-100">Cropped result</p>
          <img src={resultUrl} alt="Cropped" className="max-h-48 rounded-lg" />
          <a href={resultUrl} download="cropped.png" className="btn-primary mt-3 inline-flex">
            <Download className="h-4 w-4" /> Download
          </a>
        </div>
      )}
    </div>
  );
}
