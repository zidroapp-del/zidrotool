import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, Copy, Languages, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "@/lib/utils";

/* ================================================================== engine
 * A small, deterministic rewriter that runs entirely in the browser:
 * a built-in synonym dictionary (words, verbs with their forms, nouns with
 * their plurals), a list of wordy phrases and contractions.
 * It is NOT a language model: it only knows the words listed below and
 * leaves everything else untouched.
 * ================================================================== */

type Mode = "standard" | "fluency";
type Dialect = "keep" | "us" | "uk";
type Seg = { text: string; orig?: string; cands?: string[] };
type Result = { segs: Seg[]; total: number; changed: number };
type Kind = "word" | "verb" | "noun";

const MAX_CHARS = 20_000;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const IRREGULAR_VERBS: Record<string, string[]> = {
  buy: ["buy", "buys", "bought", "buying"],
  build: ["build", "builds", "built", "building"],
  understand: ["understand", "understands", "understood", "understanding"],
  permit: ["permit", "permits", "permitted", "permitting"],
  occur: ["occur", "occurs", "occurred", "occurring"],
  say: ["say", "says", "said", "saying"],
  think: ["think", "thinks", "thought", "thinking"],
  want: ["want", "wants", "wanted", "wanting"],
};
const IRREGULAR_PLURALS: Record<string, string> = { person: "people" };

function verbForms(b: string): string[] {
  const irregular = IRREGULAR_VERBS[b];
  if (irregular) return irregular;
  const consonantY = /[^aeiou]y$/.test(b);
  const s = /(s|x|z|ch|sh)$/.test(b) ? `${b}es` : consonantY ? `${b.slice(0, -1)}ies` : `${b}s`;
  const ed = /e$/.test(b) ? `${b}d` : consonantY ? `${b.slice(0, -1)}ied` : `${b}ed`;
  const ing = /[^e]e$/.test(b) ? `${b.slice(0, -1)}ing` : `${b}ing`;
  return [b, s, ed, ing];
}

function nounForms(n: string): string[] {
  const irregular = IRREGULAR_PLURALS[n];
  if (irregular) return [n, irregular];
  if (/[^aeiou]y$/.test(n)) return [n, `${n.slice(0, -1)}ies`];
  if (/(s|x|z|ch|sh)$/.test(n)) return [n, `${n}es`];
  return [n, `${n}s`];
}

// "*" = also used as a noun (skipped after a determiner), "~" = only ever a replacement, never replaced itself.
const GROUPS: Array<{ kind: Kind; members: string[] }> = [
  // adjectives & adverbs
  { kind: "word", members: ["important", "crucial", "essential", "vital", "significant"] },
  { kind: "word", members: ["big", "large", "sizable"] },
  { kind: "word", members: ["huge", "enormous", "massive", "immense"] },
  { kind: "word", members: ["small", "tiny", "modest"] },
  { kind: "word", members: ["good", "great", "excellent"] },
  { kind: "word", members: ["bad", "poor", "awful"] },
  { kind: "word", members: ["easy", "simple", "straightforward"] },
  { kind: "word", members: ["difficult", "challenging", "demanding", "hard", "tough"] },
  { kind: "word", members: ["quick", "rapid", "speedy", "fast"] },
  { kind: "word", members: ["beautiful", "gorgeous", "stunning", "lovely"] },
  { kind: "word", members: ["happy", "glad", "pleased", "delighted"] },
  { kind: "word", members: ["sad", "unhappy", "sorrowful"] },
  { kind: "word", members: ["smart", "clever", "intelligent", "bright"] },
  { kind: "word", members: ["strong", "powerful", "robust"] },
  { kind: "word", members: ["new", "fresh", "novel", "modern"] },
  { kind: "word", members: ["many", "numerous"] },
  { kind: "word", members: ["different", "distinct", "varied", "diverse"] },
  { kind: "word", members: ["same", "identical", "equivalent"] },
  { kind: "word", members: ["clear", "obvious", "evident", "apparent"] },
  { kind: "word", members: ["main", "primary", "principal", "chief"] },
  { kind: "word", members: ["whole", "entire"] },
  { kind: "word", members: ["real", "genuine", "authentic", "actual"] },
  { kind: "word", members: ["common", "frequent", "widespread"] },
  { kind: "word", members: ["useful", "helpful", "valuable", "beneficial"] },
  { kind: "word", members: ["necessary", "required", "needed"] },
  { kind: "word", members: ["possible", "feasible", "achievable"] },
  { kind: "word", members: ["interesting", "fascinating", "intriguing", "engaging"] },
  { kind: "word", members: ["boring", "dull", "tedious"] },
  { kind: "word", members: ["regular", "consistent", "steady"] },
  { kind: "word", members: ["quickly", "rapidly", "swiftly", "promptly"] },
  { kind: "word", members: ["slowly", "gradually"] },
  { kind: "word", members: ["often", "frequently", "regularly"] },
  { kind: "word", members: ["usually", "typically", "generally", "normally"] },
  { kind: "word", members: ["really", "truly", "genuinely"] },
  { kind: "word", members: ["very", "extremely", "highly", "remarkably"] },
  { kind: "word", members: ["maybe", "perhaps", "possibly"] },
  { kind: "word", members: ["almost", "nearly", "practically"] },
  { kind: "word", members: ["mostly", "mainly", "largely", "chiefly"] },
  { kind: "word", members: ["certainly", "definitely", "surely", "undoubtedly"] },
  { kind: "word", members: ["only", "merely", "solely"] },
  { kind: "word", members: ["currently", "presently", "now"] },
  { kind: "word", members: ["especially", "particularly", "notably"] },
  { kind: "word", members: ["finally", "eventually", "ultimately"] },
  { kind: "word", members: ["amazing", "incredible", "remarkable", "impressive"] },
  { kind: "word", members: ["terrible", "horrible", "dreadful"] },
  { kind: "word", members: ["cheap", "affordable", "inexpensive"] },
  { kind: "word", members: ["expensive", "costly", "pricey~"] },
  { kind: "word", members: ["wrong", "incorrect", "mistaken~"] },
  { kind: "word", members: ["several", "multiple", "various"] },
  { kind: "word", members: ["famous", "renowned", "celebrated"] },
  { kind: "word", members: ["careful", "cautious", "attentive"] },
  { kind: "word", members: ["serious", "severe", "grave~"] },
  { kind: "word", members: ["strange", "odd", "unusual", "peculiar"] },
  { kind: "word", members: ["rare", "uncommon", "scarce"] },
  { kind: "word", members: ["wide", "broad", "extensive"] },
  { kind: "word", members: ["perfect", "ideal", "flawless"] },
  { kind: "word", members: ["basic", "fundamental", "core~"] },
  { kind: "word", members: ["always", "constantly", "continually"] },
  { kind: "word", members: ["soon", "shortly"] },
  { kind: "word", members: ["because", "since~"] },
  { kind: "word", members: ["safe", "secure~", "protected~"] },
  // verbs
  { kind: "verb", members: ["help*", "assist", "aid*"] },
  { kind: "verb", members: ["show*", "display*", "demonstrate", "reveal", "illustrate"] },
  { kind: "verb", members: ["use*", "utilize", "employ", "apply"] },
  { kind: "verb", members: ["buy", "purchase*", "acquire"] },
  { kind: "verb", members: ["start*", "commence", "launch*"] },
  { kind: "verb", members: ["need*", "require"] },
  { kind: "verb", members: ["try*", "attempt*", "strive"] },
  { kind: "verb", members: ["improve", "enhance", "boost*"] },
  { kind: "verb", members: ["increase*", "raise", "boost*"] },
  { kind: "verb", members: ["reduce", "decrease*", "lessen", "diminish"] },
  { kind: "verb", members: ["explain", "clarify", "describe"] },
  { kind: "verb", members: ["create", "generate", "produce*", "develop"] },
  { kind: "verb", members: ["finish", "complete", "conclude"] },
  { kind: "verb", members: ["fix*", "repair*", "resolve", "correct"] },
  { kind: "verb", members: ["check*", "verify", "examine", "inspect"] },
  { kind: "verb", members: ["allow", "permit", "enable"] },
  { kind: "verb", members: ["suggest", "recommend", "propose", "advise"] },
  { kind: "verb", members: ["happen", "occur"] },
  { kind: "verb", members: ["appear", "seem"] },
  { kind: "verb", members: ["remain", "stay"] },
  { kind: "verb", members: ["obtain", "acquire", "secure"] },
  { kind: "verb", members: ["provide", "offer*", "supply*"] },
  { kind: "verb", members: ["understand", "comprehend", "grasp*"] },
  { kind: "verb", members: ["achieve", "accomplish", "attain"] },
  { kind: "verb", members: ["ensure", "guarantee*"] },
  { kind: "verb", members: ["contain", "include"] },
  { kind: "verb", members: ["build", "construct", "assemble"] },
  { kind: "verb", members: ["say~", "state*", "mention*"] },
  { kind: "verb", members: ["think", "believe"] },
  { kind: "verb", members: ["want", "wish*", "desire*"] },
  { kind: "verb", members: ["select", "pick*"] },
  { kind: "verb", members: ["limit*", "restrict"] },
  // nouns
  { kind: "noun", members: ["problem", "issue", "difficulty", "challenge"] },
  { kind: "noun", members: ["benefit", "advantage"] },
  { kind: "noun", members: ["idea", "concept", "notion", "thought~"] },
  { kind: "noun", members: ["method", "approach", "technique", "strategy"] },
  { kind: "noun", members: ["job", "task", "assignment"] },
  { kind: "noun", members: ["person", "individual"] },
  { kind: "noun", members: ["chance", "opportunity"] },
  { kind: "noun", members: ["goal", "objective", "aim", "target"] },
  { kind: "noun", members: ["answer", "response", "reply"] },
  { kind: "noun", members: ["tip", "hint", "pointer"] },
  { kind: "noun", members: ["type", "category", "sort"] },
  { kind: "noun", members: ["house", "home", "residence"] },
  { kind: "noun", members: ["car", "vehicle", "automobile"] },
  { kind: "noun", members: ["picture", "image", "photo", "photograph"] },
  { kind: "noun", members: ["company", "business", "firm", "organization"] },
  { kind: "noun", members: ["customer", "client", "buyer"] },
  { kind: "noun", members: ["teacher", "instructor", "educator"] },
  { kind: "noun", members: ["student", "learner", "pupil"] },
  { kind: "noun", members: ["mistake", "error"] },
  { kind: "noun", members: ["story", "tale", "narrative"] },
  { kind: "noun", members: ["trip", "journey", "excursion"] },
  { kind: "noun", members: ["advice", "guidance", "counsel"] },
  { kind: "noun", members: ["skill", "ability"] },
  { kind: "noun", members: ["change", "alteration", "modification"] },
  { kind: "noun", members: ["area", "region"] },
  { kind: "noun", members: ["rule", "regulation"] },
  { kind: "noun", members: ["choice", "option", "alternative~"] },
  { kind: "noun", members: ["worker", "employee"] },
  { kind: "noun", members: ["hazard", "threat", "danger~"] },
  { kind: "noun", members: ["growth", "expansion"] },
];

