import { useState } from "react";
import Tesseract from "tesseract.js";

export default function ImageToTextOcr({ slug }: { slug?: string }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");

  const handleFile = async (file?: File) => {
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
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Image to Text (OCR)</h2>
      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {busy && <p className="text-sm text-ink-500">Processing... {progress}%</p>}
      <textarea rows={10} className="w-full textarea mt-3" value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}
