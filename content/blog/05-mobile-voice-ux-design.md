---
title: "Designing Great Mobile Voice Experiences"
summary: "UX patterns and constraints for voice on mobile browsers — permission flows, gestures, and reliability." 
---

## Designing Great Mobile Voice Experiences

Mobile browsers introduce constraints that affect voice UIs: permission dialogs, battery limits, and stricter autoplay/policy restrictions. Designing with these constraints improves user trust and retention.

### Key design rules

- Require explicit user gestures before starting audio capture or playback.
- Provide short onboarding that explains microphone permissions and why audio is needed.
- Avoid auto-restarts; instead, show retry CTA if recognition ends unexpectedly.

### Permission UX

- Pre-flight prompts: show a modal explaining the action before calling `getUserMedia`.
- If permission is denied, provide clear steps to enable microphone access in browser settings.

### Reliability

- Implement short retry/backoff with a visible retry button after repeated failures.
- Show clear error messages for `no-speech`, `network`, or `not-allowed` errors.

### Performance & battery

- Batch processing: avoid long continuous recording on mobile — send short chunks or transcribe locally and sync.
- Respect background behavior: many mobile browsers pause or throttle timers while backgrounded.

### Accessibility

- Include captions and visible transcripts.
- Support graceful degradation for users who prefer keyboard or typed input.

---

Mobile voice UX is as much design as engineering; prioritize trust, clarity, and graceful recovery.
