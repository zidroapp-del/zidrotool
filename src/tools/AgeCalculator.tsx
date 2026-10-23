import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Cake, CalendarDays, Check, Clock, Copy, RotateCcw, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";

/* ------------------------------------------------------------------ date maths */

const DAY = 86_400_000;
const SYNODIC_MONTH = 29.530588853; // mean length of a lunar cycle, in days

type Breakdown = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type Totals = {
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function parseLocal(date: string, time: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1900 || year > 2999) return null;
  const tm = /^(\d{2}):(\d{2})$/.exec(time || "00:00");
  const d = new Date(year, month - 1, day, tm ? Number(tm[1]) : 0, tm ? Number(tm[2]) : 0, 0, 0);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

/** a + n calendar months, clamped to the end of the month (Jan 31 + 1 month = Feb 28/29). */
function addMonths(a: Date, n: number): Date {
  const d = new Date(a.getFullYear(), a.getMonth() + n, 1, a.getHours(), a.getMinutes(), a.getSeconds());
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(a.getDate(), last));
  return d;
}

function measure(a: Date, b: Date): { parts: Breakdown; totals: Totals } {
  let totalMonths = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (addMonths(a, totalMonths).getTime() > b.getTime()) totalMonths--;
  totalMonths = Math.max(0, totalMonths);
  const anchor = addMonths(a, totalMonths);
  const rem = Math.max(0, b.getTime() - anchor.getTime());
  const ms = Math.max(0, b.getTime() - a.getTime());
  const days = Math.floor(ms / DAY);
  return {
    parts: {
      years: Math.floor(totalMonths / 12),
      months: totalMonths % 12,
      days: Math.floor(rem / DAY),
      hours: Math.floor((rem % DAY) / 3_600_000),
      minutes: Math.floor((rem % 3_600_000) / 60_000),
      seconds: Math.floor((rem % 60_000) / 1000),
    },
    totals: {
      months: totalMonths,
      weeks: Math.floor(days / 7),
      days,
      hours: Math.floor(ms / 3_600_000),
      minutes: Math.floor(ms / 60_000),
      seconds: Math.floor(ms / 1000),
    },
  };
}

function birthdayIn(birth: Date, year: number): Date {
  const last = new Date(year, birth.getMonth() + 1, 0).getDate();
  return new Date(year, birth.getMonth(), Math.min(birth.getDate(), last));
}

function nextBirthday(birth: Date, now: Date): { next: Date; prev: Date; daysLeft: number; progress: number } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = birthdayIn(birth, now.getFullYear());
  if (next.getTime() < today.getTime()) next = birthdayIn(birth, now.getFullYear() + 1);
  const prev = birthdayIn(birth, next.getFullYear() - 1);
  const daysLeft = Math.round((next.getTime() - today.getTime()) / DAY);
  const progress = daysLeft === 0 ? 1 : Math.min(1, Math.max(0, (now.getTime() - prev.getTime()) / (next.getTime() - prev.getTime())));
  return { next, prev, daysLeft, progress };
}

function toInputDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ------------------------------------------------------------------ decorative data */

const BG_STARS = [
  { left: 6, top: 12, size: 12, delay: 0 },
  { left: 17, top: 70, size: 9, delay: -1.3 },
  { left: 28, top: 28, size: 11, delay: -2.1 },
  { left: 41, top: 82, size: 14, delay: -0.7 },
  { left: 53, top: 9, size: 9, delay: -3.2 },
  { left: 64, top: 55, size: 12, delay: -1.9 },
  { left: 77, top: 20, size: 10, delay: -2.6 },
  { left: 88, top: 74, size: 13, delay: -0.4 },
  { left: 94, top: 36, size: 9, delay: -1.6 },
] as const;

