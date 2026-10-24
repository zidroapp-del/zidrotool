import { performance } from "node:perf_hooks";
import { LtEngine } from "lingotweaker-wasm/node";
import { fetchPack } from "lingotweaker-wasm/pack";

export const SAMPLE_TEXT = "yesterday i go to the school and i see my freind. we was very happy because we didnt meet since two month. the weather was very nice , and we decide to play football after class . i have alot of homeworks to do, but i dont want to miss this opportunity. she tell me that learning english are important for our future";

const startedAt = performance.now();
const packStartedAt = performance.now();
const pack = await fetchPack("en");
const packLoadedAt = performance.now();
const engine = new LtEngine("en-US", pack, JSON.stringify({ today: new Date().toISOString() }));
const engineReadyAt = performance.now();
const result = JSON.parse(engine.check_json(SAMPLE_TEXT));
const checkedAt = performance.now();

console.log(JSON.stringify({
  lang: engine.lang(),
  activeRuleCount: engine.active_rule_count(),
  packBytesInflated: pack.byteLength,
  timingsMs: {
    packReadAndInflate: Number((packLoadedAt - packStartedAt).toFixed(1)),
    engineBuild: Number((engineReadyAt - packLoadedAt).toFixed(1)),
    check: Number((checkedAt - engineReadyAt).toFixed(1)),
    totalColdStart: Number((checkedAt - startedAt).toFixed(1)),
  },
  matches: result.matches,
}, null, 2));
engine.free();
