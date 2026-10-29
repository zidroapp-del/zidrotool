import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AlignLeft, BarChart3, Check, Clock, Copy, Info, Layers, RotateCcw, Search, Type } from "lucide-react";
import { SeoToolShell, seoBtn, seoCard, seoField } from "@/components/SeoToolShell";

/**
 * Keyword density checker / keyword counter.
 * Counts single words and 2–3 word phrases, can ignore common words, and checks one target keyword
 * (how many times, density, whether it appears early). Everything runs in the browser.
 * Density is shown for editing. It is not a ranking factor and no "perfect %" is promised.
 */
interface Props { slug?: string }

const STOP = new Set((
  "a an the and or but if so of at by for with about to from in on off over under as is are was were be been being it its this that these those i you he she we they me him her us them my your his our their " +
  "not no yes do does did done have has had will would can could should may might must than then there here what which who whom when where why how all any both each few more most other some such only own same too very just also into out up down " +
  "le la les un une des du de et ou mais si donc que qui dans sur pour par avec sans est sont été être au aux ce cet cette ces il elle nous vous ils elles je tu on ne pas plus " +
  "der die das ein eine und oder aber nicht mit von zu auf ist sind war für im den dem des ich du er sie es wir ihr " +
  "el los las una unos unas y o pero que en de del con por para es son fue al lo se su sus " +
  "il lo gli uno di da e ma che per con non è sono un una nel della " +
  "في من على الى إلى عن مع هذا هذه ذلك التي الذي و أو ثم لا ما هو هي كان"
).split(/\s+/));

const SAMPLE =
  "Keyword density is the share of times a keyword appears in a text. A keyword density checker counts every word and every phrase, so you can see what your page talks about most. Keyword density matters less than clear writing: write for people first, then check the numbers to find words you repeat too often.";

type Row = { phrase: string; count: number; pct: number };

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []).map((w) => w.replace(/’/g, "'"));
}

function countPhrases(words: string[], n: number, skipStop: boolean, minLen: number): Row[] {
  const map = new Map<string, number>();
  const total = Math.max(0, words.length - n + 1);
  for (let i = 0; i < total; i++) {
    const slice = words.slice(i, i + n);
    if (n === 1) {
      if (skipStop && STOP.has(slice[0])) continue;
      if (slice[0].length < minLen) continue;
    } else if (skipStop && (STOP.has(slice[0]) || STOP.has(slice[n - 1]))) continue;
    const key = slice.join(" ");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const base = Math.max(1, total);
  return [...map.entries()]
    .filter(([, c]) => n === 1 || c >= 2)
    .map(([phrase, count]) => ({ phrase, count, pct: (count / base) * 100 }))
    .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase))
    .slice(0, 40);
}

