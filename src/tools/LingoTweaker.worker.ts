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
      cache: "force-cache"
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

function applySuggestions(text: string, matches: GrammarMatch[]): string {
  const offsets = createByteOffsetMap(text);

  const fixes = matches.flatMap((match) => {
    if (!match.range || !match.suggestions?.length) return [];

    const start = offsets.get(match.range.start);
    const end = offsets.get(match.range.end);
    const replacement = match.suggestions[0]?.value;

    if (
      start === undefined ||
      end === undefined ||
      start > end ||
      typeof replacement !== "string"
    ) {
      return [];
    }

    return [{ start, end, replacement }];
  }).sort((a, b) => b.start - a.start || b.end - a.end);

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
      const corrected = applySuggestions(text, matches);

      workerScope.postMessage({
        id,
        type: "result",
        corrected,
        issueCount: matches.length
      });
    } catch (error) {
      workerScope.postMessage({
        id,
        type: "error",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  })();
});
