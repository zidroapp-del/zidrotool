import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, History, Search as SearchIcon, X } from "lucide-react";
import { TOOLS, getCategory } from "@/data/catalog";
import { getIcon } from "@/lib/icons";
import { buildIndex, clearRecent, didYouMean, loadRecent, runSearch, splitMatch } from "@/lib/toolSearch";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Enter, or the "see all results" row */
  onSubmit: (value: string) => void;
  /** click / Enter on a suggested tool */
  onPick?: (tool: Tool) => void;
  placeholder?: string;
  tone?: "light" | "dark";
  autoFocus?: boolean;
  className?: string;
}

/**
 * Search input that helps while you type: suggestions with the matching letters highlighted,
 * keyboard navigation (↑ ↓ Enter Esc), recent searches when the box is empty,
 * "did you mean" for typing mistakes. Press "/" anywhere to jump into it.
 */
export function SearchSuggestBox({ value, onChange, onSubmit, onPick, placeholder, tone = "light", autoFocus, className }: Props) {
  const { t, i18n } = useTranslation();
  const dark = tone === "dark";
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);

  const index = useMemo(
    () => buildIndex(TOOLS, (k) => String(t(k)), (slug) => { const c = getCategory(slug); return c ? String(t(c.nameKey)) : ""; }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );
  const hits = useMemo(() => runSearch(index, value, 6), [index, value]);
  const suggestion = useMemo(() => (value.trim() && hits.length === 0 ? didYouMean(index, value) : null), [index, value, hits.length]);
  const showRecent = !value.trim() && recent.length > 0;
  const rows = showRecent ? recent.length : hits.length;

  useEffect(() => { setActive(-1); }, [value]);
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement | null)?.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, []);

  const submit = (v: string) => { setOpen(false); onSubmit(v); };
  const pick = (tool: Tool) => { setOpen(false); onPick?.(tool); };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (rows ? (a + 1) % rows : -1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (rows ? (a <= 0 ? rows - 1 : a - 1) : -1)); }
    else if (e.key === "Escape") { if (open) { setOpen(false); } else if (value) onChange(""); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && showRecent) { const r = recent[active]; onChange(r); submit(r); }
      else if (active >= 0 && hits[active]) { onPick ? pick(hits[active].tool) : submit(hits[active].name); }
      else submit(value);
    }
  };

  const panel = dark
    ? "nv-suggest-panel"
    : "border-ink-200 bg-white text-ink-800 shadow-xl dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100";
  const rowBase = "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors";
  const rowActive = dark ? "bg-indigo-500/20" : "bg-orange-50 dark:bg-ink-800";
  const markCls = dark ? "bg-indigo-400/30 text-white" : "bg-orange-200/80 text-ink-900 dark:bg-orange-500/30 dark:text-white";
  const muted = dark ? "text-slate-400" : "text-ink-500 dark:text-ink-400";

  const hl = (text: string) =>
    splitMatch(text, value).map((p, i) => (p.hit ? <mark key={i} className={cn("rounded px-0.5", markCls)}>{p.text}</mark> : <span key={i}>{p.text}</span>));

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div className={dark ? "nv-search-field" : "zt-search-shell"}>
        <SearchIcon className={cn("h-5 w-5 shrink-0", dark ? "text-blue-300" : "text-orange-500")} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open && (rows > 0 || !!suggestion || !!value.trim())}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label={t("search.title")}
          value={value}
          placeholder={placeholder ?? t("search.placeholder")}
          onFocus={() => { setRecent(loadRecent()); setOpen(true); }}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onKeyDown={onKeyDown}
          className={cn("min-w-0 flex-1 bg-transparent text-sm outline-none", dark ? "text-white placeholder:text-slate-400" : "text-ink-900 placeholder:text-ink-400 dark:text-white")}
        />
        {value && (
          <button type="button" onClick={() => { onChange(""); inputRef.current?.focus(); }} aria-label={t("search.clear", { defaultValue: "Clear" })} className={cn("rounded-full p-1 transition-colors", dark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800")}>
            <X className="h-4 w-4" />
          </button>
        )}
        <kbd className={cn("hidden rounded-lg px-2 py-1 font-mono text-[10px] sm:block", dark ? "bg-blue-500/20 text-blue-200" : "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400")}>/</kbd>
      </div>

      {open && (showRecent || value.trim()) && (
        <div id={listId} role="listbox" className={cn("absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border backdrop-blur-xl", panel)}>
          {showRecent && (
            <>
              <div className={cn("flex items-center justify-between px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider", muted)}>
                <span>{t("search.recentSearches")}</span>
                <button type="button" onClick={() => { clearRecent(); setRecent([]); }} className="font-semibold normal-case tracking-normal underline-offset-2 hover:underline">{t("search.clear", { defaultValue: "Clear" })}</button>
              </div>
              {recent.map((r, i) => (
                <button key={r} id={`${listId}-${i}`} role="option" aria-selected={active === i} type="button" onMouseEnter={() => setActive(i)} onClick={() => { onChange(r); submit(r); }} className={cn(rowBase, active === i && rowActive)}>
                  <History className={cn("h-4 w-4 shrink-0", muted)} />
                  <span className="min-w-0 flex-1 truncate">{r}</span>
                </button>
              ))}
            </>
          )}

          {!showRecent && hits.map((h, i) => {
            const Icon = getIcon(h.tool.icon);
            const cat = getCategory(h.tool.category);
            return (
              <button key={h.tool.slug} id={`${listId}-${i}`} role="option" aria-selected={active === i} type="button" onMouseEnter={() => setActive(i)} onClick={() => (onPick ? pick(h.tool) : submit(h.name))} className={cn(rowBase, active === i && rowActive)}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", dark ? "bg-indigo-500/20 text-blue-200" : "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300")}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{hl(h.name)}</span>
                  <span className={cn("block truncate text-xs", muted)}>{cat ? t(cat.nameKey) : ""}</span>
                </span>
                <ArrowRight className={cn("h-4 w-4 shrink-0", muted)} />
              </button>
            );
          })}

          {!showRecent && value.trim() && hits.length === 0 && (
            <div className="px-4 py-4 text-sm">
              <p className={muted}>{t("search.empty")}</p>
              {suggestion && (
                <button type="button" onClick={() => { onChange(suggestion); submit(suggestion); }} className={cn("mt-2 font-semibold underline-offset-2 hover:underline", dark ? "text-blue-300" : "text-orange-600")}>
                  {t("search.didYouMean", { name: suggestion, defaultValue: "Did you mean “{{name}}”?" })}
                </button>
              )}
            </div>
          )}

          {!showRecent && hits.length > 0 && (
            <button type="button" onClick={() => submit(value)} className={cn(rowBase, "border-t font-semibold", dark ? "border-white/10 text-blue-300" : "border-ink-100 text-orange-600 dark:border-ink-800")}>
              <SearchIcon className="h-4 w-4" />
              <span className="min-w-0 flex-1 truncate">{t("search.allTools")}: “{value.trim()}”</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
