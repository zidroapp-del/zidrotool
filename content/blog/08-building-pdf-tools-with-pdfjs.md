---
title: "Building PDF Tools with pdf.js"
summary: "Architect common PDF utilities in the browser: extract, annotate, and render using pdf.js."
---

## Building PDF Tools with pdf.js

`pdf.js` is the go-to library for rendering and extracting text in the browser. When building tools, follow best practices for worker setup, incremental rendering, and memory management.

### Set worker path

Always set `pdfjsLib.GlobalWorkerOptions.workerSrc` to a CDN path that matches `pdfjs-dist` version to avoid warnings and ensure worker availability.

### Rendering pages

- Render only visible pages in the viewport (virtualization) to keep memory low.
- Use a canvas-backed renderer for performance and a text layer if you need selectable text.

### Editing and annotations

- For annotations, keep a separate JSON overlay rather than modifying the binary PDF in memory.
- Export annotations in standard formats (XFDF) or flattened into a new PDF server-side.

### Example: render and extract

```ts
const pdf = await pdfjsLib.getDocument({data}).promise;
const page = await pdf.getPage(1);
await page.render({canvasContext, viewport}).promise;
const content = await page.getTextContent();
```

### Accessibility

- Provide extracted text and ARIA labels for rendered pages.
- Export transcripts alongside PDFs to improve discoverability and accessibility.

### Final notes

pdf.js can power a wide variety of client-side PDF utilities. Design with progressive enhancement: if a browser cannot handle a heavy operation, fall back to server-side processing gracefully.
