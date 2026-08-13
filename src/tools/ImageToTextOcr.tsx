import { useState, useCallback } from "react";
import Tesseract from "tesseract.js";
import { AdSlot } from "@/components/AdSlot";

export default function ImageToTextOcr({ slug }: { slug?: string }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setText("");
    try {
      const res = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) setProgress(Math.round(m.progress * 100));
        }
      });
      setText(res.data.text || "");
    } catch (e) {
      setText("Error during OCR");
    }
    setBusy(false);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-3">Image to Text (OCR)</h2>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mb-4 flex items-center justify-center rounded border-2 ${dragOver ? 'border-brand-600 bg-brand-50' : 'border-dashed border-ink-200'} py-8`}
          >
            <div className="text-center text-sm text-ink-600">
              <p>Drag & drop an image here, or</p>
              <label className="mt-2 inline-block cursor-pointer text-brand-600">choose a file
                <input className="hidden" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            </div>
          </div>

          {busy && <p className="text-sm text-ink-500">Processing... {progress}%</p>}
          <textarea rows={10} className="w-full textarea mt-3" value={text} onChange={(e) => setText(e.target.value)} />

          <div className="my-6 p-4 border border-dashed rounded text-center text-xs text-muted-foreground">Ad Space</div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <h3 className="font-semibold">How it works</h3>
              <ol className="mt-2 list-decimal list-inside text-sm text-ink-600">
                <li>Upload or drop an image containing text.</li>
                <li>We run OCR locally in your browser using Tesseract.js.</li>
                <li>Copy or edit the extracted text and download as needed.</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold">Key features</h3>
              <ul className="mt-2 text-sm text-ink-600">
                <li>Offline client-side OCR</li>
                <li>Progress indicator</li>
                <li>Editable output</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">FAQ</h3>
              <div className="mt-2 text-sm text-ink-600">
                <p><strong>Q:</strong> Does my image leave the browser?<br/><strong>A:</strong> No — OCR runs locally in your browser.</p>
              </div>
            </div>
          </div>

          <div className="mt-6"><AdSlot variant="inline" /></div>
        </div>
      </div>
    </div>
  );
}
