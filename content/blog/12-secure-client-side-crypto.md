---
title: "Secure Client-Side Cryptography for Web Apps"
summary: "How to perform safe cryptographic operations in the browser using the Web Crypto API and best practices for key management."
---

## Secure Client-Side Cryptography for Web Apps

The Web Crypto API provides strong primitives for encryption, hashing, and key derivation in the browser. Use it carefully and avoid common mistakes.

### Core recommendations

- Prefer `SubtleCrypto` for production cryptography — it uses platform implementations and is faster and more secure than JS libs.
- Never store raw private keys in localStorage; use IndexedDB with careful access controls.
- For shared secrets, implement proper key exchange flows on the server.

### Use cases

- Encrypt files before upload to ensure end-to-end privacy.
- Derive encryption keys from passphrases using `PBKDF2` or `HKDF`.
- Sign data for integrity before sending to a server.

### UX trade-offs

- Offer clear warnings if keys are lost: client-side encryption without key recovery means irreversible data loss.
- Provide optional cloud key backup behind user consent.

### Example: encrypting a blob

```js
const key = await crypto.subtle.generateKey({name: 'AES-GCM', length: 256}, true, ['encrypt','decrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data);
```

### Final note

Client-side crypto empowers strong privacy-preserving features, but the UX and key-management trade-offs must be carefully designed.
