import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Star, Type } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

// Unicode mathematical alphanumeric symbol blocks
// Each block starts at the codepoint for 'A' (uppercase) and 'a' (lowercase)
// Digits start at their respective digit-zero codepoint
const BLOCKS = {
  bold:        { upper: 0x1d400, lower: 0x1d41a, digit: 0x1d7ce },
  italic:      { upper: 0x1d434, lower: 0x1d44e },
  boldItalic:  { upper: 0x1d468, lower: 0x1d482 },
  script:      { upper: 0x1d49c, lower: 0x1d4b6 },
  boldScript:  { upper: 0x1d4d0, lower: 0x1d4ea },
  fraktur:     { upper: 0x1d504, lower: 0x1d51e },
  doubleStruck:{ upper: 0x1d538, lower: 0x1d552, digit: 0x1d7d8 },
  boldFraktur: { upper: 0x1d56c, lower: 0x1d586 },
  sansSerif:   { upper: 0x1d5a0, lower: 0x1d5ba, digit: 0x1d7e2 },
  sansBold:    { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec },
  sansItalic:  { upper: 0x1d608, lower: 0x1d622 },
  sansBoldItalic:{ upper: 0x1d63c, lower: 0x1d656 },
  monospace:   { upper: 0x1d670, lower: 0x1d68a, digit: 0x1d7f6 },
};

function convertBlock(s: string, block: { upper: number; lower: number; digit?: number }): string {
  return s.replace(/[a-zA-Z0-9]/g, (c) => {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(code - 65 + block.upper);
    if (code >= 97 && code <= 122) return String.fromCodePoint(code - 97 + block.lower);
    if (code >= 48 && code <= 57 && block.digit) return String.fromCodePoint(code - 48 + block.digit);
    return c;
  });
}

// Script block has holes at B,E,F,H,I,L,M,R,e,f,g,o,s,t → use lookup table
const SCRIPT_LOWER = "𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏";
const SCRIPT_UPPER = "𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵";

function convertScript(s: string): string {
  return s.replace(/[a-z]/g, (c) => SCRIPT_LOWER[c.charCodeAt(0) - 97] || c)
          .replace(/[A-Z]/g, (c) => SCRIPT_UPPER[c.charCodeAt(0) - 65] || c);
}

const CIRCLED_LOWER = 0x24d0;
const CIRCLED_UPPER = 0x24b6;
const SQUARED_LOWER = 0x1f130;
const SQUARED_UPPER = 0x1f110;
const NEG_CIRCLED_LOWER = 0x1f150;
const NEG_CIRCLED_UPPER = 0x1f170;

const UPSIDE_MAP = "ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz";

const FONTS: { name: string; convert: (s: string) => string; preview: string }[] = [
  { name: "Bold", convert: (s) => convertBlock(s, BLOCKS.bold), preview: "𝐁𝐨𝐥𝐝" },
  { name: "Italic", convert: (s) => convertBlock(s, BLOCKS.italic), preview: "𝐼𝑡𝑎𝑙𝑖𝑐" },
  { name: "Bold Italic", convert: (s) => convertBlock(s, BLOCKS.boldItalic), preview: "𝒃𝒐𝒍𝒅 𝒊𝒕𝒂𝒍𝑖𝑐" },
  { name: "Script", convert: convertScript, preview: "𝒮𝒸𝓇𝒾𝓅𝓉" },
  { name: "Fraktur", convert: (s) => convertBlock(s, BLOCKS.fraktur), preview: "𝔉𝔯𝔞𝔨𝔱𝔲𝔯" },
  { name: "Double-struck", convert: (s) => convertBlock(s, BLOCKS.doubleStruck), preview: "𝔻𝕠𝕦𝕓𝕝𝕖" },
  { name: "Sans Serif", convert: (s) => convertBlock(s, BLOCKS.sansSerif), preview: "𝖲𝖺𝗇𝗌" },
  { name: "Sans Bold", convert: (s) => convertBlock(s, BLOCKS.sansBold), preview: "𝗦𝗮𝗻𝘀 𝗕𝗼𝗹𝗱" },
  { name: "Monospace", convert: (s) => convertBlock(s, BLOCKS.monospace), preview: "𝙼𝚘𝚗𝚘" },
  {
    name: "Circled",
    convert: (s) => s.replace(/[a-z]/g, (c) => String.fromCodePoint(c.charCodeAt(0) - 97 + CIRCLED_LOWER))
                     .replace(/[A-Z]/g, (c) => String.fromCodePoint(c.charCodeAt(0) - 65 + CIRCLED_UPPER)),
    preview: "Ⓒⓘⓡⓒⓛⓔⓓ",
  },
  {
    name: "Squared",
    convert: (s) => s.replace(/[a-z]/g, (c) => String.fromCodePoint(c.charCodeAt(0) - 97 + SQUARED_LOWER))
                     .replace(/[A-Z]/g, (c) => String.fromCodePoint(c.charCodeAt(0) - 65 + SQUARED_UPPER)),
    preview: "🅂🆀🆄🄰🆁🄴",
  },
  {
    name: "Negative Squared",
    convert: (s) => s.replace(/[a-z]/g, (c) => String.fromCodePoint(c.charCodeAt(0) - 97 + NEG_CIRCLED_LOWER))
                     .replace(/[A-Z]/g, (c) => String.fromCodePoint(c.charCodeAt(0) - 65 + NEG_CIRCLED_UPPER)),
    preview: "🅣🅔🅢🅣",
  },
  { name: "Strikethrough", convert: (s) => s.split("").map((c) => c + "\u0336").join(""), preview: "S̶t̶r̶i̶k̶e̶" },
  { name: "Underline", convert: (s) => s.split("").map((c) => c + "\u0332").join(""), preview: "U̲n̲d̲e̲r̲" },
  {
    name: "Upside Down",
    convert: (s) => s.split("").reverse().map((c) => {
      const i = "abcdefghijklmnopqrstuvwxyz".indexOf(c);
      const i2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c);
      if (i >= 0) return UPSIDE_MAP[i];
      if (i2 >= 0) return UPSIDE_MAP[i2].toUpperCase();
      return c;
    }).join(""),
    preview: "uʍop",
  },
  {
    name: "Fullwidth",
    convert: (s) => s.replace(/[a-zA-Z0-9]/g, (c) => {
      const code = c.charCodeAt(0);
      if (code >= 33 && code <= 126) return String.fromCodePoint(code + 0xfee0);
      return c;
    }),
    preview: "Ｆｕｌｌ",
  },
];

