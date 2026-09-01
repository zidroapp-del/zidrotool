import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, BarChart3, Users, MessageSquare, Mail, Star, Bug, Lightbulb,
  Wrench, FileText, FolderTree, Globe, Settings as SettingsIcon, ScrollText,
  Menu, X, LogOut, Search, Bell, ChevronRight, ArrowUpRight, ArrowDownRight,
  DollarSign, Activity, AlertTriangle, Info, CheckCircle2, Clock, Crown,
  TrendingUp, Eye, Edit, Trash2, Plus, Download, Filter,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { ADMIN_NAV, ADMIN_STATS, ADMIN_ACTIVITIES, ADMIN_USERS, ADMIN_LOGS, type AdminSection } from "@/data/admin";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { supabase } from "@/lib/supabase";
import { TOOLS } from "@/data/catalog";
import { BLOG_POSTS } from "@/data/blog";
import { CATEGORIES } from "@/data/catalog";
import { ONLINE_SERVICES } from "@/data/services";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, BarChart3, Users, MessageSquare, Mail, Star, Bug, Lightbulb,
  Wrench, FileText, FolderTree, Globe, Settings: SettingsIcon, ScrollText,
  DollarSign, Activity, Crown,
};

const sections: AdminSection[] = [
  "overview", "analytics", "users", "messages", "newsletter", "feedback",
  "bugs", "features", "tools", "blog", "categories", "services", "settings", "logs",
];

