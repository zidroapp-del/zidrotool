import { useMemo, useState } from "react";
import { ToolIO } from "@/components/ToolIO";

const BASES = [
  { label: "Binary", radix: 2 },
  { label: "Octal", radix: 8 },
  { label: "Decimal", radix: 10 },
  { label: "Hexadecimal", radix: 16 },
];

export default function NumberBaseConverter() {
  const [input, setInput] = useState("");
  const [fromBase, setFromBase] = useState(10);

  const results = useMemo<Record<number, string>>(() => {
    const trimmed = input.trim();
    if (!trimmed) return { 2: "", 8: "", 10: "", 16: "" };
    const neg = trimmed.startsWith("-");
    const clean = neg ? trimmed.slice(1) : trimmed;
    const num = parseInt(clean, fromBase);
    if (isNaN(num)) return { 2: "Invalid", 8: "Invalid", 10: "Invalid", 16: "Invalid" };
    const sign = neg ? "-" : "";
    return {
      2: sign + num.toString(2),
      8: sign + num.toString(8),
      10: sign + num.toString(10),
      16: sign + num.toString(16).toUpperCase(),
    };
  }, [input, fromBase]);

  const output = BASES.map((b) => `${b.label}: ${results[b.radix]}`).join("\n");

  return (
    <div>
      <div className="mb-4">
        <label className="label">Input base</label>
        <div className="flex gap-2">
          {BASES.map((b) => (
            <button
              key={b.radix}
              onClick={() => setFromBase(b.radix)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                fromBase === b.radix ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <ToolIO
        input={input}
        onInputChange={setInput}
        output={output}
        inputPlaceholder={`Enter a ${BASES.find((b) => b.radix === fromBase)?.label} number…`}
      />
    </div>
  );
}