export default function FontGenerator() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [text, setText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  const results = useMemo(() => {
    const input = text.trim() || t("creator.font.placeholder");
    return FONTS.map((f) => ({ name: f.name, result: f.convert(input) }));
  }, [text, t]);

  const toggleFavorite = (idx: number) => {
    setFavorites((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
  };

  const handleCopy = async (result: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(result);
      setCopiedIdx(idx);
      success(t("tool.copied"));
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      error(t("tool.error"));
    }
  };

  return (
    <div>
      {/* Live Text Input */}
      <div className="mb-6">
        <label className="label mb-2 block">
          <Type className="mr-1.5 inline h-4 w-4" />
          {t("creator.font.input")}
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input text-lg"
          placeholder={t("creator.font.placeholder")}
          maxLength={80}
          autoFocus
        />
        <p className="mt-1 text-right text-xs text-ink-400">{text.length} / 80</p>
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-900 dark:text-ink-100">
            <Star className="h-4 w-4 fill-warning-500 text-warning-500" />
            {t("creator.font.favorites")}
          </h3>
          <div className="space-y-2">
            {favorites.map((idx) => {
              const f = results[idx];
              if (!f) return null;
              return (
                <div key={`fav-${idx}`} className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-50/30 p-3 dark:bg-warning-700/10">
                  <span className="flex-1 truncate text-sm font-medium text-ink-900 dark:text-ink-100">{f.result}</span>
                  <button onClick={() => toggleFavorite(idx)} className="rounded p-1 text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-700/20">
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                  <button onClick={() => handleCopy(f.result, idx)} className="btn btn-sm btn-secondary">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Font Results */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">{t("creator.font.livePreview")}</h3>
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={r.name} className="group flex items-center gap-3 rounded-lg border border-ink-200 p-3 transition-all hover:border-brand-300 dark:border-ink-700">
              {/* Star toggle */}
              <button
                onClick={() => toggleFavorite(i)}
                className={cn(
                  "shrink-0 rounded-md p-1.5 transition-colors",
                  favorites.includes(i)
                    ? "text-warning-500"
                    : "text-ink-300 hover:text-warning-500 dark:text-ink-600",
                )}
              >
                <Star className={cn("h-4 w-4", favorites.includes(i) && "fill-current")} />
              </button>

              {/* Font name + preview */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink-400">{r.name}</p>
                <p className="truncate text-base font-medium text-ink-900 dark:text-ink-100">{r.result}</p>
              </div>

              {/* Copy */}
              <button
                onClick={() => handleCopy(r.result, i)}
                className={cn("btn btn-sm shrink-0 transition-all", copiedIdx === i ? "btn-primary" : "btn-secondary")}
              >
                {copiedIdx === i ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedIdx === i ? t("tool.copied") : t("creator.font.copyStyle")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
