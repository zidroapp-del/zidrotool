import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export default function QrCodeScanner({ slug }: { slug?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
      requestAnimationFrame(tick);
    } catch (e) {
      setStreaming(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      s.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height);
    if (code) {
      setResult(code.data);
    } else {
      if (streaming) requestAnimationFrame(tick);
    }
  };

  const handleFile = (file?: File) => {
    if (!file || !canvasRef.current) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = canvasRef.current!;
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code) setResult(code.data);
        else setResult("No QR code found");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">QR Code Scanner</h2>
      <div className="flex gap-2 mb-3">
        {!streaming ? (
          <button onClick={startCamera} className="btn-primary">Start Camera</button>
        ) : (
          <button onClick={stopCamera} className="btn-ghost">Stop Camera</button>
        )}
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <video ref={videoRef} className="w-full rounded border" style={{ maxHeight: 320 }} />
        <canvas ref={canvasRef} className="w-full rounded border" style={{ maxHeight: 320 }} />
      </div>
      {result && <div className="mt-3 rounded p-2 border">Result: <strong>{result}</strong></div>}
    </div>
  );
}
