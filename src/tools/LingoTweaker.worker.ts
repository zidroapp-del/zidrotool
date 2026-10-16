
import init, { LtEngine } from "lingotweaker-wasm";

type CheckRequest = { id: number; text: string };

type GrammarMatch = {
  range?: { start: number; end: number };
  suggestions?: Array<{ value?: string }>;
};

type WorkerResponse =
  | { id: number; type: "result"; corrected: string; issueCount: number }
  | { id: number; type: "error"; message: string };

const workerScope = self as unknown as {
  location: Location;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<CheckRequest>) => void
  ): void;
  postMessage(message: WorkerResponse): void;
};

let enginePromise: Promise<LtEngine> | null = null;

const PAST_TIME_CUE =
  /\b(?:yesterday|last\s+(?:night|week|month|year|weekend)|\d+\s+(?:days?|weeks?|months?|years?)\s+ago)\b/i;

const PAST_FORMS: Record<string, string> = {
  go: "went",
  goes: "went",
  do: "did",
  does: "did",
  have: "had",
  has: "had",
  buy: "bought",
  buys: "bought",
  eat: "ate",
  eats: "ate",
  see: "saw",
  sees: "saw",
  come: "came",
  comes: "came",
  make: "made",
  makes: "made",
  take: "took",
  takes: "took",
  get: "got",
  gets: "got",
  write: "wrote",
  writes: "wrote",
  speak: "spoke",
  speaks: "spoke",
  run: "ran",
  runs: "ran",
  leave: "left",
  leaves: "left",
  feel: "felt",
  feels: "felt",
  say: "said",
  says: "said",
  tell: "told",
  tells: "told",
  think: "thought",
  thinks: "thought",
  find: "found",
  finds: "found",
  give: "gave",
  gives: "gave",
  meet: "met",
  meets: "met",
  bring: "brought",
  brings: "brought",
  catch: "caught",
  catches: "caught",
  sleep: "slept",
  sleeps: "slept",
  play: "played",
  plays: "played",
  work: "worked",
  works: "worked",
  walk: "walked",
  walks: "walked",
  talk: "talked",
  talks: "talked",
  watch: "watched",
  watches: "watched",
  live: "lived",
  lives: "lived",
  want: "wanted",
  wants: "wanted",
  need: "needed",
  needs: "needed",
  study: "studied",
  studies: "studied",
  use: "used",
  uses: "used",
  call: "called",
  calls: "called",
  like: "liked",
  likes: "liked",
};

async function getEngine(): Promise<LtEngine> {
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const wasmUrl = new URL(
      "/grammar-checker/lt_wasm_bg.wasm",
      workerScope.location.origin
    );

    await init({ module_or_path: wasmUrl });

    const packUrl = new URL(
      "/grammar-checker/en.pack",
      workerScope.location.origin
    );

    const response = await fetch(packUrl.href, {
      cache: "force-cache",
    });

    if (!response.ok) {
      throw new Error(
        `English language data failed to load: HTTP ${response.status}`
      );
    }

    const pack = new Uint8Array(await response.arrayBuffer());

    return new LtEngine(
      "en-US",
      pack,
      JSON.stringify({ today: new Date().toISOString() })
    );
  })().catch((error: unknown) => {
    enginePromise = null;
    throw error;
  });

  return enginePromise;
}

function createByteOffsetMap(text: string): Map<number, number> {
  const offsets = new Map<number, number>();
  const encoder = new TextEncoder();
  let bytes = 0;
  let utf16 = 0;

  offsets.set(0, 0);

  for (const character of text) {
    bytes += encoder.encode(character).length;
    utf16 += character.length;
    offsets.set(bytes, utf16);
  }

  return offsets;
}

function getSentenceAround(
  text: string,
  start: number,
  end: number
): string {
  const boundaryBefore = Math.max(
    text.lastIndexOf(".", Math.max(0, start - 1)),
    text.lastIndexOf("!", Math.max(0, start - 1)),
    text.lastIndexOf("?", Math.max(0, start - 1)),
    text.lastIndexOf("\n", Math.max(0, start - 1))
  );

  const endCandidates = [
    text.indexOf(".", end),
    text.indexOf("!", end),
    text.indexOf("?", end),
    text.indexOf("\n", end),
  ].filter((index) => index !== -1);

  const sentenceEnd =
    endCandidates.length > 0 ? Math.min(...endCandidates) : text.length;

  return text.slice(boundaryBefore + 1, sentenceEnd);
}

function preserveCase(original: string, replacement: string): string {
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }

  if (
    original.length > 0 &&
    original[0] === original[0].toUpperCase()
  ) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }

  return replacement;
}

function chooseSuggestion(
  text: string,
  start: number,
  end: number,
  suggestions: Array<{ value?: string }>
): string | undefined {
  const original = text.slice(start, end);
  const pastForm = PAST_FORMS[original.toLowerCase()];
  const sentence = getSentenceAround(text, start, end);

  if (pastForm && PAST_TIME_CUE.test(sentence)) {
    const contextualSuggestion = suggestions.find(
      (suggestion) =>
        suggestion.value?.toLowerCase() === pastForm
    );

    if (contextualSuggestion?.value) {
      return contextualSuggestion.value;
    }
  }

  return suggestions.find(
    (suggestion) => typeof suggestion.value === "string"
  )?.value;
}

function applySuggestions(text: string, matches: GrammarMatch[]): string {
  const offsets = createByteOffsetMap(text);

  const fixes = matches
    .flatMap((match) => {
      if (!match.range || !match.suggestions?.length) return [];

      const start = offsets.get(match.range.start);
      const end = offsets.get(match.range.end);

      if (
        start === undefined ||
        end === undefined ||
        start > end
      ) {
        return [];
      }

      const replacement = chooseSuggestion(
        text,
        start,
        end,
        match.suggestions
      );

      if (typeof replacement !== "string") return [];

      return [{ start, end, replacement }];
    })
    .sort((a, b) => b.start - a.start || b.end - a.end);

  let corrected = text;
  let leftBoundary = Number.POSITIVE_INFINITY;

  for (const fix of fixes) {
    if (fix.end > leftBoundary) continue;

    corrected =
      corrected.slice(0, fix.start) +
      fix.replacement +
      corrected.slice(fix.end);

    leftBoundary = fix.start;
  }

  return corrected;
}

/**
 * Limited fallback for a recognizable past-time cue followed shortly
 * by a subject and a known present-tense verb.
 */
function applyPastTenseFallback(text: string): string {
  return text.replace(/[^.!?\n]+[.!?]?/g, (sentence) => {
    const cue = PAST_TIME_CUE.exec(sentence);

    if (!cue || cue.index === undefined) return sentence;

    const afterCue = sentence.slice(cue.index + cue[0].length);

    const candidate =
      /\b(I|we|you|they|he|she|it)\s+(go|goes|do|does|have|has|buy|buys|eat|eats|see|sees|come|comes|make|makes|take|takes|get|gets|write|writes|speak|speaks|run|runs|leave|leaves|feel|feels|say|says|tell|tells|think|thinks|find|finds|give|gives|meet|meets|bring|brings|catch|catches|sleep|sleeps|play|plays|work|works|walk|walks|talk|talks|watch|watches|live|lives|want|wants|need|needs|study|studies|use|uses|call|calls|like|likes)\b/i.exec(
        afterCue
      );

    if (!candidate || candidate.index > 40) return sentence;

    const originalVerb = candidate[2];
    const pastForm = PAST_FORMS[originalVerb.toLowerCase()];

    if (!pastForm) return sentence;

    const verbStart =
      cue.index + cue[0].length + candidate.index +
      candidate[0].lastIndexOf(originalVerb);

    const verbEnd = verbStart + originalVerb.length;
    const replacement = preserveCase(originalVerb, pastForm);

    return (
      sentence.slice(0, verbStart) +
      replacement +
      sentence.slice(verbEnd)
    );
  });
}

workerScope.addEventListener("message", (event) => {
  const { id, text } = event.data;

  void (async () => {
    try {
      if (typeof text !== "string") {
        throw new Error("Invalid text sent to grammar checker.");
      }

      const engine = await getEngine();
      const raw = JSON.parse(engine.check_json(text)) as {
        matches?: GrammarMatch[];
      };

      const matches = raw.matches ?? [];
      const suggested = applySuggestions(text, matches);
      const corrected = applyPastTenseFallback(suggested);

      workerScope.postMessage({
        id,
        type: "result",
        corrected,
        issueCount:
          matches.length + (corrected !== suggested ? 1 : 0),
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
