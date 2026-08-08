import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  Globe,
  ChevronDown,
  Sparkles,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { getIcon } from "@/lib/icons";
import { useTheme } from "@/lib/theme";
import { LANGUAGES, setLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Lang, ThemeMode } from "@/types";

interface NavbarProps {
  onOpenSearch: () => void;
}

export function Navbar({ onOpenSearch }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const { mode, setMode } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenSearch]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "text-brand-600 dark:text-brand-400"
        : "text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100",
    );

  const themeIcons: Record<ThemeMode, typeof Sun> = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };
  const ThemeIcon = themeIcons[mode];

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-ink-200/70 bg-white/80 backdrop-blur-lg dark:border-ink-800/70 dark:bg-ink-950/80"
          : "border-b border-transparent bg-white dark:bg-ink-950",
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="ZidroTool home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-sm">
            <Zap className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight text-ink-900 dark:text-ink-100">
            Zidro<span className="text-brand-600 dark:text-brand-400">Tool</span>
          </span>
        </Link>

        {/* Search trigger (desktop) */}
        <button
          onClick={onOpenSearch}
          className="hidden flex-1 items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-400 transition-colors hover:border-ink-300 hover:bg-ink-100 lg:flex dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600"
          aria-label={t("nav.search")}
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">{t("nav.search")}</span>
          <kbd className="rounded border border-ink-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-ink-500 dark:border-ink-600 dark:bg-ink-800 dark:text-ink-400">
            {t("nav.search.shortcut")}
          </kbd>
        </button>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {/* Categories dropdown */}
          <div className="relative" ref={catRef}>
            <button
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
              aria-expanded={catOpen}
              aria-haspopup="true"
            >
              {t("nav.categories")}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", catOpen && "rotate-180")} />
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-ink-200 bg-white p-2 shadow-xl animate-slide-down dark:border-ink-700 dark:bg-ink-900">
                <Link
                  to="/tools"
                  onClick={() => setCatOpen(false)}
                  className="flex items-center gap-3 rounded-lg p-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/30"
                >
                  <Sparkles className="h-4 w-4" />
                  {t("nav.tools")}
                </Link>
                <div className="my-1 h-px bg-ink-100 dark:bg-ink-800" />
                {CATEGORIES.map((cat) => {
                  const Icon = getIcon(cat.icon);
                  return (
                    <Link
                      key={cat.slug}
                      to={`/category/${cat.slug}`}
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                    >
                      <Icon className="h-4 w-4 text-ink-400" />
                      <div>
                        <p className="font-medium">{t(cat.nameKey)}</p>
                        <p className="text-xs text-ink-400 dark:text-ink-500">{t(cat.descKey)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <NavLink to="/services" className={navLinkClass}>{t("nav.services")}</NavLink>
          <NavLink to="/blog" className={navLinkClass}>{t("nav.blog")}</NavLink>
          <NavLink to="/pricing" className={navLinkClass}>{t("nav.pricing")}</NavLink>
          <NavLink to="/about" className={navLinkClass}>{t("nav.about")}</NavLink>
          <NavLink to="/contact" className={navLinkClass}>{t("nav.contact")}</NavLink>

          {/* Language selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
              aria-expanded={langOpen}
              aria-haspopup="true"
              aria-label={t("lang.select")}
            >
              <Globe className="h-4 w-4" />
              <span className="text-base">{currentLang.flag}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", langOpen && "rotate-180")} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-ink-200 bg-white p-1.5 shadow-xl animate-slide-down dark:border-ink-700 dark:bg-ink-900">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code as Lang);
                      setLangOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      i18n.language === l.code
                        ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800",
                    )}
                  >
                    <span className="text-base">{l.flag}</span>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => {
              const order: ThemeMode[] = ["light", "dark", "system"];
              const next = order[(order.indexOf(mode) + 1) % 3];
              setMode(next);
            }}
            className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            aria-label={t("theme.toggle")}
            title={`${t("theme.toggle")}: ${t(`theme.${mode}`)}`}
          >
            <ThemeIcon className="h-5 w-5" />
          </button>

          {/* Auth */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                aria-label={t("nav.dashboard")}
              >
                {user.email?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-ink-200 bg-white p-1.5 shadow-xl animate-slide-down dark:border-ink-700 dark:bg-ink-900">
                  <div className="px-2.5 py-2 text-xs text-ink-500 dark:text-ink-400">
                    {user.email}
                  </div>
                  <div className="h-px bg-ink-100 dark:bg-ink-800" />
                  <Link
                    to="/dashboard"
                    onClick={() => setUserOpen(false)}
                    className="mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t("nav.dashboard")}
                  </Link>
                  <Link
                    to="/admin"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {t("admin.title")}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setUserOpen(false);
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.signout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/signin" className={navLinkClass}>{t("nav.signin")}</NavLink>
              <Link to="/pricing" className="btn-primary btn-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {t("nav.getPremium")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            onClick={onOpenSearch}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
            aria-label={t("nav.search")}
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              const order: ThemeMode[] = ["light", "dark", "system"];
              const next = order[(order.indexOf(mode) + 1) % 3];
              setMode(next);
            }}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
            aria-label={t("theme.toggle")}
          >
            <ThemeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
            aria-label={t("nav.menu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-ink-200 bg-white px-4 py-4 lg:hidden dark:border-ink-800 dark:bg-ink-950">
          <div className="flex flex-col gap-1">
            <Link to="/tools" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800">
              {t("nav.tools")}
            </Link>
            {CATEGORIES.map((cat) => {
              const Icon = getIcon(cat.icon);
              return (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-600 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800"
                >
                  <Icon className="h-4 w-4 text-ink-400" />
                  {t(cat.nameKey)}
                </Link>
              );
            })}
            <div className="my-2 h-px bg-ink-100 dark:bg-ink-800" />
            <Link to="/blog" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800">{t("nav.blog")}</Link>
            <Link to="/pricing" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800">{t("nav.pricing")}</Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800">{t("nav.about")}</Link>
            <Link to="/contact" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800">{t("nav.contact")}</Link>

            <div className="my-2 h-px bg-ink-100 dark:bg-ink-800" />
            <div className="flex flex-wrap gap-2 px-3 py-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code as Lang)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-sm",
                    i18n.language === l.code
                      ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : "text-ink-600 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800",
                  )}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>

            <div className="my-2 h-px bg-ink-100 dark:bg-ink-800" />
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800">{t("nav.dashboard")}</Link>
                <button onClick={() => { signOut(); setMobileOpen(false); navigate("/"); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800">{t("nav.signout")}</button>
              </>
            ) : (
              <Link to="/signin" onClick={() => setMobileOpen(false)} className="btn-primary mt-2 w-full">{t("nav.signin")}</Link>
            )}
            <Link to="/pricing" onClick={() => setMobileOpen(false)} className="btn-secondary mt-2 w-full">
              <Sparkles className="h-4 w-4" />
              {t("nav.getPremium")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