type Entry = { gid: number; form: number; amb: boolean };
const GROUP_FORMS: string[][][] = []; // [group][member][form]
const GROUP_SOURCE: boolean[][] = []; // [group][member] can be replaced
const GROUP_AMB: boolean[][] = [];
const LEXICON = new Map<string, Entry[]>();

GROUPS.forEach((g, gid) => {
  const forms: string[][] = [];
  const src: boolean[] = [];
  const amb: boolean[] = [];
  for (const raw of g.members) {
    const targetOnly = raw.endsWith("~");
    const isAmb = raw.endsWith("*");
    const base = raw.replace(/[*~]$/, "");
    forms.push(g.kind === "verb" ? verbForms(base) : g.kind === "noun" ? nounForms(base) : [base]);
    src.push(!targetOnly);
    amb.push(isAmb);
  }
  GROUP_FORMS.push(forms);
  GROUP_SOURCE.push(src);
  GROUP_AMB.push(amb);
  forms.forEach((fs, m) => {
    if (!src[m]) return;
    fs.forEach((surface, form) => {
      const list = LEXICON.get(surface) ?? [];
      list.push({ gid, form, amb: amb[m] ?? false });
      LEXICON.set(surface, list);
    });
  });
});

const DET = new Set(["the", "a", "an", "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their", "some", "any", "no", "each", "every", "another"]);
const NOUN_VERB_PREV = new Set(["to", "will", "would", "can", "could", "may", "might", "shall", "should", "must", "i", "you", "we", "they", "he", "she", "it", "do", "does", "did", "don't", "doesn't", "didn't", "not"]);
const BE_LIKE = new Set(["am", "is", "are", "was", "were", "be", "been", "being", "very", "too", "so", "quite", "really", "more", "most", "how", "become", "becomes", "became", "seem", "seems", "look", "looks", "not", "isn't", "aren't", "wasn't", "weren't"]);
const BLOCK_NEXT: Record<string, string[]> = {
  check: ["out", "in", "up"],
  start: ["up", "off", "out", "with"],
  show: ["up", "off", "them", "me", "him", "her", "us", "you"],
  try: ["out", "on"],
  use: ["up"],
  need: [],
  think: ["about", "of", "over", "through", "again", "twice"],
  believe: ["in", "me", "you", "him", "her", "them", "us"],
  pick: ["up", "out", "on"],
  state: ["of"],
  limit: ["of"],
};
// strong adjectives that do not take "very"
const ABSOLUTE = new Set(["excellent", "crucial", "essential", "vital", "huge", "enormous", "massive", "immense", "awful", "terrible", "horrible", "dreadful", "gorgeous", "stunning", "delighted", "flawless", "incredible", "amazing", "impressive", "remarkable", "identical", "entire", "grave", "starving", "exhausted", "perfect", "ideal", "great", "fundamental"]);
const DEGREE = new Set(["very", "extremely", "really", "quite", "so", "too", "highly", "most"]);
const ONLY_NEXT_TO = new Set(["want", "wish", "desire"]);
// "help people understand" must keep the bare infinitive, so these verbs only change before a determiner or "with".
const ONLY_NEXT_DET = new Set(["help", "assist", "aid"]);

