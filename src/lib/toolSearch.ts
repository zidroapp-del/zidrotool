import type { Tool } from "@/types";

/**
 * Tool search used by the /tools page and the homepage search box.
 * - ignores upper/lower case and accents (cafe = Café), works with Arabic and other scripts
 * - every typed word must match (name, keywords, tags, category, description)
 * - small typing mistakes still find the tool ("compresor" finds "compressor")
 * - results are ranked: name starts with the text > a word starts with it > contains it > others
 */

const MARKS = /[̀-ًͯ-ٰٟـ]/g;

export const norm = (s: string): string =>
  s
    .normalize("NFD")
    .replace(MARKS, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export interface SearchEntry {
  tool: Tool;
  name: string;
  nName: string;
  nameWords: string[];
  keywords: string[];
  nSlug: string;
  nCat: string;
  nDesc: string;
}

export interface SearchHit {
  tool: Tool;
  name: string;
  score: number;
}

export function buildIndex(tools: Tool[], t: (key: string) => string, catName: (slug: string) => string): SearchEntry[] {
  return tools.map((tool) => {
    const name = String(t(tool.nameKey));
    const nName = norm(name);
    return {
      tool,
      name,
      nName,
      nameWords: nName.split(" ").filter(Boolean),
      keywords: [...(tool.keywords || []), ...(tool.tags || [])].map(norm).filter(Boolean),
      nSlug: norm(tool.slug.replace(/-/g, " ")),
      nCat: norm(catName(tool.category)),
      nDesc: norm(String(t(tool.descKey))),
    };
  });
}

/** Edit distance, stops early when it is bigger than `max`. */
function within(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** "img" -> "image": letters appear in order */
function isSubsequence(small: string, big: string): boolean {
  let i = 0;
  for (let j = 0; j < big.length && i < small.length; j++) if (big[j] === small[i]) i++;
  return i === small.length;
}

function scoreTerm(e: SearchEntry, term: string): number {
  let s = 0;
  if (e.nName.startsWith(term)) s = Math.max(s, 70);
  if (e.nameWords.some((w) => w.startsWith(term))) s = Math.max(s, 55);
  if (e.nName.includes(term)) s = Math.max(s, 40);
  if (e.keywords.some((k) => k.startsWith(term) || k.split(" ").some((w) => w.startsWith(term)))) s = Math.max(s, 34);
  if (e.keywords.some((k) => k.includes(term))) s = Math.max(s, 24);
  if (e.nSlug.includes(term)) s = Math.max(s, 20);
  if (e.nCat.includes(term)) s = Math.max(s, 12);
  if (e.nDesc.includes(term)) s = Math.max(s, 8);
  if (s === 0 && term.length >= 3 && term.length <= 5 && e.nameWords.some((w) => w.length > term.length && w[0] === term[0] && isSubsequence(term, w))) s = 10;
  if (s === 0 && term.length >= 4) {
    const max = term.length >= 7 ? 2 : 1;
    const pool = [...e.nameWords, ...e.keywords.flatMap((k) => k.split(" "))];
    if (pool.some((w) => w.length >= 3 && within(term, w, max) <= max)) s = 14;
  }
  return s;
}

export function runSearch(index: SearchEntry[], query: string, limit = 999): SearchHit[] {
  const q = norm(query);
  if (!q) return [];
  const terms = q.split(" ");
  const hits: SearchHit[] = [];
  for (const e of index) {
    let total = 0;
    let ok = true;
    for (const term of terms) {
      const s = scoreTerm(e, term);
      if (!s) { ok = false; break; }
      total += s;
    }
    if (!ok) continue;
    if (e.nName === q) total += 60;
    else if (e.nName.startsWith(q)) total += 25;
    total += (e.tool.popularity || 0) / 100;
    hits.push({ tool: e.tool, name: e.name, score: total });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

/** Best tool name to suggest when nothing was found ("Did you mean …"). */
export function didYouMean(index: SearchEntry[], query: string): string | null {
  const q = norm(query);
  if (q.length < 3) return null;
  let best: { name: string; d: number } | null = null;
  for (const e of index) {
    const cands = [e.nName, ...e.nameWords];
    for (const c of cands) {
      const max = Math.max(2, Math.floor(q.length / 3));
      const d = within(q, c, max);
      if (d <= max && (!best || d < best.d)) best = { name: e.name, d };
    }
  }
  return best ? best.name : null;
}

/** Wraps the part of `text` that matches `query` (ignoring case and accents) in <mark>. Returns plain parts. */
export function splitMatch(text: string, query: string): { text: string; hit: boolean }[] {
  const q = norm(query);
  if (!q) return [{ text, hit: false }];
  const chars = [...text];
  let normStr = "";
  const map: number[] = []; // normalized char index -> original char index
  chars.forEach((ch, i) => {
    const n = ch.normalize("NFD").replace(MARKS, "").toLocaleLowerCase();
    for (const c of n) { normStr += c; map.push(i); }
  });
  const marked = new Array(chars.length).fill(false);
  for (const term of q.split(" ")) {
    if (!term) continue;
    const at = normStr.indexOf(term);
    if (at === -1) continue;
    for (let k = at; k < at + term.length; k++) marked[map[k]] = true;
  }
  const out: { text: string; hit: boolean }[] = [];
  chars.forEach((ch, i) => {
    const last = out[out.length - 1];
    if (last && last.hit === marked[i]) last.text += ch;
    else out.push({ text: ch, hit: marked[i] });
  });
  return out;
}

/* ---- recent searches (shared with the ⌘K dialog) ---- */
const RECENT_KEY = "zidrotool-recent-searches";

export function loadRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}
export function saveRecent(q: string): string[] {
  const v = q.trim();
  if (v.length < 2) return loadRecent();
  const next = [v, ...loadRecent().filter((s) => s.toLocaleLowerCase() !== v.toLocaleLowerCase())].slice(0, 8);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}
export function clearRecent(): void {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
}
