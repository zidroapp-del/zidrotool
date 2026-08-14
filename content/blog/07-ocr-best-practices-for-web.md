---
title: "OCR Best Practices for Web Apps"
summary: "Deliver accurate OCR on the client-side with Tesseract.js and UX guidance for scanned documents."
---

## OCR Best Practices for Web Apps

Client-side OCR enables extracting text from scanned PDFs and images without sending sensitive files to servers. `tesseract.js` is the most popular pure-JS solution.

### Preprocessing images

- Resize large images to a reasonable max width (e.g., 1600px) to balance accuracy and speed.
- Convert to grayscale and increase contrast for better OCR results.
- Deskew rotated images when possible.

### Language packs

- Load only needed language data to keep download sizes small.
- Provide an option to select the language of the document for higher accuracy.

### UX considerations

- Show progress and stage messages (loading language, recognizing, finalizing).
- Let users correct OCR results — allow inline edits before saving.

### Performance

- Use web workers to keep the UI responsive while computing OCR.
- Consider server-side OCR for very large batches or higher accuracy models.

### Example integration

```js
Tesseract.recognize(img, 'eng', { logger: m => console.log(m) })
  .then(({ data: { text } }) => { /* use text */ });
```

### Privacy & SEO

Client-side OCR preserves privacy. For SEO, extracted text can be added as searchable content on the site or as alt text for images.
