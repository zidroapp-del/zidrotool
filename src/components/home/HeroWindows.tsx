import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Braces, FileText, Image as ImageIcon, KeyRound, Palette, QrCode, ShieldCheck, Sparkles, Type } from "lucide-react";

/**
 * Big decorative motion scene for the hero: six floating "tool windows", icons orbiting on two rings
 * and a glowing core. It only illustrates what the tools do (it is not a working tool) and is hidden
 * from screen readers. The scene tilts toward the pointer and scales to the width of its column.
 */
const SCENE_W = 640;
const SCENE_H = 560;
const ORBIT_A = [ImageIcon, FileText, Braces, QrCode, Type, KeyRound];
const ORBIT_B = [Palette, Sparkles, ShieldCheck];
const QR = Array.from({ length: 49 }, (_, i) => ((i * 7 + (i % 5) * 3 + Math.floor(i / 7)) % 3 !== 0) || [0, 6, 42, 48, 8, 12, 36, 40].includes(i));
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";

function Scramble() {
  const [txt, setTxt] = useState("Zx9#kQ2!mP7$");
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gen = () => Array.from({ length: 12 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
    const run = () => {
      let n = 0;
      const s = window.setInterval(() => {
        setTxt(gen());
        if (++n > 9) window.clearInterval(s);
      }, 60);
      timers.current.push(s);
    };
    const id = window.setInterval(run, 3000);
    timers.current.push(id);
    return () => { timers.current.forEach((x) => window.clearInterval(x)); timers.current = []; };
  }, []);
  return <span>{txt}</span>;
}

export function HeroWindows() {
  const { t } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => setK(Math.max(0.5, Math.min(1.3, el.clientWidth / SCENE_W)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--ry", `${(nx * 18).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-ny * 13).toFixed(2)}deg`);
        el.style.setProperty("--tx", `${(nx * -16).toFixed(1)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, []);

  const orbit = (icons: typeof ORBIT_A, d: number, cls: string) => (
    <div className={`nv-orbit ${cls}`} style={{ "--d": `${d}px` } as CSSProperties}>
      {icons.map((Ic, i) => (
        <span key={i} className="nv-orb-slot" style={{ "--a": `${(360 / icons.length) * i}deg` } as CSSProperties}>
          <span className="nv-orb-icon"><Ic className="h-5 w-5" /></span>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={wrapRef} className="nv-stage-wrap" style={{ height: SCENE_H * k }} aria-hidden="true">
      <div className="nv-stage" style={{ transform: `scale(${k})` }}>
        <div ref={sceneRef} className="nv-scene">
          <div className="nv-disc" />
          <div className="nv-core"><span /><span /><span /></div>
          {orbit(ORBIT_A, 540, "nv-orbit-a")}
          {orbit(ORBIT_B, 360, "nv-orbit-b")}

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

          {/* QR code */}
          <div className="nv-win nv-win-qr">
            <div className="nv-win-bar"><b /><b /><b /></div>
            <div className="nv-win-body">
              <div className="nv-qr">
                {QR.map((on, i) => <i key={i} className={on ? "on" : ""} style={{ "--q": (i % 9) * 0.35 } as CSSProperties} />)}
                <u />
              </div>
            </div>
          </div>

          {/* JSON formatter */}
          <div className="nv-win nv-win-2">
            <div className="nv-win-bar"><b /><b /><b /><span>{t("tool.json-formatter.name")}</span></div>
            <div className="nv-win-body nv-code">
              <p><s>{"{"}</s></p>
              <p style={{ animationDelay: ".3s" }}>&nbsp;&nbsp;<u>"tool"</u>: <q>"zidrotool"</q>,</p>
              <p style={{ animationDelay: ".6s" }}>&nbsp;&nbsp;<u>"free"</u>: <q className="nv-k">true</q>,</p>
              <p style={{ animationDelay: ".9s" }}>&nbsp;&nbsp;<u>"private"</u>: <q className="nv-k">true</q></p>
              <p style={{ animationDelay: "1.2s" }}><s>{"}"}</s></p>
            </div>
          </div>

          {/* Password */}
          <div className="nv-win nv-win-4">
            <div className="nv-win-bar"><b /><b /><b /><span>{t("tool.password-generator.name")}</span></div>
            <div className="nv-win-body">
              <div className="nv-pass"><Scramble /></div>
              <div className="nv-meter nv-meter-strong"><span /></div>
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

          <div className="nv-chip nv-chip-1">
            <Sparkles className="h-4 w-4 text-violet-300" />
            <div className="nv-lines"><i /><i /><i /></div>
            <span>{t("tool.ai-text-summarizer.name")}</span>
          </div>
          <div className="nv-chip nv-chip-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>{t("why.privacy.title")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
