import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, Smile, Check } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface EmojiCategory {
  name: string;
  icon: string;
  emojis: string[];
  keywords: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: "Smileys",
    icon: "😀",
    keywords: ["happy", "smile", "face", "laugh", "cry", "sad", "angry", "love", "emoji"],
    emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","😮‍💨","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  },
  {
    name: "Gestures",
    icon: "👍",
    keywords: ["hand", "thumbs", "ok", "point", "wave", "clap", "fist", "peace", "heart", "body"],
    emojis: ["👍","👎","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👋","🤚","🖐️","✋","🖖","👏","🙌","🤝","🙏","✍️","💪","🦾","🦵","🦿","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","💋","👤","👥"],
  },
  {
    name: "Symbols",
    icon: "❤️",
    keywords: ["heart", "love", "symbol", "sign", "arrow", "number", "currency", "religion", "zodiac", "check", "cross", "star", "warning", "music", "math", "letter", "button"],
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","🉐","㊗️","㊙️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿","🅿️","🈳","🈂️","🛂","🛃","🛄","🛅","🚹","🚺","🚼","🚻","🚮","🎦","📶","🈁","🔣","ℹ️","🔤","🔡","🔠","🆖","🆗","🆙","🆒","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔢","#️⃣","*️⃣","⏏️","▶️","⏸️","⏯️","⏹️","⏺️","⏭️","⏮️","⏩","⏪","⏫","⏬","◀️","🔼","🔽","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↪️","↩️","⤴️","⤵️","🔀","🔁","🔂","🔄","🔃","🎵","🎶","➕","➖","➗","✖️","♾️","💲","💱","™️","©️","®️","〰️","➰","➿","🔚","🔙","🔝","🔜"],
  },
  {
    name: "Animals",
    icon: "🐶",
    keywords: ["animal", "pet", "dog", "cat", "bird", "fish", "nature", "wild", "zoo", "insect"],
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦗","🕷️","🦂","🦟","🦠","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦦","🦥","🐁","🐀","🐿️","🦔"],
  },
  {
    name: "Food",
    icon: "🍔",
    keywords: ["food", "fruit", "vegetable", "drink", "dessert", "meal", "burger", "pizza", "cake", "sweet"],
    emojis: ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🥪","🥙","🧆","🌮","🌯","🥗","🥘","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯"],
  },
  {
    name: "Activities",
    icon: "⚽",
    keywords: ["sport", "ball", "game", "music", "art", "award", "trophy", "medal", "ticket", "instrument"],
    emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","⛹️","🤺","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"],
  },
  {
    name: "Travel",
    icon: "✈️",
    keywords: ["travel", "car", "plane", "boat", "train", "building", "house", "city", "map", "landmark"],
    emojis: ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🦯","🦽","🦼","🛴","🚲","🛵","🏍️","🛺","🚨","🚔","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩️","💺","🛰️","🚀","🛸","🚁","🛶","⛵","🚤","🛥️","🛳️","⛴️","🚢","⚓","🪝","⛽","🚧","🚦","🚥","🚏","🗺️","🗿","🗽","🗼","🏰","🏯","🏟️","🎡","🎢","🎠","⛲","⛱️","🏖️","🏝️","🏜️","🌋","⛰️","🏔️","🗻","🏕️","⛺","🛖","🏠","🏡","🏘️","🏚️","🏗️","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏪","🏫","🏩","💒","🏛️","⛪","🕌","🕍","🛕","🕋","⛩️"],
  },
  {
    name: "Objects",
    icon: "💡",
    keywords: ["phone", "clock", "computer", "camera", "light", "key", "tool", "money", "book", "music"],
    emojis: ["⌚","📱","📲","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯️","🪔","🧯","🛢️","💸","💵","💴","💶","💷","🪙","💰","💳","💎","⚖️","🪜","🧰","🔧","🔨","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧱","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️","🚬","⚰️","🪦","⚱️","🏺","🔮","📿","🧿","💈","⚗️","🔭","🔬","🕳️","🩹","🩺","💊","💉","🩸","🧬","🦠","🧫","🧪","🔍","🔎","🏮"],
  },
];

const RECENT_KEY = "emoji-recent";

export default function EmojiPicker() {
  const { t } = useTranslation();
  const { success } = useToast();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const matched = EMOJI_CATEGORIES.filter((c) =>
      c.name.toLowerCase().includes(q) || c.keywords.some((kw) => kw.includes(q)),
    );
    const all = matched.length > 0 ? matched.flatMap((c) => c.emojis) : [];
    return [...new Set(all)];
  }, [search]);

  const handleCopy = useCallback((emoji: string) => {
    navigator.clipboard.writeText(emoji).then(() => {
      setCopied(emoji);
      success(t("creator.emoji.copiedFeedback"));
      setTimeout(() => setCopied(null), 1200);
      const updated = [emoji, ...recent.filter((e) => e !== emoji)].slice(0, 16);
      setRecent(updated);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch { /* noop */ }
    }).catch(() => { /* noop */ });
  }, [recent, success, t]);

  const currentEmojis = filteredEmojis ?? EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder={t("creator.emoji.search")}
          />
        </div>
      </div>

      {/* Category tabs */}
      {!search.trim() && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                activeCategory === i
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300",
              )}
            >
              <span className="text-base">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && !search.trim() && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{t("creator.emoji.recent")}</p>
          <div className="flex flex-wrap gap-1">
            {recent.map((e, i) => (
              <button
                key={`recent-${i}`}
                onClick={() => handleCopy(e)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-all hover:scale-110 hover:bg-ink-100 dark:hover:bg-ink-800",
                  copied === e && "bg-success-100 dark:bg-success-700/20",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji grid */}
      <p className="mb-2 text-xs text-ink-400">{t("creator.emoji.clickToCopy")}</p>
      <div className="grid grid-cols-7 gap-1 sm:grid-cols-8 md:grid-cols-10">
        {currentEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => handleCopy(emoji)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg text-xl transition-all hover:scale-110 hover:bg-ink-100 dark:hover:bg-ink-800",
              copied === emoji && "bg-success-100 ring-2 ring-success-400 dark:bg-success-700/20",
            )}
          >
            {copied === emoji ? <Check className="h-5 w-5 text-success-600" /> : emoji}
          </button>
        ))}
      </div>

      {currentEmojis.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Smile className="h-10 w-10 text-ink-300 dark:text-ink-700" />
          <p className="mt-3 text-sm text-ink-400">{t("creator.emoji.noResults")}</p>
        </div>
      )}
    </div>
  );
}
