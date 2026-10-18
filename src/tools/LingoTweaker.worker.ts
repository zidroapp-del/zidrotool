import init, { LtEngine } from "lingotweaker-wasm";

type CheckRequest = { id: number; text: string };

type WorkerResponse =
  | { id: number; type: "result"; corrected: string; issueCount: number }
  | { id: number; type: "error"; message: string };

const workerScope = self as unknown as {
  location: Location;
  addEventListener(type: "message", listener: (event: MessageEvent<CheckRequest>) => void): void;
  postMessage(message: WorkerResponse): void;
};

let enginePromise: Promise<LtEngine> | null = null;

async function getEngine(): Promise<LtEngine> {
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const wasmUrl = new URL("/grammar-checker/lt_wasm_bg.wasm", workerScope.location.origin);
    await init({ module_or_path: wasmUrl });

    const packUrl = new URL("/grammar-checker/en.pack", workerScope.location.origin);
    const response = await fetch(packUrl.href, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`English language data failed to load: HTTP ${response.status}`);
    }

    const pack = new Uint8Array(await response.arrayBuffer());
    return new LtEngine("en-US", pack, JSON.stringify({ today: new Date().toISOString() }));
  })().catch((error: unknown) => {
    enginePromise = null;
    throw error;
  });

  return enginePromise;
}

