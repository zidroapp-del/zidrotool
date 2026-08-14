---
title: "Text-to-Speech Best Practices for the Browser"
summary: "How to build accurate, accessible, and privacy-friendly TTS features using the Web Speech API."
---

## Text-to-Speech Best Practices for the Browser

The Web Speech Synthesis API (`speechSynthesis` and `SpeechSynthesisUtterance`) provides a simple way to generate audio from text using system voices. Here’s how to use it effectively.

### Priorities

- Accessibility: ensure controls are keyboard accessible and offer visual indicators when speech plays.
- Privacy: play audio locally and clearly disclose that nothing is uploaded if you don’t use server TTS.
- Internationalization: load `voices` dynamically and support language selection; apply `dir="rtl"` for Arabic.

### Known limitations

- Browsers don’t expose a direct PCM stream of `SpeechSynthesis`. If you need downloadable audio, either use a server TTS or instruct users to use `getDisplayMedia` to record tab audio (requires consenting to share tab audio).
- Voice availability varies across platforms.

### Snippet: speak text

```js
const ut = new SpeechSynthesisUtterance(text);
ut.rate = 1; ut.pitch = 1; ut.lang = 'en-US';
window.speechSynthesis.speak(ut);
```

### UX tips

- Provide voice and rate controls, and optionally a preview button.
- For downloads, prefer server-side generation or a clear flow that asks the user to share tab audio.

### SEO & content angle

Explain pragmatic trade-offs: most sites should prefer local playback for privacy and use server TTS only for downloadable assets when legally compliant.
