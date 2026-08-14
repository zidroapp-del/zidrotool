---
title: "Browser Audio APIs Explained: MediaDevices, WebAudio, MediaRecorder"
summary: "An approachable explanation of browser audio APIs and how to use them for recording, processing, and playback."
---

## Browser Audio APIs Explained: MediaDevices, WebAudio, MediaRecorder

Modern browsers include multiple audio-focused APIs. Understanding trade-offs helps you pick the right tool for recording, real-time analysis, or synthesizing audio.

### Core APIs

- `navigator.mediaDevices.getUserMedia` — capture microphone streams.
- `AudioContext` (Web Audio) — analyze and transform audio in real time.
- `MediaRecorder` — record a `MediaStream` to blobs for download or upload.
- `getDisplayMedia` — capture tab or screen audio (requires user to choose "Share tab" for tab audio).

### Typical patterns

- For STT: capture microphone via `getUserMedia` and feed to recognition features; Web Speech handles capture internally in many browsers.
- For recording playback (TTS capture): some apps use `getDisplayMedia` to record tab audio; warn users and show instructions to choose "Share tab audio".
- For audio effects: use `AudioContext.createMediaStreamSource()` and connect processing nodes.

### Security and permissions

- Browsers require user gestures to grant media permissions.
- Desktop and mobile behaviors differ: mobile Safari often restricts background audio and automated restarts.

### Example: simple recorder

```js
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream);
recorder.ondataavailable = e => chunks.push(e.data);
recorder.start();
```

### UX guidelines

- Always expose clear permission prompts and explain why audio is needed.
- Provide fallback messaging and offline error handling.

### SEO hook

Deliver practical code snippets and visual debugging tools to help developers ship audio features confidently.
