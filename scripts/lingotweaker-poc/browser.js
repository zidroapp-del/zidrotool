import init, { LtEngine } from "lingotweaker-wasm";

const input = document.querySelector("#text");
const button = document.querySelector("#check");
const status = document.querySelector("#status");
const results = document.querySelector("#results");

let engine = null;
let enginePromise = null;
let stage = "Waiting for test";

async function getEngine() {
  if (engine) return engine;
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    stage = "Initialize WebAssembly";
    status.textContent = stage + "...";

    const wasmUrl = new URL(
      "/lingotweaker-poc/lt_wasm_bg.wasm",
      window.location.origin
    );

    await init({ module_or_path: wasmUrl });

    stage = "Fetch English data";
    status.textContent = stage + "...";

  const packUrl = new URL(
  "/lingotweaker-poc/packs/en.pack",
  window.location.origin
);

const response = await fetch(packUrl.href, {
  cache: "no-store"
});

if (!response.ok) {
  throw new Error(
    `English pack request failed: HTTP ${response.status} at ${packUrl.href}`
  );
}

const pack = new Uint8Array(await response.arrayBuffer());

stage = "Build proofreading engine";
status.textContent = stage + "...";


    engine = new LtEngine(
      "en-US",
      pack,
      JSON.stringify({ today: new Date().toISOString() })
    );

    return engine;
  })().catch(error => {
    enginePromise = null;
    throw error;
  });

  return enginePromise;
}

button.addEventListener("click", async () => {
  if (!input.value.trim()) {
    status.textContent = "Enter some text first.";
    return;
  }

  button.disabled = true;
  results.replaceChildren();
  status.textContent = "Starting the check...";

  try {
    const checker = await getEngine();

    stage = "Check text";
    const startedAt = performance.now();
    const result = JSON.parse(checker.check_json(input.value));
    const matches = result.matches ?? [];

    status.textContent =
      `Found ${matches.length} issue(s) in ` +
      `${(performance.now() - startedAt).toFixed(1)} ms.`;

    for (const match of matches) {
      const item = document.createElement("li");
      const suggestions = (match.suggestions ?? [])
        .map(s => s.value)
        .filter(Boolean);

      item.textContent =
        `${match.category_name ?? match.category_id ?? "Issue"}: ` +
        `${String(match.message ?? "").replace(/<[^>]*>/g, "")} ` +
        `Suggestions: ${suggestions.join(", ") || "none"}`;

      results.append(item);
    }

    if (matches.length === 0) {
      results.textContent = "No issues detected.";
    }
  } catch (error) {
    console.error("LingoTweaker test failed at:", stage, error);
    status.textContent =
      `Test failed during "${stage}": ` +
      `${error instanceof Error ? error.message : String(error)}`;
  } finally {
    button.disabled = false;
  }
});


