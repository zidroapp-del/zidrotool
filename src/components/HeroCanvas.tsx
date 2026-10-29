import { useEffect, useRef } from "react";

/**
 * Full-bleed hero background drawn on a canvas:
 * moving aurora, a perspective grid that travels toward the viewer, flowing light ribbons,
 * drifting particles and an interactive light trail that follows the pointer
 * (an automatic "light" keeps moving when nobody touches the page).
 * Pauses when scrolled away or when the tab is hidden. Static frame for reduced motion.
 */
interface Particle { x: number; y: number; z: number; s: number }
interface TrailPoint { x: number; y: number; t: number }

export function HeroCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let inView = true;
    let particles: Particle[] = [];
    const trail: TrailPoint[] = [];
    const pointer = { x: 0, y: 0, nx: 0.5, ny: 0.5, last: -9999 };
    const light = { x: 0, y: 0 };
    const TRAIL_MS = 950;

    const init = () => {
      const n = w < 640 ? 46 : 110;
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.25 + Math.random() * 0.75,
        s: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, w < 640 ? 1.4 : 1.7);
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      light.x = w * 0.5;
      light.y = h * 0.45;
      init();
      if (reduce) draw(2.2, 0);
    };

    const draw = (time: number, now: number) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#050816";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // 1. aurora blobs
      const R = Math.max(w, h) * 0.5;
      const blobs = [
        { c: "59,130,246", a: 0.3, px: 0.2, py: 0.3, sp: 0.17 },
        { c: "139,92,246", a: 0.28, px: 0.8, py: 0.25, sp: 0.13 },
        { c: "34,211,238", a: 0.16, px: 0.5, py: 0.75, sp: 0.21 },
      ];
      blobs.forEach((b, i) => {
        const x = w * (b.px + 0.16 * Math.sin(time * b.sp + i * 2));
        const y = h * (b.py + 0.12 * Math.cos(time * b.sp * 1.3 + i));
        const g = ctx.createRadialGradient(x, y, 0, x, y, R * (0.8 + 0.12 * Math.sin(time * 0.4 + i)));
        g.addColorStop(0, `rgba(${b.c},${b.a})`);
        g.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      // 2. perspective grid floor traveling toward the viewer
      const horizon = h * 0.64;
      const vx = w * 0.5 + (pointer.nx - 0.5) * 90;
      ctx.lineWidth = 1;
      for (let i = -16; i <= 16; i++) {
        const a = 0.05 + 0.1 * (1 - Math.abs(i) / 17);
        ctx.strokeStyle = `rgba(96,165,250,${a})`;
        ctx.beginPath();
        ctx.moveTo(vx + i * 14, horizon);
        ctx.lineTo(vx + i * (w / 7), h);
        ctx.stroke();
      }
      const rows = 14;
      const off = (time * 0.55) % 1;
      for (let k = 0; k < rows; k++) {
        const p = (k + off) / rows;
        const y = horizon + (h - horizon) * Math.pow(p, 2.3);
        ctx.strokeStyle = `rgba(129,140,248,${0.04 + p * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const hg = ctx.createLinearGradient(0, horizon - 70, 0, horizon + 50);
      hg.addColorStop(0, "rgba(99,102,241,0)");
      hg.addColorStop(0.55, "rgba(99,102,241,0.22)");
      hg.addColorStop(1, "rgba(99,102,241,0)");
      ctx.fillStyle = hg;
      ctx.fillRect(0, horizon - 70, w, 120);

      // 3. flowing light ribbons
      for (let r = 0; r < 3; r++) {
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, "rgba(59,130,246,0)");
        grad.addColorStop(0.38, "rgba(59,130,246,0.5)");
        grad.addColorStop(0.7, "rgba(167,139,250,0.7)");
        grad.addColorStop(1, "rgba(34,211,238,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4 + r * 0.5;
        ctx.shadowColor = "rgba(99,102,241,0.8)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        for (let x = 0; x <= w + 8; x += 8) {
          const y =
            h * (0.56 + r * 0.035) +
            Math.sin(x * 0.0055 + time * (0.8 + r * 0.15) + r * 1.8) * h * (0.08 + r * 0.02) +
            Math.sin(x * 0.013 - time * 0.6 + r) * h * 0.025;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // 4. particles
      for (const p of particles) {
        if (!reduce) {
          p.y -= 0.12 + p.z * 0.35;
          p.x += Math.sin(time * 0.5 + p.s) * 0.12;
          if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        }
        const px = p.x + (pointer.nx - 0.5) * 36 * p.z;
        const py = p.y + (pointer.ny - 0.5) * 24 * p.z;
        const tw = 0.45 + 0.55 * Math.sin(time * 1.6 + p.s);
        ctx.fillStyle = `rgba(191,219,254,${(0.15 + 0.6 * p.z) * tw})`;
        ctx.beginPath();
        ctx.arc(px, py, 0.6 + p.z * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. light trail
      if (!reduce) {
        const idle = now - pointer.last > 1800;
        const tx = idle ? w * (0.5 + 0.36 * Math.sin(time * 0.75)) : pointer.x;
        const ty = idle ? h * (0.44 + 0.22 * Math.sin(time * 1.15 + 1)) : pointer.y;
        light.x += (tx - light.x) * 0.16;
        light.y += (ty - light.y) * 0.16;
        trail.push({ x: light.x, y: light.y, t: now });
        while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
        ctx.lineCap = "round";
        for (let i = 1; i < trail.length; i++) {
          const age = (now - trail[i].t) / TRAIL_MS;
          const f = 1 - age;
          ctx.strokeStyle = `hsla(${210 + age * 70},95%,${62 + f * 10}%,${f * f * 0.95})`;
          ctx.lineWidth = 0.6 + 7 * f;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
        const hg2 = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 90);
        hg2.addColorStop(0, "rgba(147,197,253,0.55)");
        hg2.addColorStop(0.4, "rgba(129,140,248,0.18)");
        hg2.addColorStop(1, "rgba(129,140,248,0)");
        ctx.fillStyle = hg2;
        ctx.fillRect(light.x - 90, light.y - 90, 180, 180);
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (ms: number) => {
      raf = 0;
      if (!inView || document.hidden) return;
      draw(ms / 1000, ms);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce || raf || !inView || document.hidden) return;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.nx = Math.min(1, Math.max(0, pointer.x / r.width));
      pointer.ny = Math.min(1, Math.max(0, pointer.y / r.height));
      if (pointer.y >= 0 && pointer.y <= r.height) pointer.last = performance.now();
    };
    const onVis = () => (document.hidden ? undefined : start());

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => {
      inView = en.isIntersecting;
      if (inView) start();
    });
    io.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden="true" />;
}
