import init, { LtEngine } from "lingotweaker-wasm";
import { fetchPack } from "lingotweaker-wasm/pack";

let engine = null;
let enginePromise = null;

async function getEngine() {
  if (engine) return engine;

  if (!enginePromise) {
    enginePromise = (async () => {
      self.postMessage({
        type: "status",
        message: "Loading WebAssembly and English language data..."
      });

      await init();

      const pack = await fetchPack("en", {
        baseUrl: "/lingotweaker-poc"
      });

      self.postMessage({
        type: "status",
        message: "Preparing English proofreading rules..."
      });

      engine = new LtEngine(
        "en-US",
        pack,
        JSON.stringify({ today: new Date().toISOString() })
      );

      return engine;
    })();
  }

  try {
    return await enginePromise;
  } catch (error) {
    enginePromise = null;
    throw error;
  }
}

self.addEventListener("message", async (event) => {
  if (event.data?.type !== "check") return;

  try {
    const checker = await getEngine();
    const startedAt = performance.now();
    const parsed = JSON.parse(checker.check_json(event.data.text));

    self.postMessage({
      type: "result",
      matches: parsed.matches ?? [],
      elapsedMs: Number((performance.now() - startedAt).toFixed(1)),
      activeRuleCount: checker.active_rule_count()
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});
