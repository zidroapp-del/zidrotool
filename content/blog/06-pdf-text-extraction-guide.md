---
title: "PDF Text Extraction: A Practical Guide"
summary: "How to extract selectable text from PDFs using pdf.js and fallback strategies for scanned pages."
---

## PDF Text Extraction: A Practical Guide

Extracting text from PDFs in the browser is common for search, accessibility, or content repurposing. This guide focuses on `pdf.js` for client-side extraction and outlines OCR fallback strategies for scanned pages.

### Workflow

1. Load file into memory as ArrayBuffer.
2. Initialize `pdfjsLib.getDocument({ data })` with a worker loaded from a stable CDN.
3. Iterate pages and call `page.getTextContent()`.
4. If `getTextContent()` returns empty content, fall back to OCR (Tesseract).

### Tips for production

- Set a matching `pdf.worker` for the installed `pdfjs-dist` to avoid fake-worker errors.
- Log page-level extraction results and provide user-friendly messages when pages are scanned images.
- Provide a progress bar so users can anticipate long documents.

### OCR fallback

Integrate `tesseract.js` for pages where `getTextContent()` yields no selectable text. Be mindful of CPU and large file sizes — prefer sending a single page image to OCR asynchronously.

### Example: page loop

```ts
for (let i=1;i<=pdf.numPages;i++){
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  const text = content.items.map(i=>i.str||'').join(' ');
}
```

### UX and SEO

Expose extracted text as downloadable `.txt` with UTF-8 BOM for RTL languages, and index extracted content for on-site search to improve discovery.
