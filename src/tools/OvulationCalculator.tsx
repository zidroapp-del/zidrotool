import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertCircle, CalendarDays, Check, ChevronLeft, ChevronRight, Copy, RotateCcw, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";

/* ------------------------------------------------------------------ cycle maths
 * Calendar (rhythm) method, an estimate only:
 *   ovulation   = first day of last period + (cycle length - luteal phase)
 *   fertile     = 5 days before ovulation up to 1 day after
 *   most fertile= the 3 days ending on ovulation day
 *   due date    = first day of last period + 280 days, shifted by (cycle length - 28)
 * Dates are handled as local calendar days, so daylight-saving changes never move a day.
 */

const DAY = 86_400_000;
const MAX_PAST_DAYS = 365;

type Plan = { lmp: Date; cycle: number; luteal: number; period: number };
type Kind = "period" | "fertile" | "peak" | "ovulation" | "none";

const addDays = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayStart = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const diffDays = (a: Date, b: Date): number => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY);
const sameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function parseInputDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (y < 2000 || date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

function toInputDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 1-based day inside the cycle where ovulation falls. */
const ovulationIndex = (p: Plan): number => p.cycle - p.luteal + 1;

function kindOfIndex(p: Plan, idx: number): Kind {
  const o = ovulationIndex(p);
  if (idx === o) return "ovulation";
  if (idx <= p.period) return "period";
  if (idx >= o - 2 && idx < o) return "peak";
  if (idx >= o - 5 && idx <= o + 1) return "fertile";
  return "none";
}

function classify(p: Plan, date: Date): { kind: Kind; idx: number; k: number } | null {
  const diff = diffDays(p.lmp, date);
  if (diff < 0) return null;
  const k = Math.floor(diff / p.cycle);
  const idx = diff - k * p.cycle + 1;
  return { kind: kindOfIndex(p, idx), idx, k };
}

type CycleRow = { start: Date; fertileFrom: Date; fertileTo: Date; ovulation: Date; nextPeriod: Date; due: Date };

function cycleRow(p: Plan, k: number): CycleRow {
  const start = addDays(p.lmp, k * p.cycle);
  const o = ovulationIndex(p);
  return {
    start,
    fertileFrom: addDays(start, o - 6),
    fertileTo: addDays(start, o),
    ovulation: addDays(start, o - 1),
    nextPeriod: addDays(start, p.cycle),
    due: addDays(start, 280 + (p.cycle - 28)),
  };
}

/* ------------------------------------------------------------------ decoration */

const PETALS = [
  { left: 6, size: 16, dur: 19, delay: -3 },
  { left: 16, size: 11, dur: 24, delay: -11 },
  { left: 27, size: 14, dur: 21, delay: -7 },
  { left: 39, size: 10, dur: 26, delay: -15 },
  { left: 51, size: 15, dur: 20, delay: -1 },
  { left: 62, size: 12, dur: 25, delay: -9 },
  { left: 73, size: 17, dur: 22, delay: -13 },
  { left: 84, size: 11, dur: 27, delay: -5 },
  { left: 93, size: 14, dur: 23, delay: -17 },
];

const BG_STARS = [
  { left: 8, top: 14, size: 10, delay: 0 },
  { left: 22, top: 78, size: 8, delay: 1.2 },
  { left: 47, top: 9, size: 9, delay: 0.6 },
  { left: 66, top: 86, size: 11, delay: 2 },
  { left: 90, top: 42, size: 8, delay: 1.6 },
  { left: 35, top: 55, size: 7, delay: 2.4 },
];

function BloomCat({ happy }: { happy: boolean }) {
  return (
    <svg className="zov-cat h-20 w-24 shrink-0" viewBox="0 0 150 120" role="img" aria-label="Cat holding a flower">
      <g className="zov-tail" style={{ transformOrigin: "112px 98px" }}>
        <path d="M108 100 C132 100 140 78 128 66" fill="none" stroke="#f9a8d4" strokeWidth="9" strokeLinecap="round" />
      </g>
      <ellipse cx="75" cy="100" rx="40" ry="18" fill="#fbcfe8" />
      <g className="zov-head" style={{ transformOrigin: "75px 70px" }}>
        <path d="M44 52 L48 24 L68 40 Z" fill="#f9a8d4" />
        <path d="M106 52 L102 24 L82 40 Z" fill="#f9a8d4" />
        <path d="M50 44 L52 32 L61 40 Z" fill="#fff1f2" />
        <path d="M100 44 L98 32 L89 40 Z" fill="#fff1f2" />
        <ellipse cx="75" cy="64" rx="34" ry="29" fill="#fbcfe8" />
        <ellipse cx="75" cy="73" rx="14" ry="10" fill="#fff1f2" />
        <g className="zov-eyes" style={{ transformOrigin: "75px 62px" }}>
          {happy ? (
            <>
              <path d="M54 62 Q60 54 66 62" fill="none" stroke="#831843" strokeWidth="3" strokeLinecap="round" />
              <path d="M84 62 Q90 54 96 62" fill="none" stroke="#831843" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="60" cy="62" rx="5" ry="6.5" fill="#831843" />
              <ellipse cx="90" cy="62" rx="5" ry="6.5" fill="#831843" />
              <circle cx="61.8" cy="59.8" r="1.8" fill="#fff" />
              <circle cx="91.8" cy="59.8" r="1.8" fill="#fff" />
            </>
          )}
        </g>
        <path d="M72 70 L78 70 L75 74 Z" fill="#be185d" />
        <path d="M75 74 Q70 79 66 76 M75 74 Q80 79 84 76" fill="none" stroke="#831843" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="47" cy="72" r="6" fill="#fda4af" opacity="0.6" />
        <circle cx="103" cy="72" r="6" fill="#fda4af" opacity="0.6" />
        <path d="M44 68 L28 64 M44 73 L28 75 M106 68 L122 64 M106 73 L122 75" stroke="#f472b6" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <g className="zov-flower" style={{ transformOrigin: "36px 92px" }}>
        <path d="M36 112 L36 92" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
        <path d="M36 104 Q28 100 26 94 Q34 96 36 104" fill="#6ee7b7" />
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="36" cy="83" rx="5" ry="8" fill="#f472b6" transform={`rotate(${deg} 36 90)`} />
        ))}
        <circle cx="36" cy="90" r="4.2" fill="#fde68a" />
      </g>
      <ellipse cx="56" cy="108" rx="9" ry="6" fill="#fff1f2" />
      <ellipse cx="94" cy="108" rx="9" ry="6" fill="#fff1f2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ component */

