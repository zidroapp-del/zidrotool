---
title: Speech-to-Text Privacy Guide: Keep Audio Local
date: 2026-08-14
---

# Speech-to-Text Privacy Guide: Keep Audio Local

Privacy is a top concern when converting spoken audio to text. This guide helps you choose client-side options and explains trade-offs when you must use cloud services.

## Client-side vs Cloud STT

- Client-side (browser/device) keeps raw audio local and minimizes third-party exposure.
- Cloud STT often provides higher accuracy and advanced models but requires sending audio over the network.

## When to Use Client-side STT

- Sensitive conversations and PII-heavy workflows.
- Apps that must comply with strict data residency policies.
- Lightweight transcription use-cases where near-real-time accuracy is acceptable.

## Cloud STT Considerations

- Confirm retention, access controls, and delete-after policies with your provider.
- Use TLS in transit and server-side encryption for stored audio.
- Anonymize or redact PII before sending to third parties when possible.

## Implementation Steps

1. Provide explicit consent modals for recording audio.
2. Use ephemeral keys and short-lived upload tokens if sending audio to servers.
3. Offer a client-side option in settings for privacy-conscious users.

## Actionable Takeaways

- Default to client-side STT where feasible and offer cloud as an opt-in.
- Make privacy settings discoverable and reversible.

---

*Author: Site Tools Team*