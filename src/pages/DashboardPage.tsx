import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, Clock, LogOut, Crown, Trash2 } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { useHistory } from "@/lib/history";
import { useToast } from "@/components/Toast";
import { EmptyState } from "@/components/EmptyState";
import { getTool } from "@/data/catalog";
import { getIcon } from "@/lib/icons";
import { formatDate, cn } from "@/lib/utils";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user, loading, signOut } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const { history, clearHistory } = useHistory();
  const { success } = useToast();

  if (loading) {
    return <div className="container-page py-20 text-center text-ink-400">{t("common.loading")}</div>;
  }
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const favTools = favorites.map((s) => getTool(s)).filter(Boolean);
  const name = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User";

  const handleClearHistory = () => {
    clearHistory();
    success("History cleared");
  };

  return (
    <>
      <Seo title={t("dash.title")} noIndex />
      <div className="container-page py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">
              {t("dash.welcome", { name })}
            </h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t("dash.title")}</p>
          </div>
          <button onClick={signOut} className="btn-secondary btn-sm">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t("dash.profile.signout")}</span>
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-ink-900 dark:text-ink-100">{name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 dark:border-ink-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500 dark:text-ink-400">{t("dash.profile.email")}</span>
                <span className="font-medium text-ink-900 dark:text-ink-100">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500 dark:text-ink-400">{t("dash.plan")}</span>
                <span className={cn("badge", favorites.length > 0 ? "badge-brand" : "badge-neutral")}>
                  <Crown className="h-3 w-3" />
                  {t("dash.plan.free")}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/dashboard/billing" className="btn-secondary btn-sm">{t("billing.title")}</Link>
              <Link to="/dashboard/usage" className="btn-secondary btn-sm">{t("usage.title")}</Link>
              <Link to="/dashboard/invoices" className="btn-secondary btn-sm">{t("billing.invoices")}</Link>
            </div>
            <Link to="/pricing" className="btn-primary btn-sm mt-4 w-full">
              <Crown className="h-3.5 w-3.5" />
              {t("premium.cta.pro")}
            </Link>
          </div>

          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-warning-600" />
              <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">{t("dash.favorites")}</h2>
              <span className="badge-neutral ml-auto">{favorites.length}</span>
            </div>
            {favTools.length === 0 ? (
              <EmptyState
                icon={Star}
                title={t("dash.favorites.empty")}
                action={<Link to="/tools" className="btn-secondary btn-sm">{t("nav.tools")}</Link>}
                className="mt-4"
              />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {favTools.map((tool) => {
                  if (!tool) return null;
                  const Icon = getIcon(tool.icon);
                  return (
                    <div key={tool.slug} className="flex items-center gap-3 rounded-lg border border-ink-200 p-3 transition-all duration-200 hover:border-brand-300 hover:shadow-sm dark:border-ink-700 dark:hover:border-brand-700">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <Link to={`/tools/${tool.slug}`} className="flex-1 truncate text-sm font-medium text-ink-900 transition-colors hover:text-brand-600 dark:text-ink-100">
                        {t(tool.nameKey)}
                      </Link>
                      <button onClick={() => toggleFavorite(tool.slug)} className="text-warning-600 transition-transform hover:scale-110" aria-label="Remove favorite">
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 card p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">{t("dash.history")}</h2>
            {history.length > 0 && (
              <button onClick={handleClearHistory} className="ml-auto flex items-center gap-1 text-xs text-ink-400 transition-colors hover:text-danger dark:text-ink-500">
                <Trash2 className="h-3.5 w-3.5" />
                {t("dash.history.clear")}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={t("dash.history.empty")}
              className="mt-4"
            />
          ) : (
            <div className="mt-4 space-y-2">
              {history.slice(0, 15).map((h, i) => {
                const tool = getTool(h.slug);
                if (!tool) return null;
                const Icon = getIcon(tool.icon);
                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-ink-100 p-3 transition-all duration-200 hover:border-brand-200 hover:bg-ink-50/50 dark:border-ink-800 dark:hover:border-brand-800 dark:hover:bg-ink-800/30">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Link to={`/tools/${h.slug}`} className="flex-1 truncate text-sm font-medium text-ink-900 transition-colors hover:text-brand-600 dark:text-ink-100">
                      {h.name}
                    </Link>
                    <span className="text-xs text-ink-400 dark:text-ink-500">{formatDate(new Date(h.ts).toISOString(), i18n.language)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
