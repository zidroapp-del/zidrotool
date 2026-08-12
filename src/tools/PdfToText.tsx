import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Use CDN worker for pdfjs
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

export default function PdfToText({ slug }: { slug?: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setText("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let out = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((it: any) => it.str).join(" ");
        out += `\n\n--- Page ${i} ---\n` + pageText;
      }
      setText(out);
    } catch (e) {
      setText("Failed to extract text from PDF.");
    }
    setBusy(false);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">PDF to Text</h2>
      <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {busy && <p className="text-sm text-ink-500">Extracting...</p>}
      <textarea rows={12} className="w-full textarea mt-3" value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}