workerScope.addEventListener("message", (event) => {
  const { id, text } = event.data;
  void (async () => {
    try {
      if (typeof text !== "string") throw new Error("Invalid text sent to grammar checker.");
      const engine = await getEngine();
      const raw = JSON.parse(engine.check_json(text)) as { matches?: GrammarMatch[] };
      const matches = Array.isArray(raw.matches) ? raw.matches : [];

      // issueCount = number of edits actually applied (engine edits + rule edits).
      // Skipped, overlapping or filtered engine matches are NOT counted.
      const fromEngine = applyEdits(text, buildEngineEdits(text, matches));
      const fromRules = fixText(fromEngine.text);

      workerScope.postMessage({
        id,
        type: "result",
        corrected: fromRules.text,
        issueCount: fromEngine.applied + fromRules.applied,
      });
    } catch (error) {
      workerScope.postMessage({
        id,
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  })();
});

// ==== RULES-BEGIN ====
// Everything between RULES-BEGIN and RULES-END is pure TypeScript with no WASM,
// DOM or worker dependency, so the regression test can load it directly in Node.

/**
 * Unit of `range.start` / `range.end` returned by `lingotweaker-wasm`.
 * UNVERIFIED: the package source/docs were not available when this file was written.
 * "utf8" keeps the behaviour of the previous worker. For pure-ASCII text all units are
 * identical, so this only matters for text with accents, Arabic, emoji, etc.
 * To verify in the browser console of the running app, call
 * engine.check_json("café recieved"): start 6 => "utf8", start 5 => "utf16" or "codepoint".
 */
export type OffsetUnit = "utf8" | "utf16" | "codepoint";
export const ENGINE_OFFSET_UNIT: OffsetUnit = "utf8";

export type GrammarMatch = {
  range?: { start: number; end: number };
  suggestions?: Array<{ value?: string }>;
};
export type Edit = { start: number; end: number; text: string };

type Num = "1s" | "2" | "3s" | "pl";
type Form = "b" | "t" | "p";
type Tok = { raw: string; l: string; s: number; e: number; k: "w" | "n" | "p" };
type Verb = { b: string; t: string; p: string | null; pp: string | null; weak: boolean; noTense: boolean };

/* ------------------------------------------------------------------ word lists */

const words = (s: string): Set<string> => new Set(s.split(/\s+/).filter(Boolean));
const union = (...sets: Array<Set<string>>): Set<string> => new Set(sets.flatMap((s) => [...s]));

const DET = words(
  "the a an this these those my your his her its our their some any many few several all both each every no one two three four five six seven eight nine ten another",
);
const PREP = words(
  "of in on at to for with from by about into over under through during against between among without within upon onto toward towards than like as per via",
);
const WH = words("what where why when how which whose who whom");
const SUBORD = words("that if whether because although though unless while once since until after before as");
const OBJ = words("me him us them myself yourself himself herself itself themselves ourselves");
const BE = words("am is are was were be been being");
const BE_NEG = words("isn't aren't wasn't weren't ain't");
const DO = words("do does did don't doesn't didn't");
const MODAL = words(
  "can could will would shall should may might must can't couldn't won't wouldn't shouldn't cannot mustn't",
);
const STOP = union(
  PREP, WH, SUBORD, OBJ, BE, BE_NEG, DO, MODAL,
  words("and or but so nor not yet there here then also very too more most much such neither either"),
);
const ADV = words(
  "usually often always never sometimes rarely seldom also still just already really actually only even then now today yesterday tomorrow soon finally probably maybe frequently generally normally typically currently hardly almost quickly slowly later earlier recently suddenly again ever tonight",
);
const SUBJ_PRON: Record<string, Num> = {
  i: "1s", you: "2", we: "pl", they: "pl", he: "3s", she: "3s", it: "3s",
  everyone: "3s", everybody: "3s", someone: "3s", somebody: "3s", nobody: "3s",
  anyone: "3s", anybody: "3s", everything: "3s", something: "3s", nothing: "3s",
};
const PRON_ONLY = words("i you we they he she it");
const PRES_MARK = words(
  "today tonight now nowadays currently tomorrow every always usually often generally normally typically sometimes rarely seldom never daily weekly monthly frequently regularly",
);
const TIME_UNIT = words(
  "night week month year summer winter spring autumn weekend monday tuesday wednesday thursday friday saturday sunday morning evening semester century decade",
);
const PREP_BLOCK = words("than since until till from before after by on at in of for with to");
const SUBJ_TRIGGER = words(
  "suggest suggests suggested recommend recommends recommended insist insists insisted demand demands demanded require requires required propose proposes proposed important essential vital imperative wish wishes wished",
);
const COLLECTIVE = words(
  "staff team family class group police government committee audience crowd population public majority minority data media criteria phenomena couple council company army jury orchestra band board faculty",
);
const IRR_PL = words("people children men women mice feet teeth geese cattle");
const SING_S = words(
  "news series species mathematics physics economics politics athletics gymnastics statistics linguistics ethics",
);
const WEEKDAY = words("monday tuesday wednesday thursday friday saturday sunday");
const HAVE = words("have has had haven't hasn't hadn't");
const CLAUSE_WORDS = words("and but or because if that so although though");
const Q_WH = words("what where why how when");

/* ------------------------------------------------------------------ verb table */

// "*" = also a common noun/adjective (weak): a base form is only changed to the -s form
// when a present/habitual marker is in the same clause. "!" = never changed by tense cues.
const REGULAR =
  "finish explain arrive wait stay ask listen learn decide enjoy move* prepare create happen remember believe need want try live travel hope* visit* start* open* cook* clean* study* answer* walk* talk* work* play* help* use* love* call* watch* change* practice* show* like* close*";
const IRREGULAR =
  "go/goes/went/gone give/gives/gave/given take/takes/took/taken make/makes/made come/comes/came/come see/sees/saw/seen know/knows/knew/known get/gets/got say/says/said tell/tells/told think/thinks/thought find/finds/found buy/buys/bought bring/brings/brought write/writes/wrote/written eat/eats/ate/eaten drink/drinks/drank/drunk run/runs/ran/run speak/speaks/spoke/spoken sit/sits/sat stand/stands/stood begin/begins/began/begun leave/leaves/left keep/keeps/kept feel/feels/felt meet/meets/met send/sends/sent pay/pays/paid sleep/sleeps/slept teach/teaches/taught understand/understands/understood forget/forgets/forgot/forgotten choose/chooses/chose/chosen wear/wears/wore/worn win/wins/won lose/loses/lost sell/sells/sold hear/hears/heard build/builds/built draw/draws/drew/drawn fall/falls/fell/fallen grow/grows/grew/grown hold/holds/held sing/sings/sang/sung swim/swims/swam/swum throw/throws/threw/thrown wake/wakes/woke/woken catch/catches/caught spend/spends/spent ride/rides/rode/ridden have!/has/had";

const third = (b: string): string =>
  /(?:s|x|z|ch|sh|o)$/.test(b) ? b + "es" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ies" : b + "s";
const pastOf = (b: string): string =>
  /e$/.test(b) ? b + "d" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ied" : b + "ed";

const FORMS = new Map<string, { v: Verb; f: Form }>();
function addVerb(v: Verb): void {
  const list: Array<[Form, string | null]> = [["b", v.b], ["t", v.t], ["p", v.p]];
  for (const [f, w] of list) if (w && !FORMS.has(w)) FORMS.set(w, { v, f });
}
for (const w of REGULAR.split(" ")) {
  const weak = w.endsWith("*");
  const b = weak ? w.slice(0, -1) : w;
  addVerb({ b, t: third(b), p: pastOf(b), pp: null, weak, noTense: false });
}
for (const w of IRREGULAR.split(" ")) {
  const noTense = w.includes("!");
  const [b, t, p, pp] = w.replace("!", "").split("/");
  if (b && t && p) addVerb({ b, t, p, pp: pp ?? null, weak: false, noTense });
}

/* ------------------------------------------------------------------ tokens */

const TOKEN_RE = /\p{L}+(?:['’]\p{L}+)*|\d+(?:[.,]\d+)*|[,;:.!?]/gu;

export function tokenize(text: string): Tok[] {
  const out: Tok[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const raw = m[0];
    const s = m.index ?? 0;
    const k = /^\p{L}/u.test(raw) ? "w" : /^\d/.test(raw) ? "n" : "p";
    out.push({ raw, l: raw.toLowerCase().replace(/’/g, "'"), s, e: s + raw.length, k });
  }
  return out;
}

function splitSentences(tk: Tok[], text: string): Tok[][] {
  const out: Tok[][] = [];
  let cur: Tok[] = [];
  for (let i = 0; i < tk.length; i++) {
    const t = tk[i]!;
    const prev = tk[i - 1];
    const newline = prev !== undefined && text.slice(prev.e, t.s).includes("\n");
    const ended = prev !== undefined && prev.k === "p" && /^[.!?;]$/.test(prev.l);
    if (cur.length > 0 && (newline || ended)) {
      out.push(cur);
      cur = [];
    }
    cur.push(t);
  }
  if (cur.length > 0) out.push(cur);
  return out;
}

function matchCase(orig: string, repl: string): string {
  if (orig.length > 1 && orig === orig.toUpperCase() && /\p{L}/u.test(orig)) return repl.toUpperCase();
  if (/^\p{Lu}/u.test(orig)) return repl.charAt(0).toUpperCase() + repl.slice(1);
  return repl;
}

/** Replace an auxiliary keeping capitalization and the original apostrophe character. */
function setAux(raw: string, target: string): string {
  return matchCase(raw, raw.includes("’") ? target.replace("'", "’") : target);
}

const isW = (t: Tok | undefined): t is Tok => t !== undefined && t.k === "w";
const isAdv = (t: Tok | undefined): boolean => isW(t) && ADV.has(t.l);
const isBe = (l: string): boolean => l === "am" || l === "is" || l === "are" || l === "was" || l === "were";
const isAux = (t: Tok | undefined): boolean =>
  isW(t) && (isBe(t.l) || DO.has(t.l) || (MODAL.has(t.l) && !t.l.includes("'")) || t.l === "can't" || t.l === "won't");
const isVerbLike = (t: Tok | undefined): boolean =>
  isW(t) && (FORMS.has(t.l) || BE.has(t.l) || BE_NEG.has(t.l) || DO.has(t.l) || MODAL.has(t.l));
const BOUNDARY_WORDS = union(SUBORD, WH, words("and or but so"));
const isBoundary = (t: Tok | undefined): boolean =>
  t !== undefined && (t.k === "p" || BOUNDARY_WORDS.has(t.l));

/* ------------------------------------------------------------------ subjects */

/** Grammatical number of a noun head, or null when unknown/unsafe (then no edit is made). */
function nounNumber(raw: string, prevIsDet: boolean): Num | null {
  const w = raw.toLowerCase();
  if (w.length < 2) return null;
  if (STOP.has(w) || DET.has(w) || ADV.has(w) || FORMS.has(w) || COLLECTIVE.has(w)) return null;
  if (/ly$/.test(w) || /ing$/.test(w) || (w.length > 4 && /ed$/.test(w))) return null;
  if (IRR_PL.has(w)) return "pl";
  const endsS = /s$/.test(w) && !/(?:ss|us|is)$/.test(w) && !SING_S.has(w);
  if (/^\p{Lu}/u.test(raw) && /s$/.test(w) && !prevIsDet) return null; // "James", sentence-initial "Students"
  return endsS ? "pl" : "3s";
}

const isModifier = (t: Tok): boolean =>
  t.k === "n" ||
  (t.k === "w" && (DET.has(t.l) || !(STOP.has(t.l) || FORMS.has(t.l) || ADV.has(t.l) || t.l in SUBJ_PRON)));

type Found = { n: Num; np: number; b: number; compound: boolean };

/**
 * Finds the subject of the finite verb at `i`. The subject must sit directly after a clause
 * boundary (sentence start, comma, conjunction, that/if/whether/wh-word, optionally after fronted
 * adverbs). Adverbs between subject and verb are skipped. Anything else returns null (no edit).
 */
function findSubject(tk: Tok[], i: number): Found | null {
  let h = i - 1;
  while (h >= 0 && isAdv(tk[h])) h--;
  const head = tk[h];
  if (!head || head.k !== "w") return null;
  let n: Num | null;
  let np = h;
  const pron = SUBJ_PRON[head.l];
  if (pron) {
    n = pron;
  } else {
    let j = h - 1;
    let cnt = 0;
    while (j >= 0 && cnt < 4 && isModifier(tk[j]!)) { j--; cnt++; }
    np = j + 1;
    n = nounNumber(head.raw, np < h && DET.has(tk[np]!.l));
    if (!n) return null;
  }
  let compound = false;
  let b = np - 1;
  while (b >= 0 && isAdv(tk[b])) b--;
  const bt = tk[b];
  if (b >= 0 && !isBoundary(bt)) return null;
  if (bt && (bt.l === "and" || bt.l === "or") && bt.k === "w" && tk[b - 1]?.l !== ",") {
    // "A and B give": noun-phrase coordination (compound subject) or clause coordination?
    let a = b - 1;
    while (a >= 0 && !isBoundary(tk[a])) a--;
    const seg = tk.slice(a + 1, b);
    const clauseLike = seg.some((t) => isVerbLike(t) || (t.k === "w" && t.l.length > 4 && /ed$/.test(t.l)));
    if (seg.length > 0 && !clauseLike) {
      if (bt.l === "or" || seg.length > 4) return null;
      n = "pl";
      compound = true;
    }
  }
  return { n, np, b, compound };
}

/* ------------------------------------------------------------------ clause scope + cues */

function scopeStart(tk: Tok[], b: number): number {
  let s = b + 1;
  if (b >= 0 && tk[b]?.l === ",") {
    let a = b - 1;
    while (a >= 0 && !isBoundary(tk[a])) a--;
    const span = tk.slice(a + 1, b);
    if (span.length > 0 && span.length <= 6 && !span.some((t) => isVerbLike(t))) s = a + 1; // fronted adverbial
  }
  return s;
}

function scopeEnd(tk: Tok[], from: number): number {
  let e = from;
  while (e < tk.length && !isBoundary(tk[e]) && !isVerbLike(tk[e])) e++;
  return e;
}

type Cue = { past: boolean; pres: boolean; since: boolean };
function scanCue(tk: Tok[], a: number, b: number): Cue {
  const c: Cue = { past: false, pres: false, since: false };
  for (let x = Math.max(a, 0); x < Math.min(b, tk.length); x++) {
    const t = tk[x]!;
    if (t.k !== "w") continue;
    const prev = tk[x - 1]?.l ?? "";
    if (PRES_MARK.has(t.l)) c.pres = true;
    if (t.l === "since") c.since = true;
    if (t.l === "yesterday" && !PREP_BLOCK.has(prev)) c.past = true;
    if (t.l === "ago" && x > 0) c.past = true;
    if (t.l === "last" && TIME_UNIT.has(tk[x + 1]?.l ?? "") && !PREP_BLOCK.has(prev)) c.past = true;
  }
  return c;
}
const mergeCue = (a: Cue, b: Cue): Cue => ({ past: a.past || b.past, pres: a.pres || b.pres, since: a.since || b.since });

/* ------------------------------------------------------------------ edits */

export function applyEdits(text: string, edits: Edit[]): { text: string; applied: number } {
  const accepted: Edit[] = [];
  const clash = (a: Edit, b: Edit): boolean =>
    (a.start < b.end && b.start < a.end) || (a.start === b.start && a.end === b.end);
  for (const ed of edits) {
    if (!(Number.isInteger(ed.start) && Number.isInteger(ed.end))) continue;
    if (ed.start < 0 || ed.end < ed.start || ed.end > text.length) continue;
    if (text.slice(ed.start, ed.end) === ed.text) continue;
    if (accepted.some((a) => clash(a, ed))) continue; // earlier edits have priority
    accepted.push(ed);
  }
  accepted.sort((x, y) => y.start - x.start || y.end - x.end);
  let out = text;
  for (const ed of accepted) out = out.slice(0, ed.start) + ed.text + out.slice(ed.end);
  return { text: out, applied: accepted.length };
}

/* ------------------------------------------------------------------ per-sentence analysis */

type Info = { n: Num; past: boolean };
type Ctx = { n: Num; ss: number; b: number; inh: boolean; ip: boolean };

function analyze(tk: Tok[], out: Edit[]): void {
  const info = new Map<number, Info>();
  const isQ = tk[tk.length - 1]?.l === "?";
  const present = new Set(tk.map((t) => t.l));
  const ifLike = ["if", "wish", "as", "though", "unless", "whether", "suppose", "imagine"].some((w) => present.has(w));

  // Subject of a lexical verb: explicit, or inherited through "A verb ... and/or B-verb" coordination.
  const subjectFor = (i: number): Ctx | null => {
    const r = findSubject(tk, i);
    if (r) return { n: r.n, ss: scopeStart(tk, r.b), b: r.b, inh: false, ip: false };
    let h = i - 1;
    while (h >= 0 && isAdv(tk[h])) h--;
    const conj = tk[h];
    if (!conj || conj.k !== "w" || (conj.l !== "and" && conj.l !== "or")) return null;
    for (let f = h - 1; f >= 0; f--) {
      const x = tk[f]!;
      const known = info.get(f);
      if (known) return { n: known.n, ss: h + 1, b: h, inh: true, ip: known.past };
      if (x.k === "p" && x.l !== ",") return null;
      if (x.k === "w" && (BOUNDARY_WORDS.has(x.l) && x.l !== "and" && x.l !== "or")) return null;
      if (isVerbLike(x)) return null; // a verb without a known subject: do not guess
    }
    return null;
  };

      const isSubjunctiveVerb = (i: number): boolean => {
    // A subjunctive trigger should only protect a verb in its
    // own that-clause, not unrelated verbs elsewhere in the sentence.
    let thatIndex = -1;

    for (let x = i - 1; x >= 0; x--) {
      const t = tk[x]!;

      if (t.k === "p" && t.l !== ",") break;
      if (t.l === "and" || t.l === "but" || t.l === "so") break;

      if (t.l === "that") {
        thatIndex = x;
        break;
      }

      if (isVerbLike(t) && !SUBJ_TRIGGER.has(t.l)) break;
    }

    if (thatIndex < 0) return false;

    for (let x = thatIndex - 1; x >= 0; x--) {
      const t = tk[x]!;

      if (t.k === "p" && t.l !== ",") break;
      if (t.l === "and" || t.l === "but" || t.l === "so") break;

      if (SUBJ_TRIGGER.has(t.l)) return true;

      if (isVerbLike(t)) break;
    }

    return false;
  };
  // "My parents were waiting ... when I arrive": a when/while clause after a clearly past main clause.
  const whenPast = (c: Ctx, cue: Cue): boolean => {
    const bt = tk[c.b];
    if (c.inh || !bt || (bt.l !== "when" && bt.l !== "while") || cue.pres || cue.since) return false;
    let sawPast = false;
    for (let x = 0; x < c.b; x++) {
      const t = tk[x]!;
      if (t.k === "p" || MODAL.has(t.l) || SUBORD.has(t.l) || WH.has(t.l) || PRES_MARK.has(t.l)) return false;
      if (info.get(x)?.past) sawPast = true;
    }
    return sawPast;
  };

  // Past evidence from the neighbouring clause. Used ONLY to choose the repair when the present form is
  // already ungrammatical for its subject ("he say", "my mother cook"); valid present forms are never touched.
  const BLOCK_BETWEEN = words("that if whether because unless although though when while after before");
  const neighbourPast = (c: Ctx): boolean => {
    const bt = tk[c.b];
    if (c.inh || !bt) return false;
    if (bt.l === ",") {
      const lead = tk[0]?.l ?? "";
      if (lead !== "when" && lead !== "while" && lead !== "after" && lead !== "before" && lead !== "once") return false;
      let sawPast = false;
      for (let x = 1; x < c.b; x++) {
        const t = tk[x]!;
        if (t.k === "p" || MODAL.has(t.l) || PRES_MARK.has(t.l) || BLOCK_BETWEEN.has(t.l)) return false;
        if (info.get(x)?.past) sawPast = true;
      }
      return sawPast;
    }
    if (bt.l !== "and" && bt.l !== "but" && bt.l !== "so") return false;
    for (let x = c.b - 1; x >= 0; x--) {
      const known = info.get(x);
      if (known) return known.past;
      const t = tk[x]!;
      if (t.k === "w" && (MODAL.has(t.l) || BLOCK_BETWEEN.has(t.l))) return false;
    }
    return false;
  };

  // "I have saw" -> "I have seen": irregular past form directly after have/has/had.
  const participle = (i: number): void => {
    if (!findSubject(tk, i)) return;
    let j = i + 1;
    while (isAdv(tk[j])) j++;
    const nx = tk[j];
    const h = isW(nx) ? FORMS.get(nx.l) : undefined;
    if (nx && h && h.f === "p" && h.v.pp && h.v.pp !== nx.l) out.push({ start: nx.s, end: nx.e, text: matchCase(nx.raw, h.v.pp) });
  };

  // "I am living here since 2022" -> "I have been living here since 2022" (since + explicit point in time only).
  const perfectProgressive = (i: number): boolean => {
    const t = tk[i]!;
    if (isQ || (t.l !== "am" && t.l !== "is" && t.l !== "are")) return false;
    const r = findSubject(tk, i);
    if (!r) return false;
    let j = i + 1;
    while (isAdv(tk[j])) j++;
    const g = tk[j];
    if (!isW(g) || !/^\p{L}{3,}ing$/u.test(g.l) || g.l === "being") return false;
    for (let x = j + 1; x < tk.length; x++) {
      const u = tk[x]!;
      if (u.k === "p") return false;
      if (u.l === "since") {
        const a = tk[x + 1];
        const ok = !!a && ((a.k === "n" && /^(?:19|20)\d\d$/.test(a.raw)) || a.l === "yesterday" ||
          (a.l === "last" && TIME_UNIT.has(tk[x + 2]?.l ?? "")) || WEEKDAY.has(a.l));
        if (!ok) return false;
        out.push({ start: t.s, end: t.e, text: matchCase(t.raw, r.n === "3s" ? "has been" : "have been") });
        return true;
      }
      if (isVerbLike(u) || BOUNDARY_WORDS.has(u.l)) return false;
    }
    return false;
  };

  const lex = (i: number): void => {
    const t = tk[i]!;
    const hit = FORMS.get(t.l);
    const c = hit ? subjectFor(i) : null;
    if (!hit || !c) return;
    const { v, f } = hit;
    if (f === "p") {
      info.set(i, { n: c.n, past: true });
      return;
    }
    const cue = mergeCue(scanCue(tk, c.ss, i), scanCue(tk, i + 1, scopeEnd(tk, i + 1)));
    const tenseOk = !isQ && !v.noTense && !cue.since;
    let past = false;
    const illegal = (f === "b" && c.n === "3s") || (f === "t" && c.n !== "3s");
    if (tenseOk) {
      past = c.inh
        ? c.ip && !cue.pres
        : (cue.past && !cue.pres) || whenPast(c, cue) || (illegal && !cue.pres && neighbourPast(c));
    }
    let target: Form | null = null;
    if (past) {
      if (v.p) target = "p";
    } else if (f === "b" && c.n === "3s") {
      const nx = tk[i + 1]?.l ?? "";
      const likePrep = v.b === "like" && (OBJ.has(nx) || DET.has(nx) || PREP.has(nx)); // "a person like him"
      if (!isSubjunctiveVerb(i) && !likePrep && (!v.weak || cue.pres)) target = "t";
    } else if (f === "t" && c.n !== "3s") {
      target = "b";
    }
    if (target) {
      const repl = target === "p" ? v.p : target === "t" ? v.t : v.b;
      if (repl) out.push({ start: t.s, end: t.e, text: matchCase(t.raw, repl) });
    }
    info.set(i, { n: c.n, past: target === "p" });
  };

  const be = (i: number): void => {
    const t = tk[i]!;
    const r = findSubject(tk, i);
    if (!r) return;
    const cue = mergeCue(scanCue(tk, scopeStart(tk, r.b), i), scanCue(tk, i + 1, scopeEnd(tk, i + 1)));
    const wasPast = t.l === "was" || t.l === "were";
    const past = wasPast || (!isQ && cue.past && !cue.pres && !cue.since);
    // "Rice and beans is ..." can be a notional singular: never turn is/was into are/were for A-and-B subjects.
    if (r.compound && (t.l === "is" || t.l === "was")) return;
    const n = r.n;
    let exp = past ? (n === "2" || n === "pl" ? "were" : "was") : n === "1s" ? "am" : n === "3s" ? "is" : "are";
    // "were" for I/he/she/it is usually subjunctive ("if I were"); only fix noun subjects, never near if/wish/as.
    if (t.l === "were" && exp === "was" && (PRON_ONLY.has(tk[r.np]?.l ?? "") || ifLike)) exp = "were";
    info.set(i, { n, past });
    if (exp !== t.l) out.push({ start: t.s, end: t.e, text: matchCase(t.raw, exp) });
  };

  const doAux = (i: number): void => {
    const t = tk[i]!;
    const neg = t.l.endsWith("n't");
    let n: Num | null = null;
    let ss = 0;
    let k = i + 1;
    const r = findSubject(tk, i);
    if (r) {
      n = r.n;
      ss = scopeStart(tk, r.b);
    } else {
      // inverted order: "Where does the teacher live", "What do you want"
      if (i !== 0 && !isBoundary(tk[i - 1])) return;
      const s0 = tk[i + 1];
      if (!isW(s0)) return;
      if (PRON_ONLY.has(s0.l)) {
        n = SUBJ_PRON[s0.l] ?? null;
        k = i + 2;
      } else if (DET.has(s0.l)) {
        let e = i + 2;
        while (e < Math.min(i + 5, tk.length) && isW(tk[e]) && !isVerbLike(tk[e])) e++;
        const head = tk[e - 1];
        if (!isVerbLike(tk[e]) || !head) return;
        n = nounNumber(head.raw, true);
        k = e;
      }
      ss = i;
    }
    if (!n) return;
    if (tk[k]?.l === "not") k++;
    while (isAdv(tk[k])) k++;
    const vt = tk[k];
    if (isW(vt)) {
      const h = FORMS.get(vt.l);
      if (h && h.f !== "b") out.push({ start: vt.s, end: vt.e, text: matchCase(vt.raw, h.v.b) });
    }
    if (t.l === "did" || t.l === "didn't") return;
    const cue = scanCue(tk, ss, i);
    const past = !isQ && cue.past && !cue.pres && !cue.since;
    const target = past ? (neg ? "didn't" : "did") : n === "3s" ? (neg ? "doesn't" : "does") : neg ? "don't" : "do";
    if (target !== t.l) out.push({ start: t.s, end: t.e, text: setAux(t.raw, target) });
  };

  for (let i = 0; i < tk.length; i++) {
    const t = tk[i]!;
    if (t.k !== "w") continue;
    if (HAVE.has(t.l)) participle(i);
    if (DO.has(t.l)) doAux(i);
    else if (isBe(t.l)) { if (!perfectProgressive(i)) be(i); }
    else if (FORMS.has(t.l)) lex(i);
  }
}

/* ------------------------------------------------------------------ wh-question inversion */

/**
 * "Where you are going?" -> "Where are you going?", "Why he doesn't like it?" -> "Why doesn't he like it?"
 * Only for a single-clause sentence that starts with what/where/why/how/when and ends with "?".
 * The subject must be one pronoun, one capitalised name, or determiner + noun phrase.
 */
function qSubject(span: Tok[]): Num | null {
  const first = span[0];
  if (!first) return null;
  if (span.length === 1) {
    if (PRON_ONLY.has(first.l)) return SUBJ_PRON[first.l] ?? null;
    if (/^\p{Lu}/u.test(first.raw) && !STOP.has(first.l) && !FORMS.has(first.l) && !/s$/i.test(first.l)) return "3s";
    return null;
  }
  if (DET.has(first.l) || first.k === "n") {
    if (first.l === "many" || first.l === "much" || first.l === "few" || first.l === "several") return null; // "How many students are there?"
    if (span.some((t) => t.k === "p" || isVerbLike(t) || STOP.has(t.l) || (ADV.has(t.l) && t !== first))) return null;
    return nounNumber(span[span.length - 1]!.raw, true);
  }
  return null;
}

/** "What the teacher say about the exam?" -> "What does the teacher say about the exam?" (no auxiliary at all). */
function bareQuestion(tk: Tok[], text: string): Edit | null {
  const n = tk.length;
  if (tk.slice(1, n - 1).some((t) => isAux(t))) return null;
  let k = 2;
  while (k < n - 1 && !isVerbLike(tk[k])) k++;
  const vt = tk[k];
  const hit = isW(vt) ? FORMS.get(vt.l) : undefined;
  if (!vt || !hit || hit.f === "p" || k >= n - 1) return null;
  for (let x = k + 1; x < n - 1; x++) if (isVerbLike(tk[x]) && tk[x - 1]?.l !== "to") return null;
  const span = tk.slice(1, k);
  const sn = qSubject(span);
  if (!sn) return null;
  return { start: span[0]!.s, end: vt.e, text: (sn === "3s" ? "does" : "do") + " " + text.slice(span[0]!.s, vt.s) + hit.v.b };
}

function questionEdit(tk: Tok[], text: string): Edit | null {
  const n = tk.length;
  if (n < 4 || tk[n - 1]?.l !== "?") return null;
  const wh = tk[0];
  if (!isW(wh) || !Q_WH.has(wh.l) || isAux(tk[1])) return null;
  if (tk.some((t, x) => (t.k === "p" && x !== n - 1) || CLAUSE_WORDS.has(t.l))) return null;
  let k = 2;
  while (k < Math.min(n - 1, 6) && !isAux(tk[k])) k++;
  const aux = tk[k];
  if (!isW(aux) || !isAux(aux) || k >= n - 1) return bareQuestion(tk, text);
  const span = tk.slice(1, k);
  const first = span[0]!;
  const sn = qSubject(span);
  const lower = aux.l;
  let auxText = aux.raw;
  if (isBe(lower)) {
    if (!sn) return null;
    const past = lower === "was" || lower === "were";
    const exp = past ? (sn === "2" || sn === "pl" ? "were" : "was") : sn === "1s" ? "am" : sn === "3s" ? "is" : "are";
    if (lower === "were" && exp === "was") return null; // possible subjunctive: leave alone
    auxText = matchCase(aux.raw, exp);
  } else if (DO.has(lower) && lower !== "did" && lower !== "didn't") {
    if (!sn) return null;
    const neg = lower.endsWith("n't");
    auxText = setAux(aux.raw, sn === "3s" ? (neg ? "doesn't" : "does") : neg ? "don't" : "do");
  } else if (!(DO.has(lower) || MODAL.has(lower))) {
    return null;
  }
  let end = aux.e;
  let notText = "";
  let after = k + 1;
  if (!isBe(lower) && tk[after]?.l === "not") {
    notText = " not";
    end = tk[after]!.e;
    after++;
  }
  if (!isW(tk[after])) return null;
  if (!isBe(lower) && !FORMS.has(tk[after]!.l)) return null; // do/modal must be followed by a known base verb
  const subjText = text.slice(first.s, span[span.length - 1]!.e);
  return { start: first.s, end, text: auxText + " " + subjText + notText };
}

/* ------------------------------------------------------------------ rule pipeline */

/** Applies every rule to `text` in one overlap-safe pass. `applied` = number of edits really applied. */
export function fixText(text: string): { text: string; applied: number } {
  const sentences = splitSentences(tokenize(text), text);
  const edits: Edit[] = [];
  for (const s of sentences) {
    const q = questionEdit(s, text);
    if (q) edits.push(q); // inversion edits first: they win over per-token edits inside their span
  }
  for (const s of sentences) analyze(s, edits);
  return applyEdits(text, edits);
}

/* ------------------------------------------------------------------ engine suggestions */

function utf8Len(cp: number): number {
  return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
}

/** Maps an engine offset (in `unit`) to a UTF-16 index, or null if it is out of range / inside a character. */
export function makeOffsetMapper(text: string, unit: OffsetUnit): (n: number) => number | null {
  let ascii = true;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) { ascii = false; break; }
  }
  if (ascii) return (n) => (Number.isInteger(n) && n >= 0 && n <= text.length ? n : null);
  const table = new Map<number, number>();
  let pos = 0;
  let u16 = 0;
  for (const ch of text) {
    table.set(pos, u16);
    pos += unit === "utf8" ? utf8Len(ch.codePointAt(0) ?? 0) : unit === "codepoint" ? 1 : ch.length;
    u16 += ch.length;
  }
  table.set(pos, u16);
  return (n) => table.get(n) ?? null;
}

function isInflectionSwap(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  const fx = FORMS.get(x);
  const fy = FORMS.get(y);
  if (fx && fy && fx.v === fy.v) return true;
  if (fx && !fy && fx.f === "p" && fx.v.pp !== null && (y === x + "ed" || y === x + "d")) return true; // saw -> sawed
  return (BE.has(x) && BE.has(y)) || (DO.has(x) && DO.has(y));
}

function tidyDeletion(text: string, ed: Edit): Edit {
  if (ed.text !== "") return ed;
  let { start, end } = ed;
  if (text[end] === " " && (start === 0 || text[start - 1] === " ")) end++;
  else if (start > 0 && text[start - 1] === " " && (end >= text.length || /[.,;:!?]/.test(text[end] ?? ""))) start--;
  return { start, end, text: "" };
}

/**
 * Converts engine matches into UTF-16 edits using each match's first suggestion.
 * Skipped on purpose: bad/unmappable ranges, long spans, multi-line suggestions, and swaps between two
 * forms of the same verb (be/do/lexical): subject-verb and tense decisions belong to the rule layer,
 * which can see the subject. This is what used to turn "feel" into "feels" after "I".
 */
export function buildEngineEdits(text: string, matches: GrammarMatch[], unit: OffsetUnit = ENGINE_OFFSET_UNIT): Edit[] {
  const map = makeOffsetMapper(text, unit);
  const edits: Edit[] = [];
  for (const m of matches) {
    const value = m.suggestions?.[0]?.value;
    if (!m.range || typeof value !== "string") continue;
    const s = map(m.range.start);
    const e = map(m.range.end);
    if (s === null || e === null || s > e) continue;
    const orig = text.slice(s, e);
    if (orig === value || orig.length > 60 || value.length > 80 || value.includes("\n")) continue;
    if (isInflectionSwap(orig, value)) continue;
    edits.push(tidyDeletion(text, { start: s, end: e, text: value }));
  }
  return edits;
}
// ==== RULES-END ====