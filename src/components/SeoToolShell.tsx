import type { CSSProperties, ReactNode } from "react";

/**
 * Shared "stage" for the SEO tools: a soft animated background (indigo, sky and violet light blobs, floating
 * keyword chips, a slow grid) with glass panels on top. Same family of colours as the other redesigned tools.
 * Everything animated stops with "reduce motion".
 */
export const seoCard =
  "rounded-3xl border border-white/80 bg-white/75 shadow-[0_24px_60px_-34px_rgba(79,70,229,.5)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[0_24px_60px_-34px_rgba(0,0,0,.8)]";
export const seoBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200/80 bg-white/80 px-3.5 py-2 text-sm font-semibold text-indigo-900 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-indigo-100 dark:hover:bg-white/10";
export const seoField =
  "w-full rounded-2xl border border-indigo-200/80 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500";

const CHIPS: { text: string; left: number; top: number; dur: number; delay: number }[] = [
  { text: "title", left: 4, top: 14, dur: 15, delay: 0 },
  { text: "60", left: 86, top: 10, dur: 17, delay: -3 },
  { text: "meta", left: 74, top: 46, dur: 14, delay: -6 },
  { text: "SERP", left: 8, top: 52, dur: 18, delay: -9 },
  { text: "keyword", left: 58, top: 80, dur: 16, delay: -2 },
  { text: "160", left: 22, top: 84, dur: 19, delay: -11 },
  { text: "px", left: 92, top: 70, dur: 13, delay: -5 },
];

export function SeoToolShell({ children }: { children: ReactNode }) {
  return (
    <div className="zseo relative isolate overflow-hidden rounded-[2rem] border border-indigo-100/80 p-3 sm:p-6 dark:border-white/10">
      <style>{`
        @keyframes zseo-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,30px,0) scale(1.12); } }
        @keyframes zseo-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-70px,-25px,0) scale(.94); } }
        @keyframes zseo-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zseo-chip { 0%,100% { transform: translate3d(0,0,0); opacity: .45; } 50% { transform: translate3d(18px,-22px,0); opacity: .95; } }
        @keyframes zseo-grid { to { background-position: 40px 40px, 40px 40px; } }
        @keyframes zseo-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes zseo-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes zseo-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        @keyframes zseo-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.8); opacity: .3; } }
        @keyframes zseo-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes zseo-bars { 0%,100% { transform: scaleY(.35); } 50% { transform: scaleY(1); } }
        @keyframes zseo-bob { 0%,100% { transform: translateY(0) rotate(0); } 25% { transform: translateY(-2px) rotate(-6deg); } 75% { transform: translateY(2px) rotate(6deg); } }
        .zseo-blob { will-change: transform; }
        .zseo-blob-a { animation: zseo-blob-a 24s ease-in-out infinite; }
        .zseo-blob-b { animation: zseo-blob-b 30s ease-in-out infinite; }
        .zseo-blob-c { animation: zseo-blob-c 27s ease-in-out infinite; }
        .zseo-chip { position: absolute; white-space: nowrap; animation: zseo-chip ease-in-out infinite; }
        .zseo-grid { background-image: linear-gradient(rgba(99,102,241,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.07) 1px, transparent 1px); background-size: 40px 40px; animation: zseo-grid 14s linear infinite; -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%); mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%); }
        .zseo-rise { animation: zseo-rise .5s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(var(--i, 0) * 70ms); }
        .zseo-grow { transform-origin: left center; animation: zseo-grow .7s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(var(--i, 0) * 45ms); }
        .zseo-shine { position: relative; overflow: hidden; }
        .zseo-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%); transform: translateX(-130%); animation: zseo-shine 4s ease-in-out infinite; }
        .zseo-dot { animation: zseo-pulse 2.2s ease-in-out infinite; }
        .zseo-float { animation: zseo-float 5s ease-in-out infinite; animation-delay: calc(var(--i, 0) * -.8s); }
        .zseo-ico svg { animation: zseo-bob 5s ease-in-out infinite; animation-delay: calc(var(--i, 0) * -.7s); }
        .zseo-eq i { display: block; width: 4px; height: 100%; border-radius: 3px; transform-origin: bottom; animation: zseo-bars 1.3s ease-in-out infinite; }
        .zseo-eq i:nth-child(2) { animation-delay: -.3s; } .zseo-eq i:nth-child(3) { animation-delay: -.6s; } .zseo-eq i:nth-child(4) { animation-delay: -.9s; } .zseo-eq i:nth-child(5) { animation-delay: -.45s; }
        .zseo-pin { transition: left .6s cubic-bezier(.16,1,.3,1); }
        .zseo-fill { transition: width .6s cubic-bezier(.16,1,.3,1), background-color .4s; }
        @media (prefers-reduced-motion: reduce) {
          .zseo *, .zseo *::before, .zseo *::after { animation: none !important; }
          .zseo-pin, .zseo-fill { transition: none; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-sky-50 to-violet-50 dark:from-slate-950 dark:via-indigo-950/60 dark:to-slate-900" />
        <div className="zseo-grid absolute inset-0" />
        <div className="zseo-blob zseo-blob-a absolute -left-24 -top-24 h-96 w-[34rem] rounded-full bg-gradient-to-r from-indigo-300/55 to-sky-200/40 blur-3xl dark:from-indigo-500/25 dark:to-sky-500/15" />
        <div className="zseo-blob zseo-blob-b absolute -right-28 top-1/3 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-violet-200/60 to-pink-200/40 blur-3xl dark:from-violet-400/15 dark:to-pink-500/15" />
        <div className="zseo-blob zseo-blob-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-sky-200/55 to-emerald-100/40 blur-3xl dark:from-sky-500/20 dark:to-emerald-500/10" />
        {CHIPS.map((c, i) => (
          <span
            key={i}
            className="zseo-chip rounded-full border border-indigo-200/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-indigo-700/80 dark:border-white/10 dark:bg-white/5 dark:text-indigo-200/60"
            style={{ left: `${c.left}%`, top: `${c.top}%`, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` } as CSSProperties}
          >
            {c.text}
          </span>
        ))}
      </div>
      <div className="relative space-y-5">{children}</div>
    </div>
  );
}
