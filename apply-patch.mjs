// Run from the project root:  node apply-patch.mjs
import fs from "node:fs";
const file = "src/components/ToolLayout.tsx";
if (!fs.existsSync(file)) { console.error("Run this from the project folder (where package.json is)."); process.exit(1); }
let s = fs.readFileSync(file, "utf8");
if (s.includes("landing?: ToolLanding")) { console.log("Already patched. Nothing to do."); process.exit(0); }
fs.writeFileSync(file + ".bak", s);
const edits = [
  ['import { ToolSEOContent } from "@/components/ToolSEOContent";', 'import { ToolSEOContent } from "@/components/ToolSEOContent";\nimport type { ToolLanding } from "@/data/toolLandings";'],
  ["  onLoadSample?: () => void;\n}", "  onLoadSample?: () => void;\n  landing?: ToolLanding;\n}"],
  ["  slug,\n}: ToolLayoutProps) {", "  slug,\n  landing,\n}: ToolLayoutProps) {"],
  ["url: `https://zidrotool.com/tools/${tool.slug}`,\n      brand", "url: `https://zidrotool.com/tools/${landing?.slug ?? tool.slug}`,\n      brand"],
  ["  }, [tool, t]);\n\n  const breadcrumbJsonLd", "  }, [tool, landing, t]);\n\n  const breadcrumbJsonLd"],
  ["      name: t(tool.nameKey),\n      item: `https://zidrotool.com/tools/${tool.slug}`,\n    });", "      name: landing ? landing.h1 : t(tool.nameKey),\n      item: `https://zidrotool.com/tools/${landing?.slug ?? tool.slug}`,\n    });"],
  ["  }, [tool, category, t]);", "  }, [tool, category, landing, t]);"],
  ["        keywords={tool.keywords}", "        keywords={landing ? landing.keywords : tool.keywords}"],
  ["                {t(tool.nameKey)}\n              </h1>", "                {landing ? landing.h1 : t(tool.nameKey)}\n              </h1>"],
  ["        <ToolSEOContent tool={tool} />", "        {!landing && <ToolSEOContent tool={tool} />}"],
];
let failed = 0;
for (const [a, b] of edits) {
  const n = s.split(a).length - 1;
  if (n !== 1) { failed++; console.error("NOT FOUND (" + n + "x): " + a.split("\n")[0]); continue; }
  s = s.replace(a, b);
}
if (failed) { console.error(failed + " edit(s) failed. File NOT changed. Send me this message."); process.exit(1); }
fs.writeFileSync(file, s);
console.log("ToolLayout.tsx patched OK (backup: ToolLayout.tsx.bak)");