type Guard = { onlyAfter?: Set<string>; notAfter?: Set<string>; notBefore?: Set<string> };
const FAST_OK = new Set([...BE_LIKE, ...DET]);
const WORD_GUARDS: Record<string, Guard> = {
  hard: { onlyAfter: BE_LIKE },
  fast: { onlyAfter: FAST_OK },
  only: { notAfter: DET },
  good: { notBefore: new Set(["morning", "afternoon", "evening", "night", "luck", "bye", "day"]) },
  new: { notBefore: new Set(["year", "york", "zealand", "delhi", "jersey"]) },
  very: { notBefore: new Set(["much", "many"]) },
  real: { notBefore: new Set(["estate", "time", "world", "life"]) },
  now: { onlyAfter: new Set(["is", "are", "was", "were", "it's", "that's", "i'm", "we're", "they're", "you're", "just"]) },
  regular: { notBefore: new Set(["expression", "expressions"]) },
  required: { onlyAfter: BE_LIKE },
  needed: { onlyAfter: BE_LIKE },
  possible: { notAfter: new Set(["as"]) },
  because: { notBefore: new Set(["of"]) },
  soon: { notAfter: new Set(["as"]), notBefore: new Set(["as"]) },
  big: { notBefore: new Set(["deal", "difference", "data", "bang", "picture", "brother", "sister"]) },
  large: { notBefore: new Set(["scale"]) },
  common: { notBefore: new Set(["sense", "ground"]) },
};

type Phrase = { words: string[]; alts: string[]; needComma?: boolean; notNext?: string[]; kind?: "phrase" | "contract" };
const phrase = (p: string, alts: string[], extra: Partial<Phrase> = {}): Phrase => ({ words: p.split(" "), alts, ...extra });
const PHRASES: Phrase[] = [
  phrase("in order to", ["to", "so as to"]),
  phrase("due to the fact that", ["because", "since"]),
  phrase("a lot of", ["plenty of", "lots of"]),
  phrase("as well as", ["along with", "in addition to"]),
  phrase("in addition", ["additionally", "furthermore", "moreover"], { notNext: ["to"] }),
  phrase("for example", ["for instance", "as an example"]),
  phrase("however", ["nevertheless", "that said", "even so"], { needComma: true }),
  phrase("therefore", ["as a result", "consequently", "thus"], { needComma: true }),
  phrase("because of", ["due to", "owing to"]),
  phrase("in spite of", ["despite"]),
  phrase("such as", ["like", "including"]),
  phrase("a number of", ["several", "many"]),
  phrase("is able to", ["can"]),
  phrase("are able to", ["can"]),
  phrase("was able to", ["could"]),
  phrase("were able to", ["could"]),
  phrase("in the event that", ["if"]),
  phrase("at the present time", ["currently", "at the moment"]),
  phrase("first of all", ["to begin with", "first"], { needComma: true }),
  phrase("in conclusion", ["to conclude", "in summary", "all in all"], { needComma: true }),
  phrase("on the other hand", ["conversely", "by contrast"], { needComma: true }),
  phrase("as a result", ["consequently", "therefore"], { needComma: true }),
  phrase("in my opinion", ["from my perspective", "in my view"], { needComma: true }),
  phrase("for this reason", ["as a result", "for that reason"], { needComma: true }),
  phrase("at the same time", ["simultaneously", "meanwhile"]),
  phrase("in fact", ["in reality", "actually"]),
  phrase("right now", ["at the moment", "currently"]),
  phrase("lots of", ["plenty of", "a lot of"]),
  phrase("get rid of", ["remove", "eliminate"]),
  phrase("find out", ["discover", "learn"], { notNext: ["about", "if", "whether"] }),
  phrase("look at", ["examine", "consider"]),
  phrase("come up with", ["devise", "think of"]),
  phrase("deal with", ["handle", "address"]),
  phrase("make sure", ["ensure"], { notNext: ["to"] }),
  phrase("a variety of", ["a range of", "various"]),
  phrase("most of the time", ["usually", "typically"]),
  phrase("thanks to", ["owing to", "because of"]),
  phrase("with regard to", ["regarding", "concerning"]),
  phrase("as soon as possible", ["promptly", "at the earliest opportunity"]),
  phrase("very important", ["crucial", "essential", "vital"]),
  phrase("very big", ["huge", "enormous"]),
  phrase("very good", ["excellent", "great"]),
  phrase("very small", ["tiny"]),
  phrase("very happy", ["delighted", "thrilled"]),
  phrase("very bad", ["terrible", "awful"]),
  phrase("very tired", ["exhausted"]),
  phrase("very hungry", ["starving"]),
  phrase("very beautiful", ["stunning", "gorgeous"]),
  phrase("very smart", ["brilliant"]),
];
const CONTRACTIONS: Array<[string, string]> = [
  ["do not", "don't"], ["does not", "doesn't"], ["did not", "didn't"], ["is not", "isn't"], ["are not", "aren't"],
  ["was not", "wasn't"], ["were not", "weren't"], ["cannot", "can't"], ["will not", "won't"], ["would not", "wouldn't"],
  ["should not", "shouldn't"], ["could not", "couldn't"], ["have not", "haven't"], ["has not", "hasn't"], ["had not", "hadn't"],
  ["I am", "I'm"], ["you are", "you're"], ["we are", "we're"], ["they are", "they're"], ["I will", "I'll"], ["we will", "we'll"],
];
const CONTRACT_PHRASES: Phrase[] = CONTRACTIONS.map(([a, b]) => phrase(a, [b], { kind: "contract" }));
const EXPAND = new Map<string, string>(CONTRACTIONS.map(([a, b]) => [b.toLowerCase(), a] as [string, string]));
EXPAND.set("can't", "cannot");

const PHRASE_BY_FIRST = new Map<string, Phrase[]>();
for (const p of [...PHRASES, ...CONTRACT_PHRASES]) {
  const key = (p.words[0] ?? "").toLowerCase();
  const list = PHRASE_BY_FIRST.get(key) ?? [];
  list.push(p);
  list.sort((x, y) => y.words.length - x.words.length);
  PHRASE_BY_FIRST.set(key, list);
}

