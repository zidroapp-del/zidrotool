import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

function hexToRgb(hex: string) { const m = hex.match(/^#?([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i); if (!m) return null; return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }; }
function rgbToHsl(r: number, g: number, b: number) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2; if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }; }

export default function ColorPicker() {
  const [color, setColor] = useState("#3b82f6");
  const [copied, setCopied] = useState<string | null>(null);

  const rgb = useMemo(() => hexToRgb(color), [color]);
  const hsl = useMemo(() => rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null, [rgb]);

  const formats = [
    { label: "HEX", value: color.toUpperCase() },
    { label: "RGB", value: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : "" },
    { label: "HSL", value: hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : "" },
  ];

  const handleCopy = async (val: string, label: string) => {
    const ok = await copyToClipboard(val);
    if (ok) { setCopied(label); setTimeout(() => setCopied(null), 2000); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-16 w-16 cursor-pointer rounded-lg border border-ink-200 dark:border-ink-700" />
        <div className="flex-1"><label className="label mb-1.5 block">Hex value</label><input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="input font-mono" maxLength={7} /></div>
      </div>
      <div className="mb-6 h-24 rounded-xl border border-ink-200 dark:border-ink-700" style={{ backgroundColor: color }} />
      <div className="space-y-2">
        {formats.map((f) => (
          <div key={f.label} className="flex items-center gap-3 rounded-lg border border-ink-200 p-3 dark:border-ink-700">
            <span className="w-12 text-xs font-medium text-ink-400">{f.label}</span>
            <code className="flex-1 font-mono text-sm text-ink-900 dark:text-ink-100">{f.value}</code>
            <button onClick={() => handleCopy(f.value, f.label)} className={cn("btn btn-sm", copied === f.label ? "btn-primary" : "btn-secondary")}>{copied === f.label ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
