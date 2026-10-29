import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Sparkles } from "lucide-react";

/**
 * Decorative floating "tool windows" for the hero. They only illustrate what the tools do
 * (they are not working tools) and are hidden from screen readers.
 * The whole scene tilts toward the pointer for a 3D feel.
 */
export function HeroWindows() {
  const { t } = useTranslation();
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--ry", `${(nx * 16).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-ny * 12).toFixed(2)}deg`);
        el.style.setProperty("--tx", `${(nx * -14).toFixed(1)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="nv-stage-wrap" aria-hidden="true">
      <div className="nv-stage">
        <div ref={sceneRef} className="nv-scene">
          <div className="nv-ring nv-ring-a" />
          <div className="nv-ring nv-ring-b"><i /></div>
          <div className="nv-disc" />

          {/* Image compressor */}
          <div className="nv-win nv-win-1">
            <div className="nv-win-bar"><b /><b /><b /><span>{t("tool.image-compressor.name")}</span></div>
            <div className="nv-win-body">
              <div className="nv-photo"><i /></div>
              <div className="nv-meter"><span /></div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span>4.8 MB → 1.3 MB</span>
                <em className="not-italic text-emerald-300">−72%</em>
              </div>
            </div>
          </div>

          {/* JSON formatter */}
          <div className="nv-win nv-win-2">
            <div className="nv-win-bar"><b /><b /><b /><span>{t("tool.json-formatter.name")}</span></div>
            <div className="nv-win-body nv-code">
              <p style={{ "--w": "40%" } as CSSProperties}><s>{"{"}</s></p>
              <p style={{ "--w": "78%", animationDelay: ".3s" } as CSSProperties}>&nbsp;&nbsp;<u>"tool"</u>: <q>"zidrotool"</q>,</p>
              <p style={{ "--w": "66%", animationDelay: ".6s" } as CSSProperties}>&nbsp;&nbsp;<u>"free"</u>: <q className="nv-k">true</q>,</p>
              <p style={{ "--w": "84%", animationDelay: ".9s" } as CSSProperties}>&nbsp;&nbsp;<u>"private"</u>: <q className="nv-k">true</q></p>
              <p style={{ "--w": "20%", animationDelay: "1.2s" } as CSSProperties}><s>{"}"}</s></p>
            </div>
          </div>

          {/* Case converter */}
          <div className="nv-win nv-win-3">
            <div className="nv-win-bar"><b /><b /><b /><span>{t("tool.case-converter.name")}</span></div>
            <div className="nv-win-body nv-cycle">
              <span>hello zidrotool</span>
              <span>HELLO ZIDROTOOL</span>
              <span>Hello Zidrotool</span>
              <span>helloZidrotool</span>
            </div>
          </div>

          {/* Summarizer chip */}
          <div className="nv-chip nv-chip-1">
            <Sparkles className="h-4 w-4 text-violet-300" />
            <div className="nv-lines"><i /><i /><i /></div>
            <span>{t("tool.ai-text-summarizer.name")}</span>
          </div>

          {/* Private chip */}
          <div className="nv-chip nv-chip-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>{t("why.privacy.title")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
