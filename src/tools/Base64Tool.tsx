import { useMemo, useState } from "react";
import { ToolIO } from "@/components/ToolIO";
import { ToolError } from "@/components/ToolIO";
import { cn } from "@/lib/utils";

type Mode = "encode" | "decode";

export default function Base64Tool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [error, setError] = useState("");

  const output = useMemo(() => {
    setError("");
    if (!input) return "";
    try {
      if (mode === "encode") {
        return btoa(unescape(encodeURIComponent(input)));
      } else {
        return decodeURIComponent(escape(atob(input.trim())));
      }
    } catch {
      setError("Invalid Base64 input. Please check your text.");
      return "";
    }
  }, [input, mode]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["encode", "decode"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              mode === m
                ? "bg-brand-600 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700",
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <ToolIO
        input={input}
        onInputChange={setInput}
        output={output}
        inputPlaceholder={mode === "encode" ? "Enter text to encode…" : "Enter Base64 to decode…"}
        downloadName={mode === "encode" ? "encoded.txt" : "decoded.txt"}
      />
      {error && <ToolError message={error} />}
    </div>
  );
}
