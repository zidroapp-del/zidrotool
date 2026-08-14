---
title: "Merging, Splitting and Compressing PDFs: Tools & Techniques"
summary: "Overview of client-side and server-side strategies for manipulating PDFs and best practices for user workflows."
---

## Merging, Splitting and Compressing PDFs: Tools & Techniques

Manipulating PDFs (merge, split, compress) can be accomplished both on the client and server. Choose the approach that balances privacy, performance, and UX.

### Client-side vs server-side

- Client-side (e.g., `pdf-lib`) keeps data local and privacy-friendly but may be limited on mobile due to memory.
- Server-side can handle heavy files and produce optimized PDFs, but requires secure uploads and legal safeguards.

### Typical workflows

- Merging: collect files, parse pages, and assemble using `pdf-lib` or `pdfjs` for rendering and re-encoding.
- Splitting: allow users to select page ranges; present a preview before export.
- Compressing: re-encode images with lower quality, remove unused objects, or downsample large images.

### UX patterns

- Provide progress bars and warnings for large files.
- Allow users to preview outputs before download.

### Tools and libraries

- `pdf-lib` — create and modify PDFs client-side.
- `pdf.js` — rendering and extraction.
- Server side: `ghostscript`, `qpdf`, or commercial APIs for heavy-duty compression.

### Security

- For server side: ensure secure uploads, scan for malicious content, and comply with data retention laws.

---

Offer both client and server options; educate users on trade-offs and surface recommended limits for smooth experiences.
