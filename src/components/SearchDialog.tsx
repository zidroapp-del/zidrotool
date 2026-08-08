import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, X, CornerDownLeft, History, Clock, TrendingUp, ArrowRight, Wrench, FolderTree, FileText, Globe, FileBadge } from "lucide-react";
import { TOOLS, CATEGORIES, getCategory } from "@/data/catalog";
import { BLOG_POSTS } from "@/data/blog";
import { ONLINE_SERVICES } from "@/data/services";
import { getIcon } from "@/lib/icons";
import { useHistory } from "@/lib/history";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = "zidrotool-recent-searches";
const MAX_RECENT = 5;

function loadRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(q: string) {
  const cur = loadRecentSearches().filter((s) => s !== q);
  const next = [q, ...cur].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-brand-200/70 px-0.5 text-ink-900 dark:bg-brand-800/60 dark:text-ink-100">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

type ResultType = "tool" | "category" | "blog" | "service" | "page";
interface ResultItem {
  type: ResultType;
  slug: string;
  name: string;
  desc: string;
  icon: string;
  to: string;
}

const TYPE_META: Record<ResultType, { icon: React.ComponentType<{ className?: string }>; labelKey: string }> = {
  tool: { icon: Wrench, labelKey: "search.type.tool" },
  category: { icon: FolderTree, labelKey: "search.type.category" },
  blog: { icon: FileText, labelKey: "search.type.blog" },
  service: { icon: Globe, labelKey: "search.type.service" },
  page: { icon: FileBadge, labelKey: "search.type.page" },
};

const STATIC_PAGES: { slug: string; nameKey: string; to: string; keywords: string[] }[] = [
  { slug: "about", nameKey: "nav.about", to: "/about", keywords: ["company", "team", "mission"] },
  { slug: "pricing", nameKey: "nav.pricing", to: "/pricing", keywords: ["plans", "premium", "upgrade", "pro", "business"] },
  { slug: "services", nameKey: "nav.services", to: "/services", keywords: ["online", "email", "file", "url", "qr", "password"] },
  { slug: "contact", nameKey: "nav.contact", to: "/contact", keywords: ["email", "support", "help", "message"] },
  { slug: "blog", nameKey: "nav.blog", to: "/blog", keywords: ["articles", "news", "tutorials"] },
  { slug: "api", nameKey: "nav.api", to: "/api", keywords: ["developer", "documentation", "endpoint"] },
  { slug: "changelog", nameKey: "nav.changelog", to: "/changelog", keywords: ["updates", "releases", "versions"] },
  { slug: "status", nameKey: "nav.status", to: "/status", keywords: ["uptime", "incident", "monitoring"] },
  { slug: "careers", nameKey: "nav.careers", to: "/careers", keywords: ["jobs", "hiring", "work"] },
  { slug: "partners", nameKey: "nav.partners", to: "/partners", keywords: ["collaborate", "integrate"] },
  { slug: "feedback", nameKey: "nav.feedback", to: "/feedback", keywords: ["suggestion", "bug", "report"] },
  { slug: "privacy", nameKey: "nav.privacy", to: "/privacy", keywords: ["data", "gdpr", "policy"] },
  { slug: "terms", nameKey: "nav.terms", to: "/terms", keywords: ["legal", "agreement"] },
  { slug: "cookies", nameKey: "nav.cookies", to: "/cookies", keywords: ["tracking", "consent"] },
];

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { history } = useHistory();

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setRecentSearches(loadRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo((): ResultItem[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const toolResults: ResultItem[] = TOOLS.filter((tool) => {
      const name = t(tool.nameKey) as string;
      const desc = t(tool.descKey) as string;
      const cat = getCategory(tool.category);
      const catName = cat ? (t(cat.nameKey) as string) : "";
      const kw = tool.keywords?.join(" ").toLowerCase() || "";
      return (
        name.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q) ||
        kw.includes(q)
      );
    }).slice(0, 6).map((tool) => ({
      type: "tool" as ResultType,
      slug: tool.slug,
      name: t(tool.nameKey) as string,
      desc: t(tool.descKey) as string,
      icon: tool.icon,
      to: `/tools/${tool.slug}`,
    }));

    const catResults: ResultItem[] = CATEGORIES.filter((c) => {
      const name = t(c.nameKey) as string;
      const desc = t(c.descKey) as string;
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    }).slice(0, 3).map((c) => ({
      type: "category" as ResultType,
      slug: c.slug,
      name: t(c.nameKey) as string,
      desc: t(c.descKey) as string,
      icon: c.icon,
      to: `/category/${c.slug}`,
    }));

    const blogResults: ResultItem[] = BLOG_POSTS.filter((post) => {
      const title = t(post.titleKey) as string;
      const excerpt = t(post.excerptKey) as string;
      return title.toLowerCase().includes(q) || excerpt.toLowerCase().includes(q);
    }).slice(0, 3).map((post) => ({
      type: "blog" as ResultType,
      slug: post.slug,
      name: t(post.titleKey) as string,
      desc: t(post.excerptKey) as string,
      icon: "FileText",
      to: `/blog/${post.slug}`,
    }));

    const serviceResults: ResultItem[] = ONLINE_SERVICES.filter((s) => {
      const name = t(s.nameKey) as string;
      const desc = t(s.descKey) as string;
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    }).slice(0, 3).map((s) => ({
      type: "service" as ResultType,
      slug: s.slug,
      name: t(s.nameKey) as string,
      desc: t(s.descKey) as string,
      icon: s.icon,
      to: `/services/${s.slug}`,
    }));

    const pageResults: ResultItem[] = STATIC_PAGES.filter((p) => {
      const name = t(p.nameKey) as string;
      return name.toLowerCase().includes(q) || p.keywords.some((k) => k.includes(q));
    }).slice(0, 4).map((p) => ({
      type: "page" as ResultType,
      slug: p.slug,
      name: t(p.nameKey) as string,
      desc: "",
      icon: "FileBadge",
      to: p.to,
    }));

    return [...catResults, ...toolResults, ...blogResults, ...serviceResults, ...pageResults];
  }, [query, t]);

  const showRecent = !query.trim() && history.length > 0;
  const recentTools = history.slice(0, 5).map((h) => TOOLS.find((t2) => t2.slug === h.slug)).filter(Boolean);

  const list: ResultItem[] = query.trim()
    ? results
    : showRecent
      ? recentTools.map((tool) => {
          if (!tool) return null;
          return {
            type: "tool" as ResultType,
            slug: tool.slug,
            name: t(tool.nameKey) as string,
            desc: t(tool.descKey) as string,
            icon: tool.icon,
            to: `/tools/${tool.slug}`,
          };
        }).filter(Boolean) as ResultItem[]
      : [];

  const suggestions = !query.trim() && !showRecent
    ? [...TOOLS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5).map((tool) => ({
        type: "tool" as ResultType,
        slug: tool.slug,
        name: t(tool.nameKey) as string,
        desc: t(tool.descKey) as string,
        icon: tool.icon,
        to: `/tools/${tool.slug}`,
      }))
    : [];

  const displayList = list.length > 0 ? list : suggestions;

  const handleSelect = (item: ResultItem) => {
    if (query.trim()) saveRecentSearch(query.trim());
    navigate(item.to);
    onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, displayList.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = displayList[activeIndex];
        if (item) handleSelect(item);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, displayList, activeIndex, onClose]);

  if (!open) return null;

  // Group results by type
  const grouped = query.trim() ? results.reduce((acc, item) => {
    (acc[item.type] = acc[item.type] || []).push(item);
    return acc;
  }, {} as Record<ResultType, ResultItem[]>) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh]">
      <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl animate-slide-down dark:border-ink-700 dark:bg-ink-900" role="dialog" aria-modal="true" aria-label={t("search.title")}>
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 dark:border-ink-800">
          <Search className="h-5 w-5 text-ink-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            placeholder={t("search.placeholder")}
            className="flex-1 bg-transparent py-4 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-ink-100"
            aria-label={t("search.placeholder")}
          />
          <button onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label={t("common.close")}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {/* Recent searches */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="px-3 pb-2">
              <p className="py-2 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-600">{t("search.recentSearches")}</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button key={s} onClick={() => { setQuery(s); setActiveIndex(0); }} className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1 text-xs text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-700 dark:text-ink-400 dark:hover:border-brand-700 dark:hover:bg-brand-900/30">
                    <Clock className="h-3 w-3" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section label */}
          {showRecent && <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-600">{t("search.recent")}</p>}
          {!query.trim() && !showRecent && suggestions.length > 0 && (
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-600">{t("search.popular")}</p>
          )}

          {/* No results */}
          {query.trim() && results.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-ink-300 dark:text-ink-600" />
              <p className="mt-3 text-sm text-ink-400 dark:text-ink-500">{t("search.empty")}</p>
              <p className="mt-1 text-xs text-ink-400 dark:text-ink-600">{t("search.emptyHint")}</p>
            </div>
          )}

          {/* Grouped results */}
          {grouped && Object.keys(grouped).length > 0 && (
            <div>
              {(Object.entries(grouped) as [ResultType, ResultItem[]][]).map(([rtype, items]) => {
                const meta = TYPE_META[rtype];
                const MetaIcon = meta.icon;
                let flatIndex = 0;
                return (
                  <div key={rtype}>
                    <div className="flex items-center gap-1.5 px-3 pb-1 pt-3">
                      <MetaIcon className="h-3 w-3 text-ink-400" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-600">{t(meta.labelKey)}</p>
                    </div>
                    <ul>
                      {items.map((item) => {
                        const i = displayList.indexOf(item);
                        const Icon = item.type === "tool" || item.type === "category" ? getIcon(item.icon) : item.type === "blog" ? FileText : item.type === "service" ? Globe : FileBadge;
                        const cat = item.type === "tool" ? getCategory(TOOLS.find((t2) => t2.slug === item.slug)?.category || "") : null;
                        return (
                          <li key={`${item.type}-${item.slug}`}>
                            <button
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setActiveIndex(i)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                                activeIndex === i ? "bg-brand-50 dark:bg-brand-900/30" : "hover:bg-ink-50 dark:hover:bg-ink-800",
                              )}
                            >
                              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                item.type === "category" ? "bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400"
                                : item.type === "blog" ? "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600"
                                : item.type === "service" ? "bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-600"
                                : item.type === "page" ? "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400"
                                : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
                              )}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-100">{highlight(item.name, query)}</p>
                                {item.desc && <p className="truncate text-xs text-ink-500 dark:text-ink-400">{item.type === "category" ? t("nav.categories") : cat ? t(cat.nameKey) : t(TYPE_META[item.type].labelKey)} · {highlight(item.desc, query)}</p>}
                              </div>
                              {showRecent && <History className="h-3.5 w-3.5 text-ink-400" />}
                              {activeIndex === i && <CornerDownLeft className="h-3.5 w-3.5 text-ink-400" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent/suggestions list (no query) */}
          {!grouped && displayList.length > 0 && (
            <ul>
              {displayList.map((item, i) => {
                const Icon = getIcon(item.icon);
                const cat = item.type === "tool" ? getCategory(TOOLS.find((t2) => t2.slug === item.slug)?.category || "") : null;
                return (
                  <li key={`${item.type}-${item.slug}`}>
                    <button
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors", activeIndex === i ? "bg-brand-50 dark:bg-brand-900/30" : "hover:bg-ink-50 dark:hover:bg-ink-800")}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-100">{item.name}</p>
                        <p className="truncate text-xs text-ink-500 dark:text-ink-400">{cat ? t(cat.nameKey) : ""} · {item.desc}</p>
                      </div>
                      {showRecent && <History className="h-3.5 w-3.5 text-ink-400" />}
                      {activeIndex === i && <CornerDownLeft className="h-3.5 w-3.5 text-ink-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ink-100 px-4 py-2.5 text-xs text-ink-400 dark:border-ink-800 dark:text-ink-500">
          <span className="hidden sm:inline">{t("search.hint")}</span>
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-ink-200 px-1.5 py-0.5 font-mono text-[10px] dark:border-ink-700">↑↓</kbd>
            <kbd className="rounded border border-ink-200 px-1.5 py-0.5 font-mono text-[10px] dark:border-ink-700">Enter</kbd>
            <kbd className="rounded border border-ink-200 px-1.5 py-0.5 font-mono text-[10px] dark:border-ink-700">Esc</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