export default function KeywordDensity({ slug = "" }: Props) {
  const counterMode = slug === "keyword-counter";
  const [text, setText] = useState("");
  const [n, setN] = useState<1 | 2 | 3>(1);
  const [skipStop, setSkipStop] = useState(true);
  const [target, setTarget] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const words = useMemo(() => tokenize(text), [text]);
  const rows = useMemo(() => countPhrases(words, n, skipStop, 3), [words, n, skipStop]);
  const unique = useMemo(() => new Set(words).size, [words]);
  const sentences = useMemo(() => (text.match(/[^.!?؟]+[.!?؟]+|[^.!?؟]+$/g) ?? []).filter((s) => s.trim()).length, [text]);

  const tw = useMemo(() => tokenize(target), [target]);
  const targetInfo = useMemo(() => {
    if (!tw.length || !words.length) return null;
    let count = 0;
    let first = -1;
    for (let i = 0; i + tw.length <= words.length; i++) {
      let ok = true;
      for (let k = 0; k < tw.length; k++) if (words[i + k] !== tw[k]) { ok = false; break; }
      if (ok) { count++; if (first < 0) first = i; }
    }
    const density = (count / Math.max(1, words.length - tw.length + 1)) * 100;
    return { count, density, first };
  }, [tw, words]);

  const max = rows[0]?.count ?? 1;
  const copyCsv = async () => {
    const csv = ["phrase,count,percent", ...rows.map((r) => `"${r.phrase}",${r.count},${r.pct.toFixed(2)}`)].join("\n");
    try { await navigator.clipboard.writeText(csv); setCopied(true); timer.current = window.setTimeout(() => setCopied(false), 1400); } catch { /* ignore */ }
  };

  const verdict = (d: number, c: number) => {
    if (c === 0) return { tone: "text-amber-700 dark:text-amber-300", box: "border-amber-200 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-400/10", text: "Not found in the text." };
    if (d > 3.5) return { tone: "text-rose-700 dark:text-rose-300", box: "border-rose-200 bg-rose-50/80 dark:border-rose-400/20 dark:bg-rose-400/10", text: "Very frequent. Check that it still reads naturally." };
    if (d >= 0.5) return { tone: "text-emerald-700 dark:text-emerald-300", box: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10", text: "Looks natural for most pages." };
    return { tone: "text-amber-700 dark:text-amber-300", box: "border-amber-200 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-400/10", text: "Rare. Only add it where it fits the meaning." };
  };

  const TONES = [
    "from-indigo-500 to-violet-500", "from-sky-500 to-cyan-400", "from-fuchsia-500 to-pink-500", "from-emerald-500 to-teal-400", "from-amber-500 to-orange-400",
  ];
  const CLOUD = [
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-200", "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200",
    "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-400/15 dark:text-fuchsia-200", "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
    "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  ];
  const stats = [
    { k: "Words", v: words.length, Icon: Type, tone: TONES[0] },
    { k: "Unique words", v: unique, Icon: Layers, tone: TONES[1] },
    { k: "Sentences", v: sentences, Icon: AlignLeft, tone: TONES[2] },
    { k: "Characters", v: text.length, Icon: BarChart3, tone: TONES[3] },
    { k: "Read time", v: `${Math.max(words.length ? 1 : 0, Math.ceil(words.length / 220))} min`, Icon: Clock, tone: TONES[4] },
  ];
  const cloud = rows.slice(0, 18);

  return (
    <SeoToolShell>
      <div className={`${seoCard} zseo-rise flex items-center gap-3 p-4 sm:p-5`}>
        <span className="zseo-float flex h-12 w-12 items-center justify-center gap-[3px] rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 p-3 text-white shadow-lg shadow-indigo-500/30" aria-hidden="true">
          <span className="zseo-eq flex h-full items-end gap-[3px]"><i className="bg-white" /><i className="bg-white/80" /><i className="bg-white" /><i className="bg-white/70" /><i className="bg-white/90" /></span>
        </span>
        <div>
          <p className="text-base font-extrabold text-slate-900 dark:text-white">{counterMode ? "Keyword counter" : "Keyword density checker"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Words, 2–3 word phrases and one keyword · runs in your browser</p>
        </div>
      </div>

      <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 1 } as CSSProperties}>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="kd-text">{counterMode ? "Text to count keywords in" : "Your content"}</label>
        <textarea id="kd-text" value={text} onChange={(e) => setText(e.target.value)} className={`${seoField} min-h-[190px] resize-y`} placeholder="Paste your article, page copy or product description here…" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={seoBtn} onClick={() => setText(SAMPLE)}>Try an example</button>
          <button type="button" className={seoBtn} onClick={() => setText("")} disabled={!text}><RotateCcw className="h-4 w-4" />Clear</button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map(({ k, v, Icon, tone }, n) => (
            <div key={k} className="zseo-rise rounded-2xl border border-white/80 bg-white/70 p-3 text-center dark:border-white/10 dark:bg-white/5" style={{ "--i": n + 2 } as CSSProperties}>
              <span className={`zseo-ico mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-md`} style={{ "--i": n } as CSSProperties}><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{typeof v === "number" ? v.toLocaleString() : v}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 2 } as CSSProperties}>
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300" htmlFor="kd-target"><Search className="h-4 w-4" />Check one keyword or phrase</label>
        <input id="kd-target" type="text" value={target} onChange={(e) => setTarget(e.target.value)} className={`${seoField} sm:max-w-md`} placeholder="e.g. keyword density" />
        {targetInfo && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[["Times used", String(targetInfo.count)], ["Density", `${targetInfo.density.toFixed(2)}%`], ["First position (word)", targetInfo.first < 0 ? "–" : `#${targetInfo.first + 1}`]].map(([k, v], n) => (
              <div key={k} className="zseo-rise rounded-2xl border border-white/80 bg-white/70 p-3 text-center dark:border-white/10 dark:bg-white/5" style={{ "--i": n } as CSSProperties}>
                <p className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-3xl font-extrabold tabular-nums text-transparent dark:from-indigo-300 dark:to-violet-300">{v}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
              </div>
            ))}
            <p className={`rounded-xl border p-3 text-sm font-semibold sm:col-span-3 ${verdict(targetInfo.density, targetInfo.count).box} ${verdict(targetInfo.density, targetInfo.count).tone}`}>
              {verdict(targetInfo.density, targetInfo.count).text}
              {targetInfo.first >= 100 ? " It first appears after the first 100 words." : ""}
            </p>
          </div>
        )}
      </section>

      <section className={`${seoCard} zseo-rise p-4 sm:p-6`} style={{ "--i": 3 } as CSSProperties}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-indigo-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5" role="tablist" aria-label="Phrase length">
            {([1, 2, 3] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={n === k} onClick={() => setN(k)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${n === k ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow" : "text-slate-600 hover:text-indigo-700 dark:text-slate-300"}`}>
                {k === 1 ? "1 word" : `${k} words`}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={skipStop} onChange={(e) => setSkipStop(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
            Ignore common words (the, and, de, el…)
          </label>
        </div>

        {rows.length > 0 ? (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Word cloud">
              {cloud.map((r, i) => (
                <button key={r.phrase} type="button" onClick={() => setTarget(r.phrase)} className={`zseo-rise zseo-float rounded-full px-3 py-1 font-bold transition hover:scale-110 ${CLOUD[i % CLOUD.length]}`}
                  style={{ "--i": i, fontSize: `${0.74 + (r.count / max) * 0.7}rem` } as CSSProperties}>
                  {r.phrase}<sup className="ml-1 text-[10px] opacity-70">{r.count}</sup>
                </button>
              ))}
            </div>
            <div className="space-y-2" role="list">
              {rows.map((r, i) => (
                <button key={r.phrase} type="button" role="listitem" onClick={() => setTarget(r.phrase)} className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 text-left text-sm transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5">
                  <span className={`zseo-grow absolute inset-y-0 left-0 bg-gradient-to-r ${TONES[i % TONES.length]} opacity-15 transition-opacity group-hover:opacity-25`} style={{ width: `${(r.count / max) * 100}%`, "--i": Math.min(i, 12) } as CSSProperties} aria-hidden="true" />
                  <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${TONES[i % TONES.length]} text-[11px] font-extrabold text-white`}>{i + 1}</span>
                  <span className="relative min-w-0 flex-1 truncate font-semibold text-slate-900 dark:text-slate-100">{r.phrase}</span>
                  <span className="relative tabular-nums text-slate-700 dark:text-slate-200">{r.count}×</span>
                  <span className="relative w-14 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">{r.pct.toFixed(2)}%</span>
                </button>
              ))}
            </div>
            <button type="button" className={`${seoBtn} mt-4`} onClick={copyCsv}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy as CSV"}</button>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-indigo-300/70 p-5 text-center text-sm text-slate-500 dark:text-slate-400">
            {text.trim() ? (n === 1 ? "No words to list." : `No ${n}-word phrase appears twice or more yet.`) : "Paste some text above and your most used words will appear here."}
          </p>
        )}
      </section>

      <p className="flex items-start gap-2 px-2 text-xs text-slate-500 dark:text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Click a word or row to check it as your keyword. Density is a writing aid: search engines do not use a perfect percentage, so write for readers first and avoid forcing a keyword in.
      </p>
    </SeoToolShell>
  );
}
