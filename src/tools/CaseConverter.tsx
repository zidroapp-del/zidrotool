import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToolIO } from "@/components/ToolIO";
import { cn } from "@/lib/utils";

const CASES = [
  { key: "upper", label: "UPPER CASE" },
  { key: "lower", label: "lower case" },
  { key: "title", label: "Title Case" },
  { key: "sentence", label: "Sentence case" },
  { key: "camel", label: "camelCase" },
  { key: "pascal", label: "PascalCase" },
  { key: "snake", label: "snake_case" },
  { key: "kebab", label: "kebab-case" },
  { key: "constant", label: "CONSTANT_CASE" },
];

function convert(text: string, key: string): string {
  switch (key) {
    case "upper": return text.toUpperCase();
    case "lower": return text.toLowerCase();
    case "title": return text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
    case "sentence": return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    case "camel": return text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toLowerCase());
    case "pascal": return text.toLowerCase().replace(/(?:^|[^a-zA-Z0-9]+)(.)/g, (_, c) => c.toUpperCase());
    case "snake": return text.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    case "kebab": return text.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    case "constant": return text.trim().toUpperCase().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    default: return text;
  }
}

export default function CaseConverter() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [activeCase, setActiveCase] = useState("upper");

  const output = useMemo(() => convert(input, activeCase), [input, activeCase]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {CASES.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCase(c.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeCase === c.key
                ? "bg-brand-600 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ToolIO
        input={input}
        onInputChange={setInput}
        output={output}
        inputPlaceholder="Type or paste your text here…"
      />
    </div>
  );
}
