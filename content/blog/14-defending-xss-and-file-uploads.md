---
title: "Defending File Uploads and Preventing XSS in Web Tools"
summary: "Security best practices for handling user-supplied files, including sanitization, validation, and safe rendering."
---

## Defending File Uploads and Preventing XSS in Web Tools

File uploads are powerful but dangerous. When you extract and render content (e.g., PDF text, HTML), sanitize all outputs and validate inputs.

### Core controls

- Validate file types by MIME and extension; check headers when possible.
- Limit file sizes and reject extremely large uploads client-side.
- Sanitize extracted HTML or text before injecting it into DOM — use libraries like DOMPurify.

### Rendering user text safely

- Escape or sanitize any user-provided string before setting `innerHTML`.
- When showing extracted text, prefer `<pre>` or text nodes instead of raw HTML.

### Server-side considerations

- If server processing is used, scan files for malware, enforce quotas, and isolate execution environments.
- Maintain strong access controls and audit logging.

### UX and developer ergonomics

- Provide clear error messages and fallback options (download file) if processing fails.
- Offer safe preview modes that do not fully render arbitrary HTML or scriptable content.

---

Security-first handling of files reduces the chances of disasters and improves user trust.
