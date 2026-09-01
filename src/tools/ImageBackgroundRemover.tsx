import { useRef, useState } from "react";

export default function ImageBackgroundRemover({ slug }: { slug?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState(30);

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setTimeout(() => processImage(reader.result as string), 50);
    };
    reader.readAsDataURL(file);
  };

  const processImage = (dataUrl: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = canvasRef.current!;
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const data = imageData.data;
      // sample top-left pixel as background
      const bgR = data[0], bgG = data[1], bgB = data[2];
      for (let i = 0; i < data.length; i += 4) {
        const dr = Math.abs(data[i] - bgR);
        const dg = Math.abs(data[i + 1] - bgG);
        const db = Math.abs(data[i + 2] - bgB);
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < tolerance) data[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
    };
    img.src = dataUrl;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Image Background Remover</h2>
      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <div className="mt-3">
        <label className="text-sm">Tolerance: {tolerance}</label>
        <input type="range" min={0} max={200} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} />
      </div>
      <div className="mt-3">
        <canvas ref={canvasRef} className="w-full rounded border" />
      </div>
      {src && <a href={canvasRef.current?.toDataURL() || src} download="bg-removed.png" className="btn-primary mt-3 inline-block">Download</a>}
    </div>
  );
}
