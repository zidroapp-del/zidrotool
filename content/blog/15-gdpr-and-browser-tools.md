---
title: "GDPR Considerations for Browser-Based Tools"
summary: "How to design browser utilities that comply with GDPR and other privacy regulations."
---

## GDPR Considerations for Browser-Based Tools

Even client-side tools can be subject to privacy laws when they upload or log user data. Consider GDPR during product design.

### Principles to follow

- Data minimization: collect only what's necessary.
- Explicit consent: prompt users before processing or uploading personal data.
- Right to erase: provide a straightforward way to delete stored data.

### When server-side processing matters

- If a feature requires server-side processing, implement lawful bases (consent or legitimate interest) and document retention policies.

### Documentation and transparency

- Provide clear privacy notices and links to data policies in-app.
- Offer export and removal tools for any user data stored on servers.

### Technical safeguards

- Use client-side encryption for sensitive uploads and only store encrypted blobs.
- Avoid persistent identifiers tied to PII.

---

Design with privacy by default and document choices to simplify regulatory compliance.
