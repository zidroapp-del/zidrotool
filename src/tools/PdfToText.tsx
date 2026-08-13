import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { AdSlot } from "@/components/AdSlot";

// Use a known CDN worker for pdfjs to ensure worker loads correctly
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

export default function PdfToText({ slug }: { slug?: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setText("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let out = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const items = Array.isArray(content?.items) ? content.items : [];
          const pageText = items.map((it: any) => it?.str || "").join(" ");
          out += `\n\n--- Page ${i} ---\n` + pageText;
        } catch (pageErr) {
          console.error(`Error extracting page ${i}:`, pageErr);
          out += `\n\n--- Page ${i} ---\n[Error extracting this page]\n`;
        }
      }
      setText(out || "(no text found)");
    } catch (e) {
      console.error('PdfToText extraction error:', e);
      setText("Failed to extract text from PDF. See console for details.");
    }
    setBusy(false);
  };

  return (
    <div className="min-h-[60vh] flex items-start lg:items-center">
      <div className="mx-auto w-full max-w-3xl py-8">
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-3">PDF to Text</h2>

          <div className="mb-3 inline-flex items-center gap-2 text-sm text-green-700">
            <span className="text-base">🔒</span>
            <span>100% Client-Side Privacy: Your files and audio never leave your device.</span>
          </div>

          <div className="mb-4 flex items-center justify-center rounded border-dashed border-ink-200 py-8">
            <div className="text-center text-sm text-ink-600">
              <p>Select a PDF to extract text from</p>
              <label className="mt-2 inline-block cursor-pointer text-brand-600">choose a file
                <input className="hidden" type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            </div>
          </div>

          {busy && <p className="text-sm text-ink-500">Extracting...</p>}
          <textarea rows={12} className="w-full textarea mt-3" value={text} onChange={(e) => setText(e.target.value)} />

          <div className="my-6 p-4 border border-dashed rounded text-center text-xs text-muted-foreground">Ad Space</div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <h3 className="font-semibold">How it works</h3>
              <ol className="mt-2 list-decimal list-inside text-sm text-ink-600">
                <li>Upload a PDF file from your computer.</li>
                <li>We extract text client-side using pdf.js.</li>
                <li>Edit, copy, or download the extracted text.</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold">Key features</h3>
              <ul className="mt-2 text-sm text-ink-600">
                <li>Client-side extraction with pdf.js</li>
                <li>Page-separated output</li>
                <li>Editable result</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">FAQ</h3>
              <div className="mt-2 text-sm text-ink-600">
                <p><strong>Q:</strong> Is my PDF uploaded?<br/><strong>A:</strong> No — extraction happens locally in your browser.</p>
              </div>
            </div>
          </div>

          <div className="mt-6"><AdSlot variant="inline" /></div>
        </div>
      </div>
    </div>
  );
}
