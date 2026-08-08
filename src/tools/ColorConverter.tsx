import { useMemo, useState } from "react";
import { copyToClipboard } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

function hexToRgb(hex: string) {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return null;
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function ColorConverter() {
  const [hex, setHex] = useState("#3B82F6");
  const [copied, setCopied] = useState("");

  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null), [rgb]);

  const values = useMemo(() => {
    if (!rgb) return [];
    return [
      { label: "HEX", value: hex.toUpperCase() },
      { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
      { label: "HSL", value: hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : "" },
      { label: "RGB Values", value: `${rgb.r}, ${rgb.g}, ${rgb.b}` },
    ];
  }, [rgb, hex, hsl]);

  const copy = async (val: string) => {
    if (await copyToClipboard(val)) {
      setCopied(val);
      setTimeout(() => setCopied(""), 2000);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="h-12 w-20 cursor-pointer rounded-lg border border-ink-200 dark:border-ink-700"
          aria-label="Color picker"
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="input font-mono"
          placeholder="#000000"
          aria-label="HEX color"
        />
      </div>

      <div
        className="mb-4 h-24 rounded-xl border border-ink-200 dark:border-ink-700"
        style={{ backgroundColor: hex }}
        aria-label="Color preview"
      />

      <div className="space-y-2">
        {values.map((v) => (
          <div key={v.label} className="flex items-center justify-between rounded-lg border border-ink-200 p-3 dark:border-ink-700">
            <div>
              <span className="text-xs font-semibold uppercase text-ink-400">{v.label}</span>
              <p className="font-mono text-sm text-ink-900 dark:text-ink-100">{v.value || "Invalid"}</p>
            </div>
            <button
              onClick={() => copy(v.value)}
              className="rounded-md p-2 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"
              aria-label={`Copy ${v.label}`}
            >
              {copied === v.value ? <Check className="h-4 w-4 text-success-700" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
