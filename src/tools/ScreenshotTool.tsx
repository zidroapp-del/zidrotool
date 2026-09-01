import { useState } from "react";
import { Download, MonitorDown } from "lucide-react";

export default function ScreenshotTool() {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  async function capture() {
    setError("");
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("Screen capture is not supported by this browser. Use a recent Chrome, Edge, or Firefox browser over HTTPS or localhost.");
      return;
    }

    let stream: MediaStream | null = null;
    try {
      setBusy(true);
      // Explicitly request video only. This tool never requests camera or microphone access.
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 5, max: 15 } },
        audio: false,
      });

      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => resolve();
        const onError = () => reject(new Error("Could not read the selected screen."));
        video.addEventListener("loadedmetadata", onLoaded, { once: true });
        video.addEventListener("error", onError, { once: true });
      });

      await video.play();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      if (!video.videoWidth || !video.videoHeight) {
        throw new Error("The selected screen did not provide a usable image.");
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create the screenshot canvas.");

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPreview(canvas.toDataURL("image/png"));
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Screen sharing was cancelled. Choose a screen, window, or browser tab and allow screen sharing.");
      } else {
        setError(err instanceof Error ? err.message : "Could not capture the screen.");
      }
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setBusy(false);
    }
  }

  function save() {
    if (!preview) return;
    const anchor = document.createElement("a");
    anchor.href = preview;
    anchor.download = "zidrotool-screenshot.png";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5 dark:border-brand-900 dark:bg-brand-950/30">
        <div className="flex items-start gap-3">
          <MonitorDown className="mt-0.5 h-6 w-6 text-brand-600" />
          <div>
            <h2 className="font-semibold text-ink-900 dark:text-ink-100">Capture your screen</h2>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">Choose a window, browser tab, or entire screen. This tool requests screen sharing only — it does not request camera or microphone access.</p>
          </div>
        </div>
      </div>

      <button disabled={busy} onClick={capture} className="btn-primary w-full">
        {busy ? "Capturing…" : "Take screenshot"}
      </button>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      {preview && (
        <>
          <img src={preview} alt="Captured screenshot preview" className="max-h-[560px] w-full rounded-2xl border border-ink-200 object-contain dark:border-ink-800" />
          <button onClick={save} className="btn-secondary w-full"><Download className="h-4 w-4" />Download PNG</button>
        </>
      )}
    </div>
  );
}