const TOKEN_RE = /https?:\/\/\S+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|[A-Za-z]+(?:['’][A-Za-z]+)*|[ \t]+|\r?\n|[^A-Za-z\s]+/g;
const WORD_RE = /^[A-Za-z]+(?:['’][A-Za-z]+)*$/;

const norm = (w: string): string => w.toLowerCase().replace(/’/g, "'");
function matchCase(orig: string, repl: string): string {
  if (orig.length > 1 && orig === orig.toUpperCase()) return repl.toUpperCase();
  if (orig[0] && orig[0] === orig[0].toUpperCase() && orig[0] !== orig[0].toLowerCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
  return repl;
}

const AN_EXCEPT = /^(hour|honest|honou?r|heir)/;
const A_EXCEPT = /^(uni(?!mportant|ntend|nterest|maginab|nform|dentif)|use|usu|uti|eu|one|once|ubiq)/;
function articleFor(word: string): "a" | "an" {
  const w = word.toLowerCase();
  if (AN_EXCEPT.test(w)) return "an";
  if (A_EXCEPT.test(w)) return "a";
  return /^[aeiou]/.test(w) ? "an" : "a";
}

/* ---- spelling variants ---- */
const OUR_STEMS = "colo|favo|behavio|harbo|neighbo|hono|labo|flavo|humo|rumo|savo|vigo";
const OUR_SUFFIX = "(?=(?:s|ed|ing|ful|less|able|ably|ite|ites|hood)?\\b)";
const IZE_STEMS = "organ|real|recogn|summar|custom|optim|minim|maxim|util|apolog|categor|emphas|final|special|general|character|author|memor|modern|central|legal|local|mobil|normal|personal|priorit|popular|social|stabil|visual|digit|capital|critic|harmon|individual|industrial|material|national|neutral|standard|synchron|fertil|sympath|equal|ideal|urban";
const LL_STEMS = "travel|cancel|model|label|level|signal|fuel|total|channel|counsel";
const WORD_PAIRS: Array<[string, string]> = [
  ["center", "centre"], ["centers", "centres"], ["centered", "centred"], ["theater", "theatre"], ["theaters", "theatres"],
  ["fiber", "fibre"], ["fibers", "fibres"], ["defense", "defence"], ["gray", "grey"], ["catalog", "catalogue"],
  ["catalogs", "catalogues"], ["dialog", "dialogue"], ["liter", "litre"], ["liters", "litres"], ["aluminum", "aluminium"],
  ["jewelry", "jewellery"], ["cozy", "cosy"], ["fulfill", "fulfil"], ["fulfillment", "fulfilment"], ["analyze", "analyse"],
  ["analyzed", "analysed"], ["analyzes", "analyses"], ["analyzing", "analysing"],
];
const US_TO_UK = new Map(WORD_PAIRS);
const UK_TO_US = new Map(WORD_PAIRS.map(([u, k]) => [k, u] as [string, string]));

function applySpelling(text: string, dialect: Dialect): string {
  if (dialect === "keep") return text;
  const toUk = dialect === "uk";
  let out = text;
  const up = (s: string, lower: string, upper: string) => (s === s.toUpperCase() && s.length > 1 ? upper : lower);
  if (toUk) {
    out = out.replace(new RegExp(`\\b(${OUR_STEMS})r${OUR_SUFFIX}`, "gi"), (_m, stem: string) => stem + (stem === stem.toUpperCase() ? "UR" : "ur"));
    out = out.replace(new RegExp(`\\b(${IZE_STEMS})(iz)(e|es|ed|ing|ation|ations|er|ers)\\b`, "gi"), (_m, s: string, z: string, e: string) => s + up(z, "is", "IS") + e);
    out = out.replace(new RegExp(`\\b(${LL_STEMS})(ed|ing|er|ers)\\b`, "gi"), (_m, s: string, e: string) => s + up(e, "l", "L") + e);
  } else {
    out = out.replace(new RegExp(`\\b(${OUR_STEMS})ur${OUR_SUFFIX}`, "gi"), (_m, stem: string) => stem + "r");
    out = out.replace(new RegExp(`\\b(${IZE_STEMS})(is)(e|es|ed|ing|ation|ations|er|ers)\\b`, "gi"), (_m, s: string, z: string, e: string) => s + up(z, "iz", "IZ") + e);
    out = out.replace(new RegExp(`\\b(${LL_STEMS})l(ed|ing|er|ers)\\b`, "gi"), (_m, s: string, e: string) => s + e);
  }
  const table = toUk ? US_TO_UK : UK_TO_US;
  out = out.replace(/[A-Za-z]+/g, (w) => {
    const hit = table.get(w.toLowerCase());
    return hit ? matchCase(w, hit) : w;
  });
  return out;
}

/* ---- the rewrite pass ---- */
function rewriteText(text: string, opts: { mode: Mode; strength: number; seed: number; dialect: Dialect }): Result {
  const rand = rng(opts.seed * 7919 + 13);
  const p = opts.strength / 100;
  const toks = text.match(TOKEN_RE) ?? [];
  const isWordTok = (i: number): boolean => i >= 0 && i < toks.length && WORD_RE.test(toks[i] ?? "");
  const out: Seg[] = [];
  let total = 0;

  const prevOf = (i: number): { word: string; start: boolean } => {
    let j = i - 1;
    let gap = "";
    while (j >= 0 && /^\s+$/.test(toks[j] ?? "")) {
      gap = (toks[j] ?? "") + gap;
      j--;
    }
    if (j < 0) return { word: "", start: true };
    const t = toks[j] ?? "";
    if (isWordTok(j)) return { word: /\n/.test(gap) ? "" : norm(t), start: /\n/.test(gap) };
    return { word: "", start: /[.!?:]["')\]]*$/.test(t) || /\n/.test(gap) };
  };
  const nextWord = (i: number): string => {
    let j = i + 1;
    while (j < toks.length && /^[ \t]+$/.test(toks[j] ?? "")) j++;
    return j < toks.length && isWordTok(j) ? norm(toks[j] ?? "") : "";
  };

  // pull "a"/"an" into the replaced segment so the article can follow the new word
  const withArticle = (orig: string, text0: string, cands: string[]): Seg => {
    const sp = out[out.length - 1];
    const art = out[out.length - 2];
    if (sp && art && sp.orig === undefined && sp.text === " " && art.orig === undefined && /^(a|an)$/i.test(art.text)) {
      out.pop();
      out.pop();
      const fix = (w: string): string => matchCase(art.text, articleFor(w)) + " " + w;
      return { text: fix(text0), orig: `${art.text} ${orig}`, cands: cands.map(fix) };
    }
    return { text: text0, orig, cands };
  };

  // avoid reusing the same replacement word twice within a few picks
  const recent: string[] = [];
  const pickFresh = (cased: string[], pick: number): string => {
    const fresh = cased.filter((c) => !recent.includes(c.toLowerCase()));
    const pool = fresh.length > 0 ? fresh : cased;
    const chosen = pool[Math.floor(pick * pool.length)] ?? pool[0]!;
    recent.push(chosen.toLowerCase());
    if (recent.length > 6) recent.shift();
    return chosen;
  };

  let i = 0;
  while (i < toks.length) {
    const tok = toks[i] ?? "";
    if (!isWordTok(i)) {
      out.push({ text: tok });
      i++;
      continue;
    }
    total++;
    const lower = norm(tok);
    const prev = prevOf(i);
    const properNoun = !prev.start && tok.length > 1 && tok[0] === tok[0]?.toUpperCase() && tok[0] !== tok[0]?.toLowerCase();
    const allCaps = tok.length > 1 && tok === tok.toUpperCase();

    // 1) phrases and contractions (Fluency)
    if (opts.mode === "fluency" && !properNoun) {
      const rules = PHRASE_BY_FIRST.get(lower);
      let matched = false;
      if (rules) {
        for (const rule of rules) {
          const n = rule.words.length;
          let ok = true;
          for (let k = 0; k < n && ok; k++) {
            const wi = i + 2 * k;
            if (!isWordTok(wi) || norm(toks[wi] ?? "") !== rule.words[k]!.toLowerCase()) ok = false;
            if (ok && k < n - 1 && toks[wi + 1] !== " ") ok = false;
          }
          if (!ok) continue;
          const end = i + 2 * (n - 1);
          if (rule.needComma && toks[end + 1] !== ",") continue;
          if (rule.notNext && toks[end + 1] === " " && isWordTok(end + 2) && rule.notNext.includes(norm(toks[end + 2] ?? ""))) continue;
          const roll = rand();
          const pick = rand();
          const threshold = rule.kind === "contract" ? p * 0.5 : p;
          const original = toks.slice(i, end + 1).join("");
          if (roll < threshold) {
            const cased = rule.alts.map((a) => (rule.words[0] === "I" ? a : matchCase(original, a)));
            const chosen = pickFresh(cased, pick);
            out.push(withArticle(original, chosen, cased));
            total += n - 1;
            i = end + 1;
            matched = true;
          }
          break;
        }
      }
      if (matched) continue;
      // expand contractions
      const expanded = EXPAND.get(lower);
      if (expanded) {
        const roll = rand();
        if (roll < p * 0.5) {
          const cased = [lower.startsWith("i'") ? expanded : matchCase(tok, expanded)];
          out.push({ text: cased[0]!, orig: tok, cands: cased });
          i++;
          continue;
        }
      }
    }

    // 2) single-word synonyms
    let handled = false;
    const entries = LEXICON.get(lower);
    if (entries && !properNoun && !allCaps && tok !== "I") {
      const nxt = nextWord(i);
      for (const e of entries) {
        const kind = GROUPS[e.gid]!.kind;
        const members = GROUP_FORMS[e.gid]!;
        if (kind === "verb") {
          if (DET.has(prev.word)) continue;
          if (e.amb && (DET.has(prev.word) || /^(of|for|with|in|on|by)$/.test(prev.word))) continue;
          const lemma = members.find((m) => m.includes(lower))?.[0] ?? "";
          if (BLOCK_NEXT[lemma]?.includes(nxt)) continue;
          if (ONLY_NEXT_TO.has(lemma) && nxt !== "to") continue;
          if (ONLY_NEXT_DET.has(lemma) && !(DET.has(nxt) || nxt === "with")) continue;
          if (lower === "used" && nxt === "to") continue;
        } else if (kind === "noun") {
          if (NOUN_VERB_PREV.has(prev.word)) continue;
        } else {
          const g = WORD_GUARDS[lower];
          if (g?.onlyAfter && !g.onlyAfter.has(prev.word)) continue;
          if (g?.notAfter && g.notAfter.has(prev.word)) continue;
          if (g?.notBefore && g.notBefore.has(nxt)) continue;
        }
        const cands: string[] = [];
        members.forEach((fs) => {
          const surface = fs[e.form];
          if (surface && surface !== lower && !cands.includes(surface)) cands.push(surface);
        });
        const cased = cands.filter((c) => !(DEGREE.has(prev.word) && ABSOLUTE.has(c))).map((c) => matchCase(tok, c));
        if (cased.length === 0) continue;
        const roll = rand();
        const pick = rand();
        if (roll < p) {
          const chosen = pickFresh(cased, pick);
          out.push(withArticle(tok, chosen, cased));
          handled = true;
        }
        break;
      }
    }
    if (!handled) out.push({ text: tok });
    i++;
  }

  // spelling variant (applies to every word; changed words become revertible)
  if (opts.dialect !== "keep") {
    for (const s of out) {
      if (!WORD_RE.test(s.text) && !/[A-Za-z]/.test(s.text)) continue;
      const converted = applySpelling(s.text, opts.dialect);
      if (converted === s.text) {
        if (s.cands) s.cands = s.cands.map((c) => applySpelling(c, opts.dialect));
        continue;
      }
      if (s.orig === undefined) {
        s.orig = s.text;
        s.cands = [converted];
      } else if (s.cands) {
        s.cands = s.cands.map((c) => applySpelling(c, opts.dialect));
      }
      s.text = converted;
    }
  }

  // merge neighbouring untouched pieces
  const merged: Seg[] = [];
  for (const s of out) {
    const last = merged[merged.length - 1];
    if (s.orig === undefined && last && last.orig === undefined) last.text += s.text;
    else merged.push({ ...s });
  }
  return { segs: merged, total, changed: merged.filter((s) => s.orig !== undefined).length };
}

/* ================================================================== decor */

const BG_PAIRS = [
  { t: "big → large", left: 4, top: 14, dur: 15, delay: 0 },
  { t: "help → assist", left: 70, top: 8, dur: 18, delay: -4 },
  { t: "quick → rapid", left: 84, top: 44, dur: 16, delay: -8 },
  { t: "idea → concept", left: 10, top: 62, dur: 19, delay: -6 },
  { t: "however → even so", left: 56, top: 78, dur: 17, delay: -11 },
  { t: "very good → excellent", left: 30, top: 90, dur: 20, delay: -2 },
  { t: "show → reveal", left: 90, top: 80, dur: 14, delay: -9 },
  { t: "in order to → to", left: 40, top: 4, dur: 21, delay: -13 },
] as const;

const BG_STARS = [
  { left: 8, top: 24, size: 12, delay: 0 },
  { left: 26, top: 52, size: 9, delay: -1.2 },
  { left: 47, top: 18, size: 11, delay: -2.3 },
  { left: 63, top: 66, size: 13, delay: -0.7 },
  { left: 78, top: 30, size: 9, delay: -3.1 },
  { left: 93, top: 14, size: 12, delay: -1.8 },
] as const;

type CatMood = "idle" | "busy" | "happy";

function ScribeCat({ mood }: { mood: CatMood }) {
  const ink = "#4338a0";
  const closed = mood === "happy";
  return (
    <svg viewBox="0 0 160 96" width="150" height="90" className={`zrw-cat zrw-${mood} block overflow-hidden`} aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="92" rx="46" ry="24" fill="#fbfaff" stroke={ink} strokeWidth="2.4" />
      <path className="zrw-tail" d="M126 88 C146 84 152 66 142 56" fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round" />
      <path className="zrw-tail" d="M126 88 C146 84 152 66 142 56" fill="none" stroke="#fbfaff" strokeWidth="5" strokeLinecap="round" />
      <g className="zrw-head">
        <path d="M47 33 L53 6 L76 22 Z" fill="#fbfaff" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M54 27 L57 14 L68 22 Z" fill="#a9b8ff" />
        <path d="M113 33 L107 6 L84 22 Z" fill="#fbfaff" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M106 27 L103 14 L92 22 Z" fill="#a9b8ff" />
        <ellipse cx="80" cy="46" rx="37" ry="30" fill="#fbfaff" stroke={ink} strokeWidth="2.4" />
        <path d="M74 20 L74 26 M80 18 L80 25 M86 20 L86 26" stroke="#a9a3f0" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="52" cy="56" rx="7" ry="4.4" fill="#ffb3cf" opacity="0.6" />
        <ellipse cx="108" cy="56" rx="7" ry="4.4" fill="#ffb3cf" opacity="0.6" />
        {closed ? (
          <g fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round">
            <path d="M55 48 Q64 38 73 48" />
            <path d="M87 48 Q96 38 105 48" />
          </g>
        ) : (
          <g className="zrw-blink">
            <ellipse cx="64" cy="46" rx="9" ry="10.5" fill="#fff" stroke={ink} strokeWidth="1.8" />
            <ellipse cx="96" cy="46" rx="9" ry="10.5" fill="#fff" stroke={ink} strokeWidth="1.8" />
            <g className="zrw-pupils">
              <ellipse cx="65" cy="48" rx="6.2" ry="7.6" fill="#4f5fd8" />
              <ellipse cx="65" cy="49" rx="3.4" ry="4.6" fill="#1b1850" />
              <circle cx="62.6" cy="44.6" r="2.3" fill="#fff" />
              <ellipse cx="97" cy="48" rx="6.2" ry="7.6" fill="#4f5fd8" />
              <ellipse cx="97" cy="49" rx="3.4" ry="4.6" fill="#1b1850" />
              <circle cx="94.6" cy="44.6" r="2.3" fill="#fff" />
            </g>
          </g>
        )}
        <path d="M77.5 56 L82.5 56 L80 59 Z" fill="#ff8fb8" />
        <path d="M80 59 L80 61 M80 61 Q76 65 72.5 62 M80 61 Q84 65 87.5 62" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M40 54 L25 51 M40 58 L26 60 M120 54 L135 51 M120 58 L134 60" stroke="#a9a3f0" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <ellipse cx="50" cy="90" rx="14" ry="9" fill="#fbfaff" stroke={ink} strokeWidth="2.2" />
      <g className="zrw-quill">
        <path d="M112 92 C124 80 134 66 142 46 C136 62 124 70 116 74 Z" fill="#6c7bff" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M112 92 L141 48" stroke="#e8ecff" strokeWidth="1.4" strokeLinecap="round" />
        <ellipse cx="110" cy="91" rx="14" ry="9" fill="#fbfaff" stroke={ink} strokeWidth="2.2" />
      </g>
      {mood === "happy" ? (
        <g fill="#ffd166" stroke="#f0a93b" strokeWidth="0.8">
          <path className="zrw-pop" d="M22 24 L24 29 L29 31 L24 33 L22 38 L20 33 L15 31 L20 29 Z" />
          <path className="zrw-pop zrw-pop2" d="M138 20 L140 25 L145 27 L140 29 L138 34 L136 29 L131 27 L136 25 Z" />
        </g>
      ) : null}
    </svg>
  );
}

/* ================================================================== component */

const SAMPLE =
  "It is very important to help people understand the benefits of regular exercise. In order to stay healthy, you should start with small goals and increase them slowly. However, many people do not know where to begin, so they often give up quickly. A good plan can make a big difference.";

export default function ContentRewriter() {
  const { t } = useTranslation();
  const tr = (key: string, fallback: string, vars?: Record<string, unknown>): string =>
    t(key, { defaultValue: fallback, ...vars }) as string;

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("fluency");
  const [dialect, setDialect] = useState<Dialect>("keep");
  const [strength, setStrength] = useState(55);
  const [seed, setSeed] = useState(7);
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pop, setPop] = useState<{ i: number; x: number; y: number } | null>(null);
  const [tick, setTick] = useState(0);

  const outRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const busyTimer = useRef(0);
  const doneTimer = useRef(0);
  const ran = useRef(false);

  const tooLong = input.length > MAX_CHARS;
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;
  const outText = useMemo(() => (res ? res.segs.map((s) => s.text).join("") : ""), [res]);
  const outWords = outText.trim() ? outText.trim().split(/\s+/).length : 0;

  const compute = useCallback(
    (nextSeed: number) => {
      if (!input.trim() || input.length > MAX_CHARS) {
        setRes(null);
        return;
      }
      setRes(rewriteText(input, { mode, strength, seed: nextSeed, dialect }));
      setPop(null);
      setTick((n) => n + 1);
    },
    [input, mode, strength, dialect],
  );

  const flashDone = () => {
    setDone(true);
    window.clearTimeout(doneTimer.current);
    doneTimer.current = window.setTimeout(() => setDone(false), 2200);
  };

  const onRewrite = () => {
    if (!input.trim() || tooLong || busy) return;
    const nextSeed = ran.current ? seed + 1 : seed;
    setSeed(nextSeed);
    ran.current = true;
    setBusy(true);
    setDone(false);
    window.clearTimeout(busyTimer.current);
    busyTimer.current = window.setTimeout(() => {
      compute(nextSeed);
      setBusy(false);
      flashDone();
    }, 420);
  };

  // live update when the options change after a first rewrite
  useEffect(() => {
    if (!ran.current) return;
    const id = window.setTimeout(() => compute(seed), 90);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, dialect, strength]);

  useEffect(
    () => () => {
      window.clearTimeout(busyTimer.current);
      window.clearTimeout(doneTimer.current);
    },
    [],
  );

  // close the alternatives menu
  useEffect(() => {
    if (!pop) return;
    const onDown = (e: PointerEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest?.("[data-zrw-seg]")) setPop(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pop]);

  const choose = (index: number, value: string) => {
    setRes((r) => (r ? { ...r, segs: r.segs.map((s, i) => (i === index ? { ...s, text: value } : s)) } : r));
    setPop(null);
  };

  const openPop = (e: React.MouseEvent<HTMLButtonElement>, i: number) => {
    const c = outRef.current?.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    if (!c) return;
    setPop({ i, x: Math.max(0, Math.min(r.left - c.left, c.width - 232)), y: r.bottom - c.top + 6 });
  };

  const copyOut = async () => {
    if (!outText) return;
    if (await copyToClipboard(outText)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const useAsInput = () => {
    if (!outText) return;
    setInput(outText);
    setRes(null);
    ran.current = false;
  };

  const clearAll = () => {
    setInput("");
    setRes(null);
    ran.current = false;
  };

  const mood: CatMood = busy ? "busy" : done ? "happy" : "idle";
  const bubble = busy
    ? tr("tool.rewriter.catBusy", "Rewriting…")
    : done
      ? res && res.changed > 0
        ? tr("tool.rewriter.catDone", "All done! Click a highlighted word to swap it.")
        : tr("tool.rewriter.catNone", "Nothing to swap in this text.")
      : tr("tool.rewriter.catIdle", "Paste a text and I'll rewrite it!");

  const tab = (active: boolean) =>
    `relative px-1 pb-2 text-sm font-semibold transition ${active ? "text-indigo-700 dark:text-indigo-300" : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"}`;
  const hl =
    "zrw-in mx-px cursor-pointer rounded-md bg-sky-100 px-1 py-px font-medium text-sky-900 underline decoration-sky-400/70 decoration-dotted underline-offset-4 outline-none transition hover:bg-sky-200 focus-visible:ring-2 focus-visible:ring-indigo-400 dark:bg-sky-400/20 dark:text-sky-100 dark:hover:bg-sky-400/30";

  return (
    <div className="zrw-root relative isolate overflow-hidden rounded-[2rem] p-3 sm:p-8">
      <style>{`
        @keyframes zrw-blob-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(70px,40px,0) scale(1.12); } }
        @keyframes zrw-blob-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-60px,-30px,0) scale(0.94); } }
        @keyframes zrw-blob-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(40px,-50px,0) scale(1.14); } }
        @keyframes zrw-float { 0%,100% { transform: translateY(0); opacity: 0.25; } 50% { transform: translateY(-22px); opacity: 0.75; } }
        @keyframes zrw-twinkle { 0%,100% { opacity: 0.2; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes zrw-in { from { opacity: 0; transform: translateY(5px) scale(0.96); } to { opacity: 1; transform: none; } }
        @keyframes zrw-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
        @keyframes zrw-shine { 0%,55% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        @keyframes zrw-blink { 0%,93%,100% { transform: scaleY(1); } 96% { transform: scaleY(0.08); } }
        @keyframes zrw-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
        @keyframes zrw-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
        @keyframes zrw-write { 0% { transform: translate(0,0) rotate(-6deg); } 50% { transform: translate(-6px,3px) rotate(6deg); } 100% { transform: translate(3px,-1px) rotate(-6deg); } }
        @keyframes zrw-pop { 0%,100% { transform: scale(0.6); opacity: 0.4; } 50% { transform: scale(1.15); opacity: 1; } }
        .zrw-blob { will-change: transform; }
        .zrw-blob-a { animation: zrw-blob-a 26s ease-in-out infinite; }
        .zrw-blob-b { animation: zrw-blob-b 31s ease-in-out infinite; }
        .zrw-blob-c { animation: zrw-blob-c 28s ease-in-out infinite; }
        .zrw-pair { position: absolute; white-space: nowrap; animation: zrw-float ease-in-out infinite; }
        .zrw-star { position: absolute; animation: zrw-twinkle ease-in-out infinite; }
        .zrw-in { display: inline-block; animation: zrw-in 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .zrw-skel { background: linear-gradient(90deg, rgba(129,140,248,0.12) 25%, rgba(129,140,248,0.3) 50%, rgba(129,140,248,0.12) 75%); background-size: 200% 100%; animation: zrw-shimmer 1.2s linear infinite; }
        .zrw-shine { position: relative; overflow: hidden; }
        .zrw-shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%); transform: translateX(-130%); animation: zrw-shine 4.2s ease-in-out infinite; }
        .zrw-shine:disabled::after { display: none; }
        .zrw-cat .zrw-blink { transform-box: fill-box; transform-origin: center; animation: zrw-blink 5s infinite; }
        .zrw-cat .zrw-head { transform-origin: 80px 70px; animation: zrw-bob 3.6s ease-in-out infinite; }
        .zrw-cat .zrw-tail { transform-origin: 126px 88px; animation: zrw-tail 2.8s ease-in-out infinite; }
        .zrw-cat .zrw-quill { transform-origin: 112px 90px; }
        .zrw-busy .zrw-quill { animation: zrw-write 0.3s ease-in-out infinite alternate; }
        .zrw-busy .zrw-pupils { transform: translate(0, 3px); }
        .zrw-cat .zrw-pop { transform-box: fill-box; transform-origin: center; animation: zrw-pop 1.1s ease-in-out infinite; }
        .zrw-cat .zrw-pop2 { animation-delay: -0.5s; }
        @media (prefers-reduced-motion: reduce) {
          .zrw-blob, .zrw-pair, .zrw-star, .zrw-in, .zrw-skel, .zrw-shine::after, .zrw-cat * { animation: none !important; transition: none !important; }
          .zrw-pair { opacity: 0.4; }
        }
      `}</style>

      {/* animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-sky-50 to-rose-50 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900" />
        <div className="zrw-blob zrw-blob-a absolute -left-28 -top-24 h-[26rem] w-[32rem] rounded-full bg-gradient-to-r from-indigo-300/50 to-violet-300/40 blur-3xl dark:from-indigo-500/25 dark:to-violet-500/20" />
        <div className="zrw-blob zrw-blob-b absolute -right-28 top-1/4 h-[28rem] w-[30rem] rounded-full bg-gradient-to-l from-sky-300/50 to-cyan-200/40 blur-3xl dark:from-sky-400/20 dark:to-cyan-400/15" />
        <div className="zrw-blob zrw-blob-c absolute -bottom-32 left-1/3 h-80 w-[28rem] rounded-full bg-gradient-to-r from-rose-200/60 to-amber-100/40 blur-3xl dark:from-rose-500/15 dark:to-amber-400/10" />
        {BG_PAIRS.map((pr, index) => (
          <span
            key={`pair-${index}`}
            className="zrw-pair rounded-full border border-indigo-300/40 bg-white/40 px-3 py-1 text-xs font-semibold text-indigo-500/80 backdrop-blur-sm dark:border-indigo-300/20 dark:bg-white/5 dark:text-indigo-200/80"
            style={{ left: `${pr.left}%`, top: `${pr.top}%`, animationDuration: `${pr.dur}s`, animationDelay: `${pr.delay}s` } as CSSProperties}
          >
            {pr.t}
          </span>
        ))}
        {BG_STARS.map((s, index) => (
          <svg
            key={`star-${index}`}
            className="zrw-star text-amber-300 dark:text-yellow-100"
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

      {/* cat + bubble */}
      <div className="mb-1 flex items-end justify-end gap-2 pr-3">
        <p
          aria-live="polite"
          className="relative mb-8 max-w-[16rem] rounded-2xl rounded-br-sm border border-indigo-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-indigo-800 shadow-md shadow-indigo-300/30 dark:border-indigo-800 dark:bg-slate-900/90 dark:text-indigo-200"
        >
          {bubble}
        </p>
        <ScribeCat mood={mood} />
      </div>

      {/* tool card */}
      <section className="overflow-visible rounded-3xl border border-white/80 bg-white/80 shadow-[0_28px_70px_-34px_rgba(67,56,160,0.55)] ring-1 ring-indigo-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:ring-indigo-300/10">
        {/* toolbar */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-indigo-100 px-4 pb-0 pt-4 sm:px-6 dark:border-white/10">
          <div className="flex items-end gap-4" role="tablist" aria-label={tr("tool.rewriter.modes", "Modes")}>
            <span className="pb-2 text-xs font-bold text-ink-700 dark:text-ink-200">{tr("tool.rewriter.modes", "Modes")}:</span>
            {(
              [
                ["standard", tr("tool.rewriter.standard", "Standard")],
                ["fluency", tr("tool.rewriter.fluency", "Fluency")],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={tab(mode === id)}>
                {label}
                {mode === id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" />}
              </button>
            ))}
          </div>

          <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-ink-200">
            <Languages className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            <span className="sr-only">{tr("tool.rewriter.spelling", "Spelling")}</span>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              className="rounded-lg border border-indigo-100 bg-white/90 px-2 py-1.5 text-sm font-medium text-ink-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/70 dark:border-indigo-900/60 dark:bg-slate-950/70 dark:text-ink-100"
            >
              <option value="keep">{tr("tool.rewriter.dialectKeep", "English (keep my spelling)")}</option>
              <option value="us">{tr("tool.rewriter.dialectUs", "English (US)")}</option>
              <option value="uk">{tr("tool.rewriter.dialectUk", "English (UK)")}</option>
            </select>
          </label>

          <label className="mb-2 ml-auto flex min-w-[12rem] flex-1 items-center gap-3 text-xs font-bold text-ink-700 sm:max-w-sm dark:text-ink-200">
            <span>{tr("tool.rewriter.synonyms", "Synonyms")}:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              aria-label={tr("tool.rewriter.synonyms", "Synonyms")}
              className="w-full accent-indigo-500"
            />
            <span className="w-9 text-right tabular-nums text-indigo-600 dark:text-indigo-300">{strength}%</span>
          </label>
        </div>

        {/* panes */}
        <div className="grid md:grid-cols-2">
          {/* input */}
          <div className="flex min-h-[26rem] flex-col border-b border-indigo-100 md:border-b-0 md:border-r dark:border-white/10">
            <div className="relative flex-1 p-4 sm:p-6">
              <label htmlFor="rewriter-input" className="sr-only">
                {tr("tool.rewriter.inputLabel", "Text to rewrite")}
              </label>
              <textarea
                id="rewriter-input"
                dir="auto"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onRewrite();
                }}
                placeholder={tr("tool.rewriter.placeholder", "Paste or type the text you want to rewrite…")}
                className="box-border h-full min-h-[20rem] w-full resize-none bg-transparent font-sans pr-8 text-base leading-7 text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-100"
              />
              {input && (
                <button
                  type="button"
                  onClick={clearAll}
                  aria-label={tr("tool.rewriter.clear", "Clear")}
                  title={tr("tool.rewriter.clear", "Clear")}
                  className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 sm:right-5 sm:top-5 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              {!input && (
                <button
                  type="button"
                  onClick={() => setInput(SAMPLE)}
                  className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-50 sm:left-6 dark:border-indigo-800 dark:bg-slate-900/80 dark:text-indigo-200"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr("tool.rewriter.example", "Try an example")}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 px-4 pb-4 sm:px-6 sm:pb-6">
              <span className={`text-sm font-semibold ${tooLong ? "text-rose-600" : "text-ink-500 dark:text-ink-400"}`}>
                {tooLong
                  ? tr("tool.rewriter.tooLong", "Limit: {{limit}} characters", { limit: MAX_CHARS.toLocaleString() })
                  : tr("tool.rewriter.words", "{{n}} Words", { n: words.toLocaleString() })}
              </span>
              <button
                type="button"
                onClick={onRewrite}
                disabled={!input.trim() || tooLong || busy}
                className="zrw-shine inline-flex min-w-[9rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                {busy ? tr("tool.rewriter.rewriting", "Rewriting…") : res ? tr("tool.rewriter.rewriteAgain", "Rewrite again") : tr("tool.rewriter.rewrite", "Rewrite")}
              </button>
            </div>
          </div>

          {/* output */}
          <div className="flex min-h-[26rem] flex-col">
            <div ref={outRef} className="relative flex-1 p-4 sm:p-6" aria-live="polite">
              {busy ? (
                <div className="space-y-3 pt-1" aria-hidden="true">
                  {[92, 100, 84, 96, 60].map((w, k) => (
                    <div key={k} className="zrw-skel h-4 rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : res ? (
                <>
                  <p dir="auto" key={tick} className="whitespace-pre-wrap break-words text-base leading-8 text-ink-900 dark:text-ink-100">
                    {res.segs.map((s, idx) =>
                      s.orig === undefined ? (
                        <span key={idx}>{s.text}</span>
                      ) : (
                        <button
                          key={idx}
                          type="button"
                          data-zrw-seg=""
                          onClick={(e) => openPop(e, idx)}
                          className={hl}
                          style={{ animationDelay: `${Math.min(idx * 12, 700)}ms` }}
                          aria-haspopup="menu"
                          aria-label={`${s.text} — ${tr("tool.rewriter.original", "Original")}: ${s.orig}`}
                        >
                          {s.text}
                        </button>
                      ),
                    )}
                  </p>
                  {res.changed === 0 && (
                    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                      {tr("tool.rewriter.noChange", "No replaceable words found. The built-in dictionary covers common English words only; try raising Synonyms or switching to Fluency.")}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-base leading-7 text-ink-400 dark:text-ink-500">{tr("tool.rewriter.outputPlaceholder", "Your rewritten text will appear here.")}</p>
              )}

              {pop && res && res.segs[pop.i]?.orig !== undefined && (
                <div
                  ref={popRef}
                  role="menu"
                  className="absolute z-20 w-56 overflow-hidden rounded-2xl border border-indigo-200 bg-white/95 p-1.5 shadow-xl shadow-indigo-300/30 backdrop-blur dark:border-indigo-800 dark:bg-slate-900/95"
                  style={{ left: pop.x, top: pop.y }}
                >
                  {(res.segs[pop.i]?.cands ?? []).map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="menuitem"
                      onClick={() => choose(pop.i, c)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-sm transition hover:bg-indigo-50 dark:hover:bg-indigo-950/60 ${res.segs[pop.i]?.text === c ? "font-bold text-indigo-700 dark:text-indigo-300" : "text-ink-800 dark:text-ink-100"}`}
                    >
                      {c}
                      {res.segs[pop.i]?.text === c && <Check className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => choose(pop.i, res.segs[pop.i]?.orig ?? "")}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-indigo-100 px-3 py-2 text-start text-xs font-semibold text-ink-600 transition hover:bg-rose-50 dark:border-white/10 dark:text-ink-300 dark:hover:bg-rose-950/30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    {tr("tool.rewriter.original", "Original")}: {res.segs[pop.i]?.orig}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4 sm:px-6 sm:pb-6">
              <span className="text-sm font-semibold text-ink-500 dark:text-ink-400">
                {res
                  ? tr("tool.rewriter.stats", "{{changed}} changes · {{words}} words", { changed: res.changed.toLocaleString(), words: outWords.toLocaleString() })
                  : " "}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={useAsInput}
                  disabled={!res}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white/80 px-3 py-2.5 text-xs font-bold text-indigo-800 transition hover:-translate-y-0.5 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:bg-slate-900/70 dark:text-indigo-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr("tool.rewriter.useAsInput", "Use as input")}
                </button>
                <button
                  type="button"
                  onClick={copyOut}
                  disabled={!res}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                  {copied ? tr("tool.rewriter.copied", "Copied") : tr("tool.rewriter.copy", "Copy")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-5 text-ink-600 dark:text-ink-300">
        {tr("tool.rewriter.hint", "Highlighted words can be changed: click one to pick another option or go back to the original.")}{" "}
        {tr("tool.rewriter.disclaimer", "This tool runs in your browser with a built-in synonym dictionary. It is not a large language model, so always read the result before you use it. Nothing is sent or saved.")}
      </p>
    </div>
  );
}