function SleepyCat({ happy }: { happy: boolean }) {
  const ink = "#5b3f94";
  return (
    <svg viewBox="0 0 150 96" width="156" height="99" className="zag-cat block" aria-hidden="true" focusable="false">
      {/* crescent moon the cat is resting on */}
      <path d="M8 84 C28 66 118 66 142 84 C118 96 28 96 8 84 Z" fill="#ffe9a8" stroke="#e5b94b" strokeWidth="2" />
      <ellipse cx="75" cy="74" rx="40" ry="18" fill="#fff8fc" stroke={ink} strokeWidth="2.2" />
      <path className="zag-tail" d="M112 76 C132 74 138 58 128 50" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round" />
      <path className="zag-tail" d="M112 76 C132 74 138 58 128 50" fill="none" stroke="#fff8fc" strokeWidth="4.5" strokeLinecap="round" />
      <g className="zag-head">
        <path d="M44 38 L49 10 L70 26 Z" fill="#fff8fc" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M50 32 L53 19 L63 26 Z" fill="#ffb3cf" />
        <path d="M106 38 L101 10 L80 26 Z" fill="#fff8fc" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M100 32 L97 19 L87 26 Z" fill="#ffb3cf" />
        <ellipse cx="75" cy="48" rx="34" ry="27" fill="#fff8fc" stroke={ink} strokeWidth="2.2" />
        <ellipse cx="50" cy="56" rx="6.5" ry="4" fill="#ffb3cf" opacity="0.65" />
        <ellipse cx="100" cy="56" rx="6.5" ry="4" fill="#ffb3cf" opacity="0.65" />
        <g fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round">
          {happy ? (
            <>
              <path d="M54 50 Q62 41 70 50" />
              <path d="M80 50 Q88 41 96 50" />
            </>
          ) : (
            <>
              <path d="M54 47 Q62 54 70 47" />
              <path d="M80 47 Q88 54 96 47" />
            </>
          )}
        </g>
        <path d="M72.5 57 L77.5 57 L75 60 Z" fill="#ff8fb8" />
        <path d="M75 60 L75 62 M75 62 Q71 66 68 63 M75 62 Q79 66 82 63" fill="none" stroke={ink} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M38 55 L24 52 M38 59 L25 61 M112 55 L126 52 M112 59 L125 61" stroke="#b79ae0" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {happy ? null : (
        <g fill="#8b6fd0" fontFamily="system-ui, sans-serif" fontWeight="700">
          <text className="zag-z" x="112" y="26" fontSize="13">z</text>
          <text className="zag-z zag-z2" x="123" y="16" fontSize="10">z</text>
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ component */

export default function AgeCalculator() {
  const { t, i18n } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;
  const lang = i18n?.language || "en";

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [compareOn, setCompareOn] = useState(false);
  const [compareDate, setCompareDate] = useState(() => toInputDate(new Date()));
  const [now, setNow] = useState(() => new Date());
  const [copied, setCopied] = useState(false);

  const birth = useMemo(() => parseLocal(birthDate, birthTime), [birthDate, birthTime]);
  const compare = useMemo(() => (compareOn ? parseLocal(compareDate, "00:00") : null), [compareOn, compareDate]);
  const live = !compareOn && birth !== null;

  useEffect(() => {
    if (!live) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [live]);

  const target = compareOn ? compare : now;
  const tooEarly = Boolean(birth && target && target.getTime() < birth.getTime());
  const invalidDate = birthDate !== "" && !birth;
  const result = birth && target && !tooEarly ? measure(birth, target) : null;
  const upcoming = birth && target && !tooEarly ? nextBirthday(birth, target) : null;

  const nf = useMemo(() => new Intl.NumberFormat(lang), [lang]);
  const fmt = (n: number) => nf.format(n);
  const weekday = (d: Date) => new Intl.DateTimeFormat(lang, { weekday: "long" }).format(d);
  const longDate = (d: Date) => new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(d);

  const moonCycles = result ? result.totals.days / SYNODIC_MONTH : 0;
  const sunOrbits = result ? result.totals.days / 365.2425 : 0;
  const isBirthday = Boolean(upcoming && upcoming.daysLeft === 0 && result && result.parts.years > 0);

  const labels = {
    years: tr("tool.age.years", "years"),
    months: tr("tool.age.months", "months"),
    weeks: tr("tool.age.weeks", "weeks"),
    days: tr("tool.age.days", "days"),
    hours: tr("tool.age.hours", "hours"),
    minutes: tr("tool.age.minutes", "minutes"),
    seconds: tr("tool.age.seconds", "seconds"),
  };

  const totalsList = result
    ? ([
        ["months", result.totals.months],
        ["weeks", result.totals.weeks],
        ["days", result.totals.days],
        ["hours", result.totals.hours],
        ["minutes", result.totals.minutes],
        ["seconds", result.totals.seconds],
      ] as const)
    : [];

  const copySummary = async () => {
    if (!result) return;
    const p = result.parts;
    const lines = [
      `${tr("tool.age.yourAge", "Your age")}: ${fmt(p.years)} ${labels.years}, ${p.months} ${labels.months}, ${p.days} ${labels.days}, ${p.hours} ${labels.hours}, ${p.minutes} ${labels.minutes}, ${p.seconds} ${labels.seconds}`,
      ...totalsList.map(([k, v]) => `${labels[k]}: ${fmt(v)}`),
    ];
    const ok = await copyToClipboard(lines.join("\n"));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const reset = () => {
    setBirthDate("");
    setBirthTime("");
    setCompareOn(false);
    setCompareDate(toInputDate(new Date()));
  };

  const RING = 2 * Math.PI * 46;
  const card =
    "rounded-3xl border border-white/70 bg-white/65 p-5 sm:p-7 shadow-[0_24px_60px_-30px_rgba(13,148,136,0.5)] ring-1 ring-teal-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 dark:ring-teal-300/10";
  const label = "mb-1.5 block text-xs font-semibold text-ink-600 dark:text-ink-300";
  const field =
    "input w-full rounded-xl border-teal-100 bg-white/80 text-base transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200/70 dark:border-teal-900/60 dark:bg-slate-950/60";

  return (
    <div className="zag-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-8">
      <style>{`
        @keyframes zag-aurora-a { 0%,100% { transform: translate3d(0,0,0) rotate(0deg) scale(1); } 50% { transform: translate3d(60px,30px,0) rotate(8deg) scale(1.12); } }
        @keyframes zag-aurora-b { 0%,100% { transform: translate3d(0,0,0) rotate(0deg) scale(1.05); } 50% { transform: translate3d(-70px,-20px,0) rotate(-10deg) scale(0.95); } }
        @keyframes zag-aurora-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,-50px,0) scale(1.15); } }
        @keyframes zag-spin { to { transform: rotate(360deg); } }
        @keyframes zag-twinkle { 0%,100% { opacity: 0.2; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes zag-shoot { 0%,78% { opacity: 0; transform: translate3d(0,0,0) rotate(-24deg); } 82% { opacity: 1; } 100% { opacity: 0; transform: translate3d(-340px,150px,0) rotate(-24deg); } }
        @keyframes zag-pop { 0% { transform: translateY(5px); opacity: 0.35; } 100% { transform: none; opacity: 1; } }
        @keyframes zag-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.7); opacity: 0.35; } }
        @keyframes zag-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes zag-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
        @keyframes zag-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
        @keyframes zag-z { 0% { transform: translate(0,6px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(6px,-9px); opacity: 0; } }
        @keyframes zag-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        .zag-aurora { will-change: transform; }
        .zag-aurora-a { animation: zag-aurora-a 24s ease-in-out infinite; }
        .zag-aurora-b { animation: zag-aurora-b 30s ease-in-out infinite; }
        .zag-aurora-c { animation: zag-aurora-c 27s ease-in-out infinite; }
        .zag-orbit { transform-origin: 50% 50%; animation: zag-spin linear infinite; }
        .zag-star { position: absolute; animation: zag-twinkle ease-in-out infinite; }
        .zag-shoot { position: absolute; top: 8%; right: 6%; width: 120px; height: 2px; border-radius: 2px; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95)); animation: zag-shoot 11s ease-in infinite; }
        .zag-pop { display: inline-block; animation: zag-pop 0.35s ease-out; }
        .zag-live { animation: zag-pulse 1.4s ease-in-out infinite; }
        .zag-rise { animation: zag-rise 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .zag-cat .zag-head { transform-origin: 75px 62px; animation: zag-bob 4s ease-in-out infinite; }
        .zag-cat .zag-tail { transform-origin: 112px 76px; animation: zag-tail 3s ease-in-out infinite; }
        .zag-cat .zag-z { animation: zag-z 2.8s ease-in-out infinite; }
        .zag-cat .zag-z2 { animation-delay: -1.4s; }
        .zag-shine { position: relative; overflow: hidden; }
        .zag-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%); transform: translateX(-130%); animation: zag-shine 4.5s ease-in-out infinite; }
        .zag-ring { transition: stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1); }
        @media (prefers-reduced-motion: reduce) {
          .zag-aurora, .zag-orbit, .zag-star, .zag-shoot, .zag-pop, .zag-live, .zag-rise, .zag-cat *, .zag-shine::after, .zag-ring { animation: none !important; transition: none !important; }
          .zag-shoot { display: none; }
        }
      `}</style>

      {/* animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-cyan-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950" />
        <div className="zag-aurora zag-aurora-a absolute -left-24 -top-20 h-96 w-[34rem] rounded-full bg-gradient-to-r from-teal-300/50 to-emerald-200/40 blur-3xl dark:from-teal-400/25 dark:to-emerald-500/20" />
        <div className="zag-aurora zag-aurora-b absolute -right-28 top-1/4 h-[26rem] w-[30rem] rounded-full bg-gradient-to-l from-amber-200/60 to-orange-200/40 blur-3xl dark:from-amber-400/15 dark:to-orange-500/15" />
        <div className="zag-aurora zag-aurora-c absolute -bottom-32 left-1/4 h-80 w-[28rem] rounded-full bg-gradient-to-r from-sky-200/60 to-indigo-200/40 blur-3xl dark:from-sky-500/20 dark:to-indigo-500/20" />
        <svg className="absolute -right-40 -top-40 h-[44rem] w-[44rem] text-teal-500/40 dark:text-teal-200/20" viewBox="0 0 400 400" fill="none" stroke="currentColor">
          <g className="zag-orbit" style={{ animationDuration: "120s" }}>
            <circle cx="200" cy="200" r="190" strokeWidth="1" strokeDasharray="2 7" />
            <circle cx="390" cy="200" r="6" fill="currentColor" stroke="none" />
          </g>
          <g className="zag-orbit" style={{ animationDuration: "80s", animationDirection: "reverse" }}>
            <circle cx="200" cy="200" r="140" strokeWidth="1" strokeDasharray="1 6" />
            <circle cx="200" cy="60" r="5" fill="currentColor" stroke="none" />
          </g>
          <g className="zag-orbit" style={{ animationDuration: "50s" }}>
            <circle cx="200" cy="200" r="90" strokeWidth="1" strokeDasharray="1 5" />
            <circle cx="110" cy="200" r="4" fill="currentColor" stroke="none" />
          </g>
        </svg>
        {BG_STARS.map((s, index) => (
          <svg
            key={`star-${index}`}
            className="zag-star text-amber-300 dark:text-yellow-100"
            viewBox="0 0 24 24"
            width={s.size}
            height={s.size}
            fill="currentColor"
            style={{ left: `${s.left}%`, top: `${s.top}%`, animationDuration: `${3 + (index % 3)}s`, animationDelay: `${s.delay}s` } as CSSProperties}
          >
            <path d="M12 1 L14 9.5 L23 12 L14 14.5 L12 23 L10 14.5 L1 12 L10 9.5 Z" />
          </svg>
        ))}
        <span className="zag-shoot hidden dark:block" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        {/* ------------------------------------------------ inputs */}
        <section className={`${card} lg:sticky lg:top-24 lg:self-start`} aria-label={tr("tool.age.birthDate", "Date of birth")}>
          <div className="mb-4 flex items-end justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-800 dark:text-ink-100">
              <CalendarDays className="h-4 w-4 text-teal-500" aria-hidden="true" />
              {tr("tool.age.birthDate", "Date of birth")}
            </h2>
            <SleepyCat happy={Boolean(result)} />
          </div>

          <label htmlFor="age-birth-date" className={label}>
            {tr("tool.age.birthDate", "Date of birth")}
          </label>
          <input
            id="age-birth-date"
            type="date"
            min="1900-01-01"
            max={toInputDate(new Date())}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={field}
          />

          <label htmlFor="age-birth-time" className={`${label} mt-3`}>
            {tr("tool.age.birthTime", "Time of birth (optional)")}
          </label>
          <input id="age-birth-time" type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} className={field} />

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-600 dark:text-ink-300">
            <input type="checkbox" checked={compareOn} onChange={(e) => setCompareOn(e.target.checked)} className="h-4 w-4 accent-teal-500" />
            {tr("tool.age.compare", "Calculate age on a specific date")}
          </label>
          {compareOn && (
            <div className="zag-rise mt-2">
              <label htmlFor="age-compare-date" className={label}>
                {tr("tool.age.compareDate", "Age on")}
              </label>
              <input id="age-compare-date" type="date" min="1900-01-01" value={compareDate} onChange={(e) => setCompareDate(e.target.value)} className={field} />
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBirthDate("1995-01-15")}
              className="zag-shine btn rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-400 px-4 text-white shadow-lg shadow-teal-400/30 transition hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {tr("tool.age.example", "Try an example")}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={!birthDate && !birthTime && !compareOn}
              className="btn rounded-full border border-teal-200 bg-white/80 px-4 text-teal-800 transition hover:-translate-y-0.5 hover:bg-teal-50 disabled:opacity-50 dark:border-teal-800 dark:bg-slate-900/70 dark:text-teal-200"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {tr("tool.age.clear", "Clear")}
            </button>
          </div>

          {invalidDate && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              {tr("tool.age.errInvalid", "Enter a valid date of birth.")}
            </p>
          )}
          {tooEarly && (
            <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              {tr("tool.age.errFuture", "The date of birth must be before the date you are comparing to.")}
            </p>
          )}
          <p className="mt-4 text-[0.7rem] leading-4 text-ink-500 dark:text-ink-400">
            {tr("tool.age.privacy", "Calculated in your browser. Nothing is sent or saved.")}
          </p>
        </section>

        {/* ------------------------------------------------ results */}
        <div className="space-y-6">
          {!result ? (
            <section className={`${card} flex min-h-64 flex-col items-center justify-center text-center`}>
              <Clock className="h-12 w-12 text-teal-400" aria-hidden="true" />
              <p className="mt-3 max-w-sm text-sm leading-6 text-ink-600 dark:text-ink-300">
                {tr("tool.age.empty", "Pick your date of birth to see your age down to the second.")}
              </p>
            </section>
          ) : (
            <>
              <section className={`${card} zag-rise`} aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-ink-800 dark:text-ink-100">{tr("tool.age.yourAge", "Your age")}</h2>
                  {live && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <span className="zag-live h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                      {tr("tool.age.live", "Live")}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-5">
                  {(
                    [
                      ["years", result.parts.years, "from-teal-500 to-emerald-500"],
                      ["months", result.parts.months, "from-amber-500 to-orange-500"],
                      ["days", result.parts.days, "from-sky-500 to-indigo-500"],
                    ] as const
                  ).map(([key, value, grad]) => (
                    <div key={key} className="rounded-2xl bg-white/70 p-4 text-center shadow-sm dark:bg-slate-950/40 sm:p-7">
                      <p className={`bg-gradient-to-br ${grad} bg-clip-text text-5xl font-extrabold tabular-nums leading-none text-transparent sm:text-7xl`}>{fmt(value)}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{labels[key]}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
                  {(
                    [
                      ["hours", result.parts.hours],
                      ["minutes", result.parts.minutes],
                      ["seconds", result.parts.seconds],
                    ] as const
                  ).map(([k, v], i) => (
                    <div key={k} className="flex items-center gap-2 sm:gap-3">
                      {i > 0 && <span className="text-2xl font-bold text-teal-500/70 sm:text-4xl">:</span>}
                      <div className="min-w-[4.6rem] rounded-2xl bg-slate-900 px-3 py-3 text-center shadow-lg shadow-teal-900/20 ring-1 ring-teal-300/20 dark:bg-black/40 sm:min-w-[7rem] sm:py-4">
                        <span key={k === "seconds" ? v : "static"} className={`block font-mono text-4xl font-bold tabular-nums text-teal-300 sm:text-6xl ${k === "seconds" ? "zag-pop" : ""}`}>
                          {String(v).padStart(2, "0")}
                        </span>
                        <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wider text-teal-100/70">{labels[k]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`${card} zag-rise`} style={{ animationDelay: "0.08s" }}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-ink-800 dark:text-ink-100">{tr("tool.age.totals", "Your life in numbers")}</h2>
                  <button
                    type="button"
                    onClick={copySummary}
                    className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-50 dark:border-teal-800 dark:bg-slate-900/70 dark:text-teal-200"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                    {copied ? tr("tool.age.copied", "Copied") : tr("tool.age.copy", "Copy results")}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {totalsList.map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-white/70 bg-white/70 p-4 text-center dark:border-white/5 dark:bg-slate-950/40 sm:p-5">
                      <p className="text-2xl font-extrabold tabular-nums text-teal-700 dark:text-teal-300 sm:text-3xl">
                        {key === "seconds" && live ? (
                          <span key={value} className="zag-pop">
                            {fmt(value)}
                          </span>
                        ) : (
                          fmt(value)
                        )}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-ink-500 dark:text-ink-400">{labels[key]}</p>
                    </div>
                  ))}
                </div>
              </section>

              {upcoming && birth && (
                <section className={`${card} zag-rise grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center`} style={{ animationDelay: "0.16s" }}>
                  <div className="relative mx-auto h-40 w-40">
                    <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90" aria-hidden="true">
                      <circle cx="55" cy="55" r="46" fill="none" strokeWidth="9" className="stroke-amber-100 dark:stroke-amber-900/40" />
                      <circle
                        cx="55"
                        cy="55"
                        r="46"
                        fill="none"
                        strokeWidth="9"
                        strokeLinecap="round"
                        className="zag-ring stroke-amber-500"
                        strokeDasharray={RING}
                        strokeDashoffset={RING * (1 - upcoming.progress)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <Cake className="h-6 w-6 text-amber-500" aria-hidden="true" />
                      <span className="text-3xl font-extrabold tabular-nums text-ink-900 dark:text-ink-100">{isBirthday ? "🎉" : fmt(upcoming.daysLeft)}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-ink-800 dark:text-ink-100">{tr("tool.age.nextBirthday", "Next birthday")}</h2>
                    <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-ink-100">
                      {isBirthday ? tr("tool.age.today", "Today is the birthday!") : `${weekday(upcoming.next)}, ${longDate(upcoming.next)}`}
                    </p>
                    {!isBirthday && (
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        {fmt(upcoming.daysLeft)} {tr("tool.age.daysToGo", "days to go")}
                      </p>
                    )}
                    <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-xl bg-white/70 p-2.5 dark:bg-slate-950/40">
                        <dt className="text-ink-500 dark:text-ink-400">{tr("tool.age.bornOn", "Born on a")}</dt>
                        <dd className="mt-0.5 font-bold text-ink-900 dark:text-ink-100">{weekday(birth)}</dd>
                      </div>
                      <div className="rounded-xl bg-white/70 p-2.5 dark:bg-slate-950/40">
                        <dt className="text-ink-500 dark:text-ink-400">{tr("tool.age.moons", "Moon cycles")}</dt>
                        <dd className="mt-0.5 font-bold tabular-nums text-ink-900 dark:text-ink-100">{fmt(Math.floor(moonCycles))}</dd>
                      </div>
                      <div className="rounded-xl bg-white/70 p-2.5 dark:bg-slate-950/40">
                        <dt className="text-ink-500 dark:text-ink-400">{tr("tool.age.orbits", "Trips around the Sun")}</dt>
                        <dd className="mt-0.5 font-bold tabular-nums text-ink-900 dark:text-ink-100">{sunOrbits.toFixed(2)}</dd>
                      </div>
                    </dl>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