export default function AdminPage() {
  const { t } = useTranslation();
  const { user, loading, signOut } = useAuth();
  const [adminLoading, setAdminLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const currentSection = (searchParams.get("section") as AdminSection) || "overview";

  useEffect(() => {
    let active = true;
    if (!user) { setAdminLoading(false); setIsAdmin(false); return; }
    setAdminLoading(true);
    hasAdminAccess(user.id).then((allowed) => { if (active) { setIsAdmin(allowed); setAdminLoading(false); } });
    return () => { active = false; };
  }, [user]);

  if (loading || adminLoading) return <div className="flex min-h-screen items-center justify-center text-ink-400">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/signin" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const setSection = (s: AdminSection) => {
    setSearchParams({ section: s });
    setSidebarOpen(false);
  };

  const navGroups: { key: string; items: typeof ADMIN_NAV }[] = [
    { key: "admin.group.main", items: ADMIN_NAV.filter((i) => i.group === "main") },
    { key: "admin.group.content", items: ADMIN_NAV.filter((i) => i.group === "content") },
    { key: "admin.group.system", items: ADMIN_NAV.filter((i) => i.group === "system") },
  ];

  return (
    <>
      <Seo title={`${t("admin.title")} · ${t(`admin.nav.${currentSection}`)}`} noIndex />
      <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-ink-200 bg-white transition-transform duration-300 dark:border-ink-800 dark:bg-ink-900 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}>
          <div className="flex h-16 items-center justify-between border-b border-ink-200 px-4 dark:border-ink-800">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                <Crown className="h-4 w-4" />
              </div>
              <span className="font-bold text-ink-900 dark:text-ink-100">{t("admin.title")}</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex h-[calc(100vh-4rem)] flex-col overflow-y-auto p-3">
            {navGroups.map((group) => (
              <div key={group.key} className="mb-4">
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-600">{t(group.key)}</p>
                {group.items.map((item) => {
                  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                  const active = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSection(item.id)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{t(item.labelKey)}</span>
                      {item.badge !== undefined && (
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          active ? "bg-white/20 text-white" : "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400",
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            <div className="mt-auto border-t border-ink-200 pt-3 dark:border-ink-800">
              <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800">
                <LogOut className="h-4 w-4" />
                {t("admin.exit")}
              </button>
            </div>
          </nav>
        </aside>

        {/* Overlay */}
        {sidebarOpen && <div className="fixed inset-0 z-40 bg-ink-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <div className="flex flex-1 flex-col lg:pl-64">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink-200 bg-white/80 px-4 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/80">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-ink-400">
              <span>{t("admin.title")}</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-ink-700 dark:text-ink-300">{t(`admin.nav.${currentSection}`)}</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input type="text" placeholder={t("admin.search")} className="h-9 w-48 rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100" />
              </div>
              <button className="relative rounded-lg p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
                  {(user.email || "A")[0].toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium text-ink-700 dark:text-ink-300 sm:block">{user.email}</span>
              </div>
            </div>
          </header>

          {/* Section content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {currentSection === "overview" && <OverviewSection />}
            {currentSection === "analytics" && <AnalyticsSection />}
            {currentSection === "users" && <UsersSection />}
            {currentSection === "messages" && <MessagesSection />}
            {currentSection === "newsletter" && <NewsletterSection />}
            {currentSection === "feedback" && <FeedbackAdminSection />}
            {currentSection === "bugs" && <BugsSection />}
            {currentSection === "features" && <FeaturesSection />}
            {currentSection === "tools" && <ToolsAdminSection />}
            {currentSection === "blog" && <BlogAdminSection />}
            {currentSection === "categories" && <CategoriesAdminSection />}
            {currentSection === "services" && <ServicesAdminSection />}
            {currentSection === "settings" && <SettingsSection />}
            {currentSection === "logs" && <LogsSection />}
            {!sections.includes(currentSection) && <OverviewSection />}
          </main>
        </div>
      </div>
    </>
  );
}

function PageHeader({ titleKey, descKey, action }: { titleKey: string; descKey?: string; action?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t(titleKey)}</h1>
        {descKey && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t(descKey)}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900", className)}>{children}</div>;
}

function PlaceholderRow({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-ink-100 py-3 last:border-0 dark:border-ink-800">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{label}</p>
        {sub && <p className="text-xs text-ink-400">{sub}</p>}
      </div>
      <span className="text-sm font-semibold text-ink-700 dark:text-ink-300">{value}</span>
    </div>
  );
}

function OverviewSection() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader titleKey="admin.nav.overview" descKey="admin.overview.desc" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ADMIN_STATS.map((stat) => {
          const Icon = ICON_MAP[stat.icon] || Activity;
          return (
            <Card key={stat.labelKey}>
              <div className="flex items-center justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn("flex items-center gap-0.5 text-xs font-semibold", stat.trend === "up" ? "text-success-700 dark:text-success-600" : stat.trend === "down" ? "text-danger" : "text-ink-400")}>
                  {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : stat.trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : null}
                  {stat.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-ink-900 dark:text-ink-100">{stat.value}</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">{t(stat.labelKey)}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("admin.activity.recent")}</h2>
          <div className="mt-4">
            {ADMIN_ACTIVITIES.map((act) => (
              <PlaceholderRow
                key={act.id}
                icon={act.type === "user" ? Users : act.type === "tool" ? Wrench : act.type === "blog" ? FileText : act.type === "feedback" ? Star : Activity}
                label={t(act.messageKey)}
                value={act.time}
              />
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("admin.quickActions")}</h2>
          <div className="mt-4 space-y-2">
            {[
              { icon: Plus, label: t("admin.action.addTool") },
              { icon: FileText, label: t("admin.action.writePost") },
              { icon: Mail, label: t("admin.action.sendNewsletter") },
              { icon: Bug, label: t("admin.action.reviewBugs") },
            ].map((action) => (
              <button key={action.label} className="flex w-full items-center gap-3 rounded-lg border border-ink-200 p-3 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-brand-900/20">
                <action.icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                {action.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSection() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader titleKey="admin.nav.analytics" descKey="admin.analytics.desc" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("admin.analytics.visitors"), value: "48,210", change: "+12%" },
          { label: t("admin.analytics.pageviews"), value: "192,840", change: "+8%" },
          { label: t("admin.analytics.bounce"), value: "32%", change: "-3%" },
          { label: t("admin.analytics.avgSession"), value: "4m 12s", change: "+15s" },
        ].map((m) => (
          <Card key={m.label}>
            <p className="text-sm text-ink-500 dark:text-ink-400">{m.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-100">{m.value}</p>
            <p className="mt-1 text-xs text-success-700 dark:text-success-600">{m.change}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("admin.analytics.trafficChart")}</h2>
        <div className="mt-6 flex h-48 items-end justify-between gap-2">
          {[40, 55, 35, 70, 60, 85, 75, 90, 65, 80, 95, 70].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-accent-500 transition-all hover:opacity-80" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-400">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => <span key={m}>{m}</span>)}
        </div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("admin.analytics.topPages")}</h2>
          <div className="mt-4">
            {[
              { page: "/tools", views: "24,840" },
              { page: "/", views: "18,210" },
              { page: "/tools/json-formatter", views: "12,580" },
              { page: "/pricing", views: "8,940" },
              { page: "/blog", views: "6,120" },
            ].map((p) => <PlaceholderRow key={p.page} icon={Eye} label={p.page} value={p.views} />)}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("admin.analytics.sources")}</h2>
          <div className="mt-4">
            {[
              { src: t("admin.analytics.source.organic"), val: "58%" },
              { src: t("admin.analytics.source.direct"), val: "22%" },
              { src: t("admin.analytics.source.social"), val: "12%" },
              { src: t("admin.analytics.source.referral"), val: "8%" },
            ].map((s) => <PlaceholderRow key={s.src} icon={TrendingUp} label={s.src} value={s.val} />)}
          </div>
        </Card>
      </div>
    </div>
  );
}

function UsersSection() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader titleKey="admin.nav.users" descKey="admin.users.desc" action={<button className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" />{t("admin.users.add")}</button>} />
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input type="text" placeholder={t("admin.users.search")} className="h-9 w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none dark:border-ink-700 dark:bg-ink-800" />
          </div>
          <button className="btn-secondary btn-sm"><Filter className="h-3.5 w-3.5" />{t("common.filter")}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800">
                <th className="pb-3 pr-4">{t("admin.users.col.id")}</th>
                <th className="pb-3 pr-4">{t("admin.users.col.name")}</th>
                <th className="pb-3 pr-4">{t("admin.users.col.email")}</th>
                <th className="pb-3 pr-4">{t("admin.users.col.plan")}</th>
                <th className="pb-3 pr-4">{t("admin.users.col.status")}</th>
                <th className="pb-3 pr-4">{t("admin.users.col.joined")}</th>
                <th className="pb-3 text-right">{t("admin.users.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_USERS.map((u) => (
                <tr key={u.id} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                  <td className="py-3 pr-4 font-mono text-xs text-ink-500">{u.id}</td>
                  <td className="py-3 pr-4 font-medium text-ink-900 dark:text-ink-100">{u.name}</td>
                  <td className="py-3 pr-4 text-ink-600 dark:text-ink-400">{u.email}</td>
                  <td className="py-3 pr-4"><span className="badge-brand text-xs">{u.plan}</span></td>
                  <td className="py-3 pr-4">
                    <span className={cn("badge text-xs", u.status === "active" ? "badge-success" : u.status === "suspended" ? "badge-danger" : "badge-neutral")}>
                      {t(`admin.users.status.${u.status}`)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-400">{u.joined}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"><Eye className="h-3.5 w-3.5" /></button>
                      <button className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"><Edit className="h-3.5 w-3.5" /></button>
                      <button className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-danger dark:hover:bg-ink-800"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SimpleTableSection({ titleKey, descKey, columns, rows }: { titleKey: string; descKey: string; columns: { key: string; labelKey: string }[]; rows: Record<string, string>[] }) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader titleKey={titleKey} descKey={descKey} action={<button className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" />{t("admin.add")}</button>} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800">
                {columns.map((col) => <th key={col.key} className="pb-3 pr-4">{t(col.labelKey)}</th>)}
                <th className="pb-3 text-right">{t("admin.users.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                  {columns.map((col) => <td key={col.key} className="py-3 pr-4 text-ink-600 dark:text-ink-400">{row[col.key]}</td>)}
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"><Eye className="h-3.5 w-3.5" /></button>
                      <button className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"><Edit className="h-3.5 w-3.5" /></button>
                      <button className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-danger dark:hover:bg-ink-800"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MessagesSection() {
  const { t } = useTranslation();
  const messages = [
    { from: "sarah.cchen@outlook.com", subject: t("admin.messages.subj1"), preview: t("admin.messages.preview1"), time: "2m ago" },
    { from: "m.webb@gmail.com", subject: t("admin.messages.subj2"), preview: t("admin.messages.preview2"), time: "1h ago" },
    { from: "elena.r@proton.me", subject: t("admin.messages.subj3"), preview: t("admin.messages.preview3"), time: "3h ago" },
  ];
  return (
    <div>
      <PageHeader titleKey="admin.nav.messages" descKey="admin.messages.desc" />
      <div className="space-y-3">
        {messages.map((m, i) => (
          <Card key={i} className="cursor-pointer transition-colors hover:border-brand-300">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white">
                {m.from[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{m.from}</p>
                  <span className="text-xs text-ink-400">{m.time}</span>
                </div>
                <p className="mt-0.5 text-sm font-medium text-ink-700 dark:text-ink-300">{m.subject}</p>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{m.preview}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NewsletterSection() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader titleKey="admin.nav.newsletter" descKey="admin.newsletter.desc" action={<button className="btn-primary btn-sm"><Mail className="h-3.5 w-3.5" />{t("admin.newsletter.compose")}</button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-ink-500">{t("admin.newsletter.subscribers")}</p><p className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-100">521</p><p className="mt-1 text-xs text-success-700 dark:text-success-600">+38 this week</p></Card>
        <Card><p className="text-sm text-ink-500">{t("admin.newsletter.openRate")}</p><p className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-100">42.8%</p><p className="mt-1 text-xs text-success-700 dark:text-success-600">+2.1%</p></Card>
        <Card><p className="text-sm text-ink-500">{t("admin.newsletter.clickRate")}</p><p className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-100">12.3%</p><p className="mt-1 text-xs text-danger">-0.4%</p></Card>
      </div>
      <Card className="mt-6">
        <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("admin.newsletter.recent")}</h2>
        <div className="mt-4">
          {[
            { name: t("admin.newsletter.camp1"), sent: "Jul 28", opens: "48%" },
            { name: t("admin.newsletter.camp2"), sent: "Jul 21", opens: "45%" },
            { name: t("admin.newsletter.camp3"), sent: "Jul 14", opens: "51%" },
          ].map((c) => <PlaceholderRow key={c.name} icon={Mail} label={c.name} value={`${c.opens} opens`} sub={`Sent ${c.sent}`} />)}
        </div>
      </Card>
    </div>
  );
}

function FeedbackAdminSection() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader titleKey="admin.nav.feedback" descKey="admin.feedback.desc" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[{ label: t("admin.feedback.avgRating"), value: "4.6", sub: "↑ 0.2" }, { label: t("admin.feedback.total"), value: "284", sub: "+12" }, { label: t("admin.feedback.pending"), value: "8", sub: t("admin.feedback.needsReview") }].map((s) => (
          <Card key={s.label}><p className="text-sm text-ink-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-100">{s.value}</p><p className="mt-1 text-xs text-ink-400">{s.sub}</p></Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("admin.feedback.recent")}</h2>
        <div className="mt-4">
          {[1, 2, 3].map((i) => <PlaceholderRow key={i} icon={Star} label={t(`admin.feedback.item${i}`)} value={`${5 - i} ★`} sub={t("admin.feedback.daysAgo", { count: i })} />)}
        </div>
      </Card>
    </div>
  );
}

function BugsSection() {
  const { t } = useTranslation();
  const bugs = [
    { id: "BUG-042", title: t("admin.bugs.item1"), priority: "high", status: "open" },
    { id: "BUG-041", title: t("admin.bugs.item2"), priority: "medium", status: "in-progress" },
    { id: "BUG-040", title: t("admin.bugs.item3"), priority: "low", status: "resolved" },
  ];
  return (
    <div>
      <PageHeader titleKey="admin.nav.bugs" descKey="admin.bugs.desc" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[{ label: t("admin.bugs.open"), val: "7", color: "text-danger" }, { label: t("admin.bugs.progress"), val: "3", color: "text-warning-700 dark:text-warning-600" }, { label: t("admin.bugs.resolved"), val: "42", color: "text-success-700 dark:text-success-600" }, { label: t("admin.bugs.critical"), val: "1", color: "text-danger" }].map((s) => (
          <Card key={s.label}><p className="text-sm text-ink-500">{s.label}</p><p className={cn("mt-2 text-2xl font-bold", s.color)}>{s.val}</p></Card>
        ))}
      </div>
      <Card className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800"><th className="pb-3 pr-4">ID</th><th className="pb-3 pr-4">{t("admin.bugs.col.title")}</th><th className="pb-3 pr-4">{t("admin.bugs.col.priority")}</th><th className="pb-3 pr-4">{t("admin.bugs.col.status")}</th></tr></thead>
            <tbody>
              {bugs.map((b) => (
                <tr key={b.id} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                  <td className="py-3 pr-4 font-mono text-xs text-ink-500">{b.id}</td>
                  <td className="py-3 pr-4 font-medium text-ink-900 dark:text-ink-100">{b.title}</td>
                  <td className="py-3 pr-4"><span className={cn("badge text-xs", b.priority === "high" ? "badge-danger" : b.priority === "medium" ? "badge-warning" : "badge-neutral")}>{t(`admin.bugs.prio.${b.priority}`)}</span></td>
                  <td className="py-3 pr-4"><span className={cn("badge text-xs", b.status === "resolved" ? "badge-success" : "badge-neutral")}>{t(`admin.bugs.status.${b.status}`)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader titleKey="admin.nav.features" descKey="admin.features.desc" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800"><th className="pb-3 pr-4">{t("admin.features.col.title")}</th><th className="pb-3 pr-4">{t("admin.features.col.votes")}</th><th className="pb-3 pr-4">{t("admin.features.col.status")}</th></tr></thead>
            <tbody>
              {[
                { title: t("admin.features.f1"), votes: "248", status: "planned" },
                { title: t("admin.features.f2"), votes: "192", status: "in-progress" },
                { title: t("admin.features.f3"), votes: "156", status: "under-review" },
                { title: t("admin.features.f4"), votes: "84", status: "planned" },
              ].map((f, i) => (
                <tr key={i} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                  <td className="py-3 pr-4 font-medium text-ink-900 dark:text-ink-100">{f.title}</td>
                  <td className="py-3 pr-4"><span className="flex items-center gap-1 text-ink-600 dark:text-ink-400"><TrendingUp className="h-3.5 w-3.5" />{f.votes}</span></td>
                  <td className="py-3 pr-4"><span className="badge-neutral text-xs">{t(`admin.features.status.${f.status}`)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ToolsAdminSection() {
  const { t } = useTranslation();
  const implemented = TOOLS.filter((tool) => tool.implemented).length;
  const generic = TOOLS.filter((tool) => tool.component === "tools/GenericTool").length;
  const social = TOOLS.filter((tool) => tool.category === "social").length;
  const pdf = TOOLS.filter((tool) => tool.category === "pdf").length;
  return <div>
    <PageHeader titleKey="admin.nav.tools" descKey="admin.tools.desc" />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[{label:"Catalog tools",value:TOOLS.length},{label:"Implemented",value:implemented},{label:"PDF tools",value:pdf},{label:"Social tools",value:social}].map(x=><Card key={x.label}><p className="text-sm text-ink-500">{x.label}</p><p className="mt-1 text-2xl font-bold text-ink-900 dark:text-ink-100">{x.value}</p></Card>)}
    </div>
    {generic > 0 && <div className="mb-5 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800 dark:border-warning-900 dark:bg-warning-950/30 dark:text-warning-300"><strong>{generic} tool(s)</strong> still use the generic implementation. They should not be marketed as specialized tools until their real functionality is verified.</div>}
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-ink-900 dark:text-ink-100">Tool registry</h2><p className="text-xs text-ink-400">Every route below comes directly from the catalog.</p></div></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800"><th className="pb-3 pr-4">Tool</th><th className="pb-3 pr-4">Category</th><th className="pb-3 pr-4">Component</th><th className="pb-3 pr-4">Status</th></tr></thead><tbody>{TOOLS.map(tool=><tr key={tool.slug} className="border-b border-ink-100 last:border-0 dark:border-ink-800"><td className="py-3 pr-4"><Link className="font-medium text-brand-600 hover:underline" to={`/tools/${tool.slug}`}>{t(tool.nameKey)}</Link><div className="text-[11px] text-ink-400">/tools/{tool.slug}</div></td><td className="py-3 pr-4 text-ink-600 dark:text-ink-400">{tool.category}</td><td className="py-3 pr-4 text-xs text-ink-500">{tool.component}</td><td className="py-3 pr-4"><span className={cn("badge text-xs",tool.component === "tools/GenericTool" ? "badge-warning" : "badge-success")}>{tool.component === "tools/GenericTool" ? "Generic" : "Implemented"}</span></td></tr>)}</tbody></table></div>
    </Card>
  </div>;
}

function BlogAdminSection() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(BLOG_POSTS[0]?.slug || "");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const posts = useMemo(() => BLOG_POSTS.filter((p: any) => `${p.title || t(p.titleKey)} ${p.slug}`.toLowerCase().includes(query.toLowerCase())), [query, t]);

  useEffect(() => {
    let active = true;
    const base: any = BLOG_POSTS.find((p: any) => p.slug === selected);
    if (!base) return;
    const fallback = {
      slug: base.slug, title: base.title || t(base.titleKey), excerpt: base.excerpt || t(base.excerptKey), category: base.category,
      tags: (base.tags || []).join(", "), date: base.date, seoTitle: base.seoTitle || base.title || t(base.titleKey),
      seoDescription: base.seoDesc || base.excerpt || t(base.excerptKey), focusKeyword: (base.tags || [])[0] || "",
      secondaryKeywords: "", canonicalUrl: `${SITE_CONFIG.domain}/blog/${base.slug}`, content: base.content || base.body || t(base.bodyKey),
      coverImage: base.coverImage || "", coverAlt: base.title || t(base.titleKey), status: "published"
    };
    setDraft(fallback);
    (async () => {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) return;
      const { data } = await supabase.from('cms_articles').select('*').eq('slug', selected).maybeSingle();
      if (active && data) setDraft({ ...fallback, ...data, tags: (data.tags || []).join(', '), secondaryKeywords: (data.secondary_keywords || []).join(', '), seoTitle: data.seo_title, seoDescription: data.meta_description, canonicalUrl: data.canonical_url, coverImage: data.cover_image, coverAlt: data.cover_alt });
    })();
    return () => { active = false; };
  }, [selected, t]);

  const score = useMemo(() => {
    if (!draft) return 0;
    let n = 0; const words = (draft.content || '').trim().split(/\s+/).filter(Boolean).length;
    if (draft.title) n += 15; if (draft.seoTitle) n += 15; if ((draft.seoDescription || '').length >= 120 && (draft.seoDescription || '').length <= 170) n += 15;
    if (draft.focusKeyword && `${draft.title} ${draft.content}`.toLowerCase().includes(draft.focusKeyword.toLowerCase())) n += 15;
    if (words >= 1200) n += 15; else if (words >= 700) n += 10; if (/\[.*?\]\(\/(tools|blog)\//.test(draft.content || '')) n += 10; if (draft.coverImage) n += 10;
    if ((draft.tags || '').split(',').filter((x:string) => x.trim()).length >= 3) n += 5;
    return Math.min(100, n);
  }, [draft]);

  async function save() {
    if (!draft) return;
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const payload = {
        slug: draft.slug, title: draft.title, excerpt: draft.excerpt, content: draft.content, category: draft.category,
        tags: draft.tags.split(',').map((x:string) => x.trim()).filter(Boolean), focus_keyword: draft.focusKeyword,
        secondary_keywords: draft.secondaryKeywords.split(',').map((x:string) => x.trim()).filter(Boolean), seo_title: draft.seoTitle,
        meta_description: draft.seoDescription, canonical_url: draft.canonicalUrl, cover_image: draft.coverImage, cover_alt: draft.coverAlt,
        status: draft.status, published_at: draft.status === 'published' ? new Date().toISOString() : null, updated_at: new Date().toISOString()
      };
      if (supabase) {
        const { error } = await supabase.from('cms_articles').upsert(payload, { onConflict: 'slug' });
        if (error) throw error;
      } else {
        const raw = localStorage.getItem('zidrotool.blog.overrides'); const all = raw ? JSON.parse(raw) : {}; all[draft.slug] = draft; localStorage.setItem('zidrotool.blog.overrides', JSON.stringify(all));
      }
      setSaved(true); setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      console.error('CMS save failed', e);
      const raw = localStorage.getItem('zidrotool.blog.overrides'); const all = raw ? JSON.parse(raw) : {}; all[draft.slug] = draft; localStorage.setItem('zidrotool.blog.overrides', JSON.stringify(all));
    } finally { setLoading(false); }
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !supabase) return;
    const ext = file.name.split('.').pop() || 'jpg'; const path = `articles/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('cms-media').upload(path, file, { upsert: false, contentType: file.type });
    if (error) { console.error(error); return; }
    const { data } = supabase.storage.from('cms-media').getPublicUrl(path);
    setDraft((d:any) => ({ ...d, coverImage: data.publicUrl }));
  }

  if (!draft) return <Card>No blog posts found.</Card>;
  return <div><PageHeader titleKey="admin.nav.blog" descKey="admin.blog.desc" />
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <Card><input className="input mb-3" placeholder="Search articles…" value={query} onChange={e=>setQuery(e.target.value)}/><div className="max-h-[70vh] space-y-1 overflow-auto">{posts.map((p:any)=><button key={p.slug} onClick={()=>setSelected(p.slug)} className={cn("w-full rounded-lg p-3 text-left text-sm",selected===p.slug?"bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300":"hover:bg-ink-50 dark:hover:bg-ink-800")}><span className="line-clamp-2 font-medium">{p.title || t(p.titleKey)}</span><span className="mt-1 block text-[11px] text-ink-400">{p.date}</span></button>)}</div></Card>
      <Card><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">Article editor</h2><p className="text-xs text-ink-400">SEO score: <strong className={score>=80?"text-success-600":score>=60?"text-warning-600":"text-danger"}>{score}/100</strong></p></div><div className="flex gap-2"><select className="input w-auto" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="draft">Draft</option><option value="published">Published</option></select><button className="btn-primary" disabled={loading} onClick={save}>{loading?"Saving…":saved?"Saved":"Save changes"}</button></div></div>
        <div className="grid gap-4 md:grid-cols-2"><label className="label">Title<input className="input mt-1" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label className="label">Slug<input className="input mt-1" value={draft.slug} disabled/></label><label className="label">Category<input className="input mt-1" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}/></label><label className="label">Tags<input className="input mt-1" value={draft.tags} onChange={e=>setDraft({...draft,tags:e.target.value})}/></label><label className="label">Focus keyword<input className="input mt-1" value={draft.focusKeyword} onChange={e=>setDraft({...draft,focusKeyword:e.target.value})}/></label><label className="label">Secondary keywords<input className="input mt-1" value={draft.secondaryKeywords} onChange={e=>setDraft({...draft,secondaryKeywords:e.target.value})}/></label></div>
        <label className="label mt-4 block">Excerpt<textarea className="input mt-1 min-h-[90px]" value={draft.excerpt} onChange={e=>setDraft({...draft,excerpt:e.target.value})}/></label>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="label">SEO title<input className="input mt-1" value={draft.seoTitle} onChange={e=>setDraft({...draft,seoTitle:e.target.value})}/></label><label className="label">Meta description<textarea className="input mt-1 min-h-[90px]" value={draft.seoDescription} onChange={e=>setDraft({...draft,seoDescription:e.target.value})}/></label><label className="label">Canonical URL<input className="input mt-1" value={draft.canonicalUrl} onChange={e=>setDraft({...draft,canonicalUrl:e.target.value})}/></label><label className="label">Image alt text<input className="input mt-1" value={draft.coverAlt} onChange={e=>setDraft({...draft,coverAlt:e.target.value})}/></label></div>
        <label className="label mt-4 block">Article content (Markdown)<textarea className="input mt-1 min-h-[480px] font-mono text-sm" value={draft.content} onChange={e=>setDraft({...draft,content:e.target.value})}/></label>
        <div className="mt-4 rounded-xl border border-ink-200 p-4 dark:border-ink-800"><div className="flex items-center justify-between"><div><p className="font-semibold">Featured image</p><p className="text-xs text-ink-400">Upload to the Supabase Storage cms-media bucket.</p></div><label className="btn-secondary cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={upload}/>Upload image</label></div>{draft.coverImage&&<img src={draft.coverImage} alt={draft.coverAlt || draft.title} className="mt-4 max-h-56 w-full rounded-xl object-cover"/>}</div>
      </Card>
    </div></div>;
}

function CategoriesAdminSection() {
  const { t } = useTranslation();
  return <SimpleTableSection titleKey="admin.nav.categories" descKey="admin.categories.desc" columns={[{ key: "name", labelKey: "admin.cat.col.name" }, { key: "tools", labelKey: "admin.cat.col.tools" }, { key: "slug", labelKey: "admin.cat.col.slug" }]} rows={CATEGORIES.map((c) => ({ name: t(c.nameKey), tools: String(TOOLS.filter((tool) => tool.category === c.slug).length), slug: c.slug }))} />;
}

function ServicesAdminSection() {
  const { t } = useTranslation();
  return <SimpleTableSection titleKey="admin.nav.services" descKey="admin.services.desc" columns={[{ key: "name", labelKey: "admin.svc.col.name" }, { key: "status", labelKey: "admin.svc.col.status" }, { key: "slug", labelKey: "admin.svc.col.slug" }]} rows={ONLINE_SERVICES.map((s) => ({ name: t(s.nameKey), status: s.comingSoon ? t("admin.svc.soon") : t("admin.svc.active"), slug: s.slug }))} />;
}

function SettingsSection() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader titleKey="admin.nav.settings" descKey="admin.settings.desc" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("admin.settings.general")}</h2>
          <div className="mt-4 space-y-4">
            <div><label className="label">{t("admin.settings.siteName")}</label><input className="input" defaultValue={SITE_CONFIG.name} /></div>
            <div><label className="label">{t("admin.settings.domain")}</label><input className="input" defaultValue={SITE_CONFIG.domain} /></div>
            <div><label className="label">{t("admin.settings.supportEmail")}</label><input className="input" defaultValue={SITE_CONFIG.emails.support} /></div>
            <div><label className="label">{t("admin.settings.version")}</label><input className="input" defaultValue={SITE_CONFIG.version} /></div>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("admin.settings.appearance")}</h2>
          <div className="mt-4 space-y-4">
            <div><label className="label">{t("admin.settings.theme")}</label><select className="input"><option>Light</option><option>Dark</option><option>System</option></select></div>
            <div><label className="label">{t("admin.settings.language")}</label><select className="input"><option>English</option><option>Français</option><option>Español</option><option>Deutsch</option><option>Italiano</option><option>العربية</option></select></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LogsSection() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader titleKey="admin.nav.logs" descKey="admin.logs.desc" action={<button className="btn-secondary btn-sm"><Download className="h-3.5 w-3.5" />{t("admin.logs.export")}</button>} />
      <Card>
        <div className="space-y-2 font-mono text-xs">
          {ADMIN_LOGS.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 dark:border-ink-800">
              <span className="text-ink-400">{log.time}</span>
              <span className={cn("flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase", log.level === "error" ? "bg-danger-50 text-danger dark:bg-danger/15" : log.level === "warning" ? "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600" : "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400")}>
                {log.level === "error" ? <AlertTriangle className="h-3 w-3" /> : log.level === "warning" ? <AlertTriangle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                {log.level}
              </span>
              <span className="flex-1 text-ink-600 dark:text-ink-400">{log.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
