import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getTool } from "@/data/catalog";
import { getIcon } from "@/lib/icons";

/**
 * One shared navigation for all writing tools (like Quillbot's left rail).
 * Wrap the tool with it in ToolPage. To add a tool to the suite, add its slug to SUITE.
 * Every tool keeps its own URL, so each page still ranks for its own keywords.
 */
export const SUITE: string[] = [
  "ai-content-rewriter",
  "ai-text-summarizer",
  "ai-grammar-checker",
  "plagiarism-checker",
  "word-counter",
  "sentence-counter",
  "reading-time-calculator",
  "case-converter",
  "text-diff-checker",
  "text-to-handwriting",
];

const STORE = "zidrotool-writing-rail-collapsed";

export function isSuiteTool(slug: string): boolean {
  return SUITE.includes(slug);
}

export function WritingSuite({ slug, children }: { slug: string; children: ReactNode }) {
  const { t } = useTranslation();
  const tr = (key: string, fallback: string): string => t(key, { defaultValue: fallback }) as string;
  const [collapsed, setCollapsed] = useState(false);
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORE) === "1");
    } catch {
      /* private mode */
    }
  }, []);

  // on phones, bring the current tool's chip into view
  useEffect(() => {
    const el = barRef.current?.querySelector<HTMLElement>("[aria-current=page]");
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [slug]);

  if (!SUITE.includes(slug)) return <>{children}</>;

  const items = SUITE.map((s) => getTool(s)).filter((x): x is NonNullable<ReturnType<typeof getTool>> => Boolean(x));
  if (items.length < 2) return <>{children}</>;

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORE, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  return (
    <div className="zws-root lg:flex lg:items-start lg:gap-5">
      <style>{`
        @keyframes zws-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.7); opacity: 0.35; } }
        @keyframes zws-in { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
        .zws-dot { animation: zws-pulse 2.4s ease-in-out infinite; }
        .zws-item { animation: zws-in 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .zws-scroll { scrollbar-width: none; }
        .zws-scroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { .zws-dot, .zws-item { animation: none !important; } }
      `}</style>

      {/* phone / tablet: a swipeable bar */}
      <nav ref={barRef} aria-label={tr("tool.suite.nav", "Writing tools")} className="zws-scroll -mx-1 mb-3 flex snap-x gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
        {items.map((it) => {
          const Icon = getIcon(it.icon);
          const active = it.slug === slug;
          return (
            <Link
              key={it.slug}
              to={`/tools/${it.slug}`}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? "border-violet-600 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30"
                  : "border-violet-200 bg-white/80 text-violet-900 hover:bg-violet-50 dark:border-violet-400/20 dark:bg-slate-900/60 dark:text-violet-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t(it.nameKey)}
            </Link>
          );
        })}
      </nav>

      {/* desktop: a sticky left rail */}
      <aside className={`hidden shrink-0 transition-[width] duration-300 lg:sticky lg:top-24 lg:block ${collapsed ? "w-14" : "w-56"}`}>
        <nav
          aria-label={tr("tool.suite.nav", "Writing tools")}
          className="overflow-hidden rounded-2xl border border-violet-100 bg-white/80 shadow-sm backdrop-blur dark:border-violet-400/15 dark:bg-slate-900/70"
        >
          <div className="flex items-center justify-between gap-2 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-3 py-2.5 dark:border-violet-400/15 dark:from-violet-500/10 dark:to-fuchsia-500/10">
            {!collapsed && (
              <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-violet-800 dark:text-violet-100">
                <span className="zws-dot inline-block h-2 w-2 rounded-full bg-fuchsia-500" aria-hidden="true" />
                {tr("tool.suite.title", "Writing tools")}
              </span>
            )}
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? tr("tool.suite.expand", "Expand menu") : tr("tool.suite.collapse", "Collapse menu")}
              aria-expanded={!collapsed}
              className="ms-auto rounded-lg p-1 text-violet-700 transition hover:bg-violet-100 dark:text-violet-200 dark:hover:bg-white/10"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : <ChevronLeft className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          <ul className="space-y-0.5 p-1.5">
            {items.map((it, i) => {
              const Icon = getIcon(it.icon);
              const active = it.slug === slug;
              const name = t(it.nameKey) as string;
              return (
                <li key={it.slug} className="zws-item" style={{ animationDelay: `${i * 35}ms` }}>
                  <Link
                    to={`/tools/${it.slug}`}
                    title={collapsed ? name : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition ${collapsed ? "justify-center" : ""} ${
                      active
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25"
                        : "text-ink-700 hover:bg-violet-50 hover:text-violet-900 dark:text-ink-200 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "" : "text-violet-500 group-hover:scale-110 dark:text-violet-300"} transition`} aria-hidden="true" />
                    {collapsed ? <span className="sr-only">{name}</span> : <span className="truncate">{name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          {!collapsed && (
            <div className="border-t border-violet-100 px-3 py-2 dark:border-violet-400/15">
              <Link to="/tools" className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
                {tr("tool.suite.all", "Browse all tools")} →
              </Link>
            </div>
          )}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