const KIND_DOT: Record<Kind, string> = {
  period: "fill-rose-400",
  fertile: "fill-amber-400",
  peak: "fill-fuchsia-500",
  ovulation: "fill-violet-600",
  none: "fill-slate-300 dark:fill-slate-600",
};

const KIND_SWATCH: Record<Kind, string> = {
  period: "bg-rose-400",
  fertile: "bg-amber-400",
  peak: "bg-fuchsia-500",
  ovulation: "bg-violet-600",
  none: "bg-slate-300",
};

const KIND_CELL: Record<Kind, string> = {
  period: "bg-rose-200/90 text-rose-900 dark:bg-rose-400/30 dark:text-rose-100",
  fertile: "bg-amber-200/90 text-amber-900 dark:bg-amber-400/25 dark:text-amber-100",
  peak: "bg-fuchsia-300/90 text-fuchsia-950 dark:bg-fuchsia-500/40 dark:text-fuchsia-50",
  ovulation: "bg-violet-600 text-white shadow-md shadow-violet-500/40 dark:bg-violet-500",
  none: "text-ink-700 dark:text-ink-200",
};

export default function OvulationCalculator() {
  const { t, i18n } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;
  const lang = i18n?.language || "en";

  const [lmpText, setLmpText] = useState("");
  const [cycle, setCycle] = useState(28);
  const [period, setPeriod] = useState(5);
  const [luteal, setLuteal] = useState(14);
  const [advanced, setAdvanced] = useState(false);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [copied, setCopied] = useState(false);
  const [today, setToday] = useState(() => dayStart(new Date()));

  // keep "today" correct if the tab stays open past midnight
  useEffect(() => {
    const id = window.setInterval(() => setToday((prev) => (sameDay(prev, new Date()) ? prev : dayStart(new Date()))), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions): string => {
    try {
      return new Intl.DateTimeFormat(lang, opts).format(d);
    } catch {
      return new Intl.DateTimeFormat("en", opts).format(d);
    }
  };
  const shortDate = (d: Date) => fmt(d, { month: "short", day: "numeric" });
  const longDate = (d: Date) => fmt(d, { dateStyle: "long" });
  const range = (a: Date, b: Date) => `${shortDate(a)} – ${shortDate(b)}`;

  const lmp = useMemo(() => parseInputDate(lmpText), [lmpText]);
  const problem = useMemo((): string => {
    if (!lmpText) return "";
    if (!lmp) return tr("tool.ovulation.errDate", "Enter a valid date.");
    const age = diffDays(lmp, today);
    if (age < 0) return tr("tool.ovulation.errFuture", "The first day of your last period cannot be in the future.");
    if (age > MAX_PAST_DAYS) return tr("tool.ovulation.errOld", "That date is more than a year ago. Enter the first day of your most recent period.");
    return "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lmpText, lmp, today, lang]);

  const plan: Plan | null = lmp && !problem ? { lmp, cycle, luteal, period: Math.min(period, cycle - 1) } : null;

  const current = useMemo(() => {
    if (!plan) return null;
    const diff = diffDays(plan.lmp, today);
    const k = Math.max(0, Math.floor(diff / plan.cycle));
    const idx = diff - k * plan.cycle + 1;
    return { k, idx, kind: kindOfIndex(plan, idx) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lmpText, cycle, luteal, period, today, problem]);

  const rows = useMemo(() => {
    if (!plan || !current) return [] as CycleRow[];
    return Array.from({ length: 6 }, (_, i) => cycleRow(plan, current.k + i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lmpText, cycle, luteal, period, current, problem]);

  const now = rows[0];

  // jump the calendar to the month that matters when the result appears or changes
  useEffect(() => {
    if (!now) return;
    const focus = now.ovulation.getTime() < today.getTime() ? now.nextPeriod : now.ovulation;
    setMonth(new Date(focus.getFullYear(), focus.getMonth(), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lmpText, cycle, luteal]);

  const kindLabel = (k: Kind): string => {
    switch (k) {
      case "period":
        return tr("tool.ovulation.legendPeriod", "Period");
      case "fertile":
        return tr("tool.ovulation.legendFertile", "Fertile window");
      case "peak":
        return tr("tool.ovulation.legendPeak", "Most fertile days");
      case "ovulation":
        return tr("tool.ovulation.legendOvulation", "Ovulation day");
      default:
        return "";
    }
  };

  const status = useMemo((): string => {
    if (!plan || !current || !now) return "";
    const toOv = diffDays(today, now.ovulation);
    const toPeriod = diffDays(today, now.nextPeriod);
    switch (current.kind) {
      case "ovulation":
        return tr("tool.ovulation.statusOvulation", "Today is your estimated ovulation day.");
      case "peak":
        return tr("tool.ovulation.statusPeak", "You are in your most fertile days.");
      case "fertile":
        return tr("tool.ovulation.statusFertile", "You are in your estimated fertile window.");
      case "period":
        return tr("tool.ovulation.statusPeriod", "You are in the first days of your cycle.");
      default:
        return toOv > 0
          ? tr("tool.ovulation.statusBefore", "Days until estimated ovulation: {{n}}.", { n: toOv })
          : tr("tool.ovulation.statusAfter", "Days until your next period: {{n}}.", { n: Math.max(toPeriod, 0) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.cycle, plan?.luteal, current, now, lang]);

  const onReset = () => {
    setLmpText("");
    setCycle(28);
    setPeriod(5);
    setLuteal(14);
    setAdvanced(false);
  };

  const onCopy = async () => {
    if (!plan || !now) return;
    const lines = [
      `${tr("tool.ovulation.fertileWindow", "Fertile window")}: ${range(now.fertileFrom, now.fertileTo)}`,
      `${tr("tool.ovulation.ovulationDay", "Estimated ovulation")}: ${longDate(now.ovulation)}`,
      `${tr("tool.ovulation.nextPeriod", "Next period")}: ${longDate(now.nextPeriod)}`,
      `${tr("tool.ovulation.dueDate", "Due date if pregnant")}: ${longDate(now.due)}`,
      "",
      tr("tool.ovulation.disclaimerShort", "Estimate only. Not medical advice and not a method of birth control."),
    ];
    const ok = await copyToClipboard(lines.join("\n"));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  /* calendar grid */
  const weekStartsOnSunday = /^(en|ar)/i.test(lang);
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() - (weekStartsOnSunday ? 0 : 1) + 7) % 7;
    const dim = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: Array<Date | null> = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= dim; d++) out.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [month, weekStartsOnSunday]);

  const weekdays = useMemo(() => {
    const base = new Date(2023, 0, weekStartsOnSunday ? 1 : 2); // a Sunday or a Monday
    return Array.from({ length: 7 }, (_, i) => fmt(addDays(base, i), { weekday: "narrow" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, weekStartsOnSunday]);

  /* cycle wheel */
  const wheel = useMemo(() => {
    const R = 104;
    return Array.from({ length: cycle }, (_, i) => {
      const a = (-90 + (i / cycle) * 360) * (Math.PI / 180);
      const p = plan ?? { lmp: today, cycle, luteal, period: Math.min(period, cycle - 1) };
      return { i, x: 130 + R * Math.cos(a), y: 130 + R * Math.sin(a), kind: kindOfIndex(p, i + 1) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle, luteal, period, lmpText, problem]);

  const card =
    "rounded-3xl border border-white/70 bg-white/70 p-5 sm:p-7 shadow-[0_24px_60px_-30px_rgba(190,24,93,0.45)] ring-1 ring-rose-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:ring-fuchsia-300/10";
  const label = "mb-1.5 block text-xs font-semibold text-ink-600 dark:text-ink-300";
  const field =
    "input w-full rounded-xl border-rose-100 bg-white/85 text-base transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200/70 dark:border-rose-900/50 dark:bg-slate-950/60";
  const todayIdx = current?.idx ?? 0;

  const stat = (title: string, value: string, sub: string, tone: string, delay: number) => (
    <div className={`zov-rise rounded-2xl border p-4 ${tone}`} style={{ animationDelay: `${delay}ms` } as CSSProperties}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{title}</p>
      <p className="mt-1 text-lg font-extrabold leading-tight sm:text-xl">{value}</p>
      <p className="mt-0.5 text-xs opacity-80">{sub}</p>
    </div>
  );

  return (
    <div className="zov-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-8">
      <style>{`
        @keyframes zov-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,30px,0) scale(1.12); } }
        @keyframes zov-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-70px,-25px,0) scale(0.94); } }
        @keyframes zov-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zov-fall { 0% { transform: translate3d(0,-8%,0) rotate(0deg); opacity: 0; } 8% { opacity: 0.85; } 50% { transform: translate3d(40px,55vh,0) rotate(200deg); } 92% { opacity: 0.7; } 100% { transform: translate3d(-20px,115%,0) rotate(400deg); opacity: 0; } }
        @keyframes zov-twinkle { 0%,100% { opacity: 0.2; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes zov-glow { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.95; transform: scale(1.06); } }
        @keyframes zov-spin { to { transform: rotate(360deg); } }
        @keyframes zov-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes zov-pulse { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.9); opacity: 0; } }
        @keyframes zov-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
        @keyframes zov-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(9deg); } }
        @keyframes zov-sway { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        @keyframes zov-blink { 0%,92%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes zov-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        .zov-blob { will-change: transform; }
        .zov-blob-a { animation: zov-blob-a 24s ease-in-out infinite; }
        .zov-blob-b { animation: zov-blob-b 30s ease-in-out infinite; }
        .zov-blob-c { animation: zov-blob-c 27s ease-in-out infinite; }
        .zov-petal { position: absolute; top: 0; animation: zov-fall linear infinite; }
        .zov-star { position: absolute; animation: zov-twinkle ease-in-out infinite; }
        .zov-moon { animation: zov-glow 9s ease-in-out infinite; }
        .zov-orbit { transform-origin: 50% 50%; animation: zov-spin linear infinite; }
        .zov-rise { animation: zov-rise 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .zov-today-ring { transform-origin: center; transform-box: fill-box; animation: zov-pulse 1.8s ease-out infinite; }
        .zov-cat .zov-head { animation: zov-bob 4s ease-in-out infinite; }
        .zov-cat .zov-tail { animation: zov-tail 3s ease-in-out infinite; }
        .zov-cat .zov-flower { animation: zov-sway 3.4s ease-in-out infinite; }
        .zov-cat .zov-eyes { animation: zov-blink 5.5s ease-in-out infinite; }
        .zov-shine { position: relative; overflow: hidden; }
        .zov-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%); transform: translateX(-130%); animation: zov-shine 4.5s ease-in-out infinite; }
        .zov-range { accent-color: #e11d48; }
        @media (prefers-reduced-motion: reduce) {
          .zov-blob, .zov-petal, .zov-star, .zov-moon, .zov-orbit, .zov-rise, .zov-today-ring, .zov-cat *, .zov-shine::after { animation: none !important; }
          .zov-petal { display: none; }
        }
      `}</style>

      {/* animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-fuchsia-50 to-amber-50 dark:from-slate-950 dark:via-fuchsia-950/60 dark:to-rose-950/70" />
        <div className="zov-blob zov-blob-a absolute -left-24 -top-20 h-96 w-[34rem] rounded-full bg-gradient-to-r from-rose-300/55 to-pink-200/40 blur-3xl dark:from-rose-500/25 dark:to-pink-500/15" />
        <div className="zov-blob zov-blob-b absolute -right-28 top-1/4 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-violet-300/45 to-fuchsia-200/40 blur-3xl dark:from-violet-500/25 dark:to-fuchsia-500/15" />
        <div className="zov-blob zov-blob-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-amber-200/60 to-orange-200/40 blur-3xl dark:from-amber-400/15 dark:to-orange-500/15" />
        <svg className="absolute -right-44 -top-44 h-[46rem] w-[46rem] text-rose-400/40 dark:text-rose-200/15" viewBox="0 0 400 400" fill="none" stroke="currentColor">
          <g className="zov-orbit" style={{ animationDuration: "140s" }}>
            <circle cx="200" cy="200" r="190" strokeWidth="1" strokeDasharray="2 7" />
            <circle cx="390" cy="200" r="7" fill="currentColor" stroke="none" />
          </g>
          <g className="zov-orbit" style={{ animationDuration: "90s", animationDirection: "reverse" }}>
            <circle cx="200" cy="200" r="140" strokeWidth="1" strokeDasharray="1 6" />
            <circle cx="200" cy="60" r="5" fill="currentColor" stroke="none" />
          </g>
          <g className="zov-orbit" style={{ animationDuration: "55s" }}>
            <circle cx="200" cy="200" r="90" strokeWidth="1" strokeDasharray="1 5" />
            <circle cx="110" cy="200" r="4" fill="currentColor" stroke="none" />
          </g>
        </svg>
        <svg className="zov-moon absolute right-[7%] top-[6%] h-14 w-14 text-amber-200 dark:text-amber-100" viewBox="0 0 48 48" fill="currentColor">
          <path d="M33 6 A19 19 0 1 0 42 32 A15 15 0 1 1 33 6 Z" />
        </svg>
        {PETALS.map((p, index) => (
          <svg
            key={`petal-${index}`}
            className="zov-petal text-rose-300/80 dark:text-rose-300/40"
            viewBox="0 0 20 20"
            width={p.size}
            height={p.size}
            fill="currentColor"
            style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` } as CSSProperties}
          >
            <path d="M10 1 C16 5 17 12 10 19 C3 12 4 5 10 1 Z" />
          </svg>
        ))}
        {BG_STARS.map((s, index) => (
          <svg
            key={`star-${index}`}
            className="zov-star text-amber-300 dark:text-yellow-100"
            viewBox="0 0 24 24"
            width={s.size}
            height={s.size}
            fill="currentColor"
            style={{ left: `${s.left}%`, top: `${s.top}%`, animationDuration: `${3 + (index % 3)}s`, animationDelay: `${s.delay}s` } as CSSProperties}
          >
            <path d="M12 1 L14 9.5 L23 12 L14 14.5 L12 23 L10 14.5 L1 12 L10 9.5 Z" />
          </svg>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        {/* ------------------------------------------------ inputs */}
        <section className={`${card} lg:sticky lg:top-24 lg:self-start`} aria-label={tr("tool.ovulation.lmp", "First day of your last period")}>
          <div className="mb-4 flex items-end justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-800 dark:text-ink-100">
              <CalendarDays className="h-4 w-4 text-rose-500" aria-hidden="true" />
              {tr("tool.ovulation.heading", "Your cycle")}
            </h2>
            <BloomCat happy={Boolean(plan)} />
          </div>

          <label htmlFor="ov-lmp" className={label}>
            {tr("tool.ovulation.lmp", "First day of your last period")}
          </label>
          <div className="flex gap-2">
            <input id="ov-lmp" type="date" className={field} value={lmpText} max={toInputDate(today)} onChange={(e) => setLmpText(e.target.value)} />
            <button
              type="button"
              onClick={() => setLmpText(toInputDate(today))}
              className="shrink-0 rounded-xl border border-rose-200 bg-white/80 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-900/60 dark:text-rose-200"
            >
              {tr("tool.ovulation.today", "Today")}
            </button>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="ov-cycle" className="text-xs font-semibold text-ink-600 dark:text-ink-300">
                {tr("tool.ovulation.cycleLength", "Average cycle length")}
              </label>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
                {tr("tool.ovulation.days", "{{n}} days", { n: cycle })}
              </span>
            </div>
            <input id="ov-cycle" type="range" min={21} max={45} step={1} value={cycle} onChange={(e) => setCycle(Number(e.target.value))} className="zov-range w-full" />
            <div className="mt-0.5 flex justify-between text-[10px] text-ink-400">
              <span>21</span>
              <span>28</span>
              <span>35</span>
              <span>45</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            aria-expanded={advanced}
            className="mt-4 text-xs font-semibold text-rose-600 underline-offset-2 hover:underline dark:text-rose-300"
          >
            {advanced ? tr("tool.ovulation.hideAdvanced", "Hide advanced options") : tr("tool.ovulation.showAdvanced", "Advanced options")}
          </button>
          {advanced && (
            <div className="zov-rise mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ov-period" className={label}>
                  {tr("tool.ovulation.periodLength", "Period length")}
                </label>
                <select id="ov-period" className={field} value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
                  {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                    <option key={n} value={n}>
                      {tr("tool.ovulation.days", "{{n}} days", { n })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ov-luteal" className={label}>
                  {tr("tool.ovulation.lutealLength", "Luteal phase")}
                </label>
                <select id="ov-luteal" className={field} value={luteal} onChange={(e) => setLuteal(Number(e.target.value))}>
                  {Array.from({ length: 7 }, (_, i) => i + 10).map((n) => (
                    <option key={n} value={n}>
                      {tr("tool.ovulation.days", "{{n}} days", { n })}
                    </option>
                  ))}
                </select>
              </div>
              <p className="col-span-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                {tr("tool.ovulation.lutealHint", "The luteal phase is the time between ovulation and your next period. 14 days is the usual assumption.")}
              </p>
            </div>
          )}

          {problem && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {problem}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onCopy}
              disabled={!plan}
              className="zov-shine inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? tr("tool.ovulation.copied", "Copied") : tr("tool.ovulation.copy", "Copy results")}
            </button>
            <button
              type="button"
              onClick={onReset}
              aria-label={tr("tool.ovulation.reset", "Reset")}
              title={tr("tool.ovulation.reset", "Reset")}
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white/80 px-3 text-rose-700 transition hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-900/60 dark:text-rose-200"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
            {tr("tool.ovulation.privacy", "Everything is calculated in your browser. Your dates are not sent or saved.")}
          </p>
        </section>

        {/* ------------------------------------------------ results */}
        <div className="min-w-0 space-y-6">
          {/* wheel + stats */}
          <section className={card} aria-live="polite">
            <div className="grid items-center gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
              <div className="mx-auto w-full max-w-[15rem]">
                <svg viewBox="0 0 260 260" className="w-full" role="img" aria-label={tr("tool.ovulation.wheelLabel", "Cycle wheel")}>
                  <circle cx="130" cy="130" r="104" fill="none" className="stroke-rose-100 dark:stroke-white/10" strokeWidth="1" />
                  <g className="zov-orbit" style={{ animationDuration: "160s" }}>
                    <circle cx="130" cy="130" r="80" fill="none" className="stroke-rose-200/70 dark:stroke-white/10" strokeWidth="1" strokeDasharray="2 6" />
                  </g>
                  {wheel.map((d) => (
                    <circle
                      key={d.i}
                      cx={d.x}
                      cy={d.y}
                      r={d.kind === "ovulation" ? 7 : d.kind === "none" ? 3.6 : 5}
                      className={`${KIND_DOT[d.kind]} ${plan ? "" : "opacity-60"}`}
                    />
                  ))}
                  {plan && todayIdx > 0 && wheel[todayIdx - 1] && (
                    <>
                      <circle cx={wheel[todayIdx - 1]!.x} cy={wheel[todayIdx - 1]!.y} r="9" className="zov-today-ring fill-none stroke-indigo-500" strokeWidth="2" />
                      <circle cx={wheel[todayIdx - 1]!.x} cy={wheel[todayIdx - 1]!.y} r="9" className="fill-none stroke-indigo-500" strokeWidth="2" />
                    </>
                  )}
                  <text x="130" y="122" textAnchor="middle" className="fill-ink-500 text-[11px] font-semibold dark:fill-ink-300">
                    {plan ? tr("tool.ovulation.cycleDay", "Cycle day") : tr("tool.ovulation.cycleOf", "Cycle")}
                  </text>
                  <text x="130" y="152" textAnchor="middle" className="fill-ink-900 text-[30px] font-extrabold dark:fill-white">
                    {plan ? todayIdx : cycle}
                  </text>
                  <text x="130" y="170" textAnchor="middle" className="fill-ink-500 text-[11px] dark:fill-ink-300">
                    {plan ? tr("tool.ovulation.ofN", "of {{n}}", { n: cycle }) : tr("tool.ovulation.daysShort", "days")}
                  </text>
                </svg>
              </div>

              <div className="min-w-0">
                {plan && now ? (
                  <>
                    <p className="zov-rise mb-3 rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold text-ink-800 dark:bg-white/5 dark:text-ink-100">
                      {status}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {stat(
                        tr("tool.ovulation.fertileWindow", "Fertile window"),
                        range(now.fertileFrom, now.fertileTo),
                        tr("tool.ovulation.fertileSub", "Most fertile: {{range}}", { range: range(addDays(now.ovulation, -2), now.ovulation) }),
                        "border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100",
                        0,
                      )}
                      {stat(
                        tr("tool.ovulation.ovulationDay", "Estimated ovulation"),
                        longDate(now.ovulation),
                        tr("tool.ovulation.cycleStart", "Cycle started {{date}}", { date: shortDate(now.start) }),
                        "border-violet-200 bg-violet-50/90 text-violet-950 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100",
                        70,
                      )}
                      {stat(
                        tr("tool.ovulation.nextPeriod", "Next period"),
                        longDate(now.nextPeriod),
                        tr("tool.ovulation.testFrom", "Take a pregnancy test from this day"),
                        "border-rose-200 bg-rose-50/90 text-rose-950 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100",
                        140,
                      )}
                      {stat(
                        tr("tool.ovulation.dueDate", "Due date if pregnant"),
                        longDate(now.due),
                        tr("tool.ovulation.dueSub", "If conceived in this cycle"),
                        "border-fuchsia-200 bg-fuchsia-50/90 text-fuchsia-950 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-100",
                        210,
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl border border-dashed border-rose-300 bg-white/60 p-5 text-sm text-ink-600 dark:border-rose-800 dark:bg-white/5 dark:text-ink-300">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
                    <p>{tr("tool.ovulation.empty", "Pick the first day of your last period and your average cycle length to see your fertile window, estimated ovulation, next period and due date.")}</p>
                  </div>
                )}
              </div>
            </div>

            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-ink-600 dark:text-ink-300">
              {(["period", "fertile", "peak", "ovulation"] as const).map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <span className={`inline-block h-3 w-3 rounded-full ${KIND_SWATCH[k]}`} aria-hidden="true" />
                  {kindLabel(k)}
                </li>
              ))}
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full ring-2 ring-indigo-500" aria-hidden="true" />
                {tr("tool.ovulation.legendToday", "Today")}
              </li>
            </ul>
          </section>

          {/* calendar */}
          <section className={card}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold capitalize text-ink-800 dark:text-ink-100">{fmt(month, { month: "long", year: "numeric" })}</h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label={tr("tool.ovulation.prevMonth", "Previous month")}
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="rounded-lg border border-rose-200 bg-white/80 p-1.5 text-rose-700 transition hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-900/60 dark:text-rose-200"
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={tr("tool.ovulation.nextMonth", "Next month")}
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="rounded-lg border border-rose-200 bg-white/80 p-1.5 text-rose-700 transition hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-900/60 dark:text-rose-200"
                >
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-ink-500 dark:text-ink-400">
              {weekdays.map((w, i) => (
                <span key={i} className="py-1">
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <span key={i} />;
                const c = plan ? classify(plan, d) : null;
                const kind: Kind = c?.kind ?? "none";
                const isToday = sameDay(d, today);
                return (
                  <span
                    key={i}
                    title={kind !== "none" ? `${longDate(d)} · ${kindLabel(kind)}` : longDate(d)}
                    className={`relative flex h-10 items-center justify-center sm:h-11 rounded-xl text-sm font-semibold transition ${KIND_CELL[kind]} ${isToday ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900" : ""}`}
                  >
                    {d.getDate()}
                    {kind === "ovulation" && <Sparkles className="absolute -right-0.5 -top-0.5 h-3 w-3 text-amber-300" aria-hidden="true" />}
                  </span>
                );
              })}
            </div>
          </section>

          {/* next cycles */}
          {plan && rows.length > 0 && (
            <section className={card}>
              <h2 className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">{tr("tool.ovulation.nextCycles", "Next 6 cycles")}</h2>
              <div className="overflow-x-auto rounded-2xl border border-rose-100 dark:border-white/10">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-rose-100/80 text-xs uppercase tracking-wide text-rose-900 dark:bg-rose-400/15 dark:text-rose-100">
                      <th className="px-3 py-2 font-bold">{tr("tool.ovulation.colStart", "Period start")}</th>
                      <th className="px-3 py-2 font-bold">{tr("tool.ovulation.fertileWindow", "Fertile window")}</th>
                      <th className="px-3 py-2 font-bold">{tr("tool.ovulation.colOvulation", "Ovulation")}</th>
                      <th className="px-3 py-2 font-bold">{tr("tool.ovulation.colDue", "Due date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={`border-t border-rose-100 dark:border-white/10 ${i === 0 ? "bg-white/70 font-semibold dark:bg-white/5" : ""}`}>
                        <td className="px-3 py-2">{longDate(r.start)}</td>
                        <td className="px-3 py-2">{range(r.fertileFrom, r.fertileTo)}</td>
                        <td className="px-3 py-2">{shortDate(r.ovulation)}</td>
                        <td className="px-3 py-2">{longDate(r.due)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(cycle < 24 || cycle > 35) && (
                <p className="mt-3 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {tr("tool.ovulation.unusual", "Cycles shorter than 24 or longer than 35 days are harder to predict. Consider talking to a doctor if your cycles are irregular.")}
                </p>
              )}
            </section>
          )}

          <p className="rounded-2xl border border-rose-200/80 bg-white/60 p-4 text-xs leading-relaxed text-ink-600 dark:border-white/10 dark:bg-white/5 dark:text-ink-300">
            {tr(
              "tool.ovulation.disclaimer",
              "These dates are estimates from the calendar method and assume a regular cycle. Ovulation can move from month to month, so this is not a method of birth control and not medical advice. If you are trying to conceive for a while without success, or your cycles are irregular, talk to a doctor or midwife.",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
