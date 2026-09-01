import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertTriangle, XCircle, Activity } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { cn } from "@/lib/utils";

interface StatusService {
  name: string;
  status: "operational" | "degraded" | "down";
  uptime: string;
  history: ("up" | "degraded" | "down")[];
}

const SERVICES: StatusService[] = [
  { name: "Web Application", status: "operational", uptime: "99.98%", history: Array(30).fill("up") },
  { name: "Tool Processing Engine", status: "operational", uptime: "100%", history: Array(30).fill("up") },
  { name: "Authentication Service", status: "operational", uptime: "99.95%", history: Array(29).fill("up").concat(["degraded"]) },
  { name: "Blog & Documentation", status: "operational", uptime: "99.99%", history: Array(30).fill("up") },
  { name: "Creator Tools", status: "operational", uptime: "100%", history: Array(30).fill("up") },
  { name: "API (Coming Soon)", status: "degraded", uptime: "—", history: Array(15).fill("up").concat(Array(15).fill("degraded")) },
];

const HISTORY_COLORS: Record<string, string> = {
  up: "bg-success-500",
  degraded: "bg-warning-500",
  down: "bg-danger",
};

export default function StatusPage() {
  const { t } = useTranslation();
  const allOk = SERVICES.every((s) => s.status === "operational");
  const overallUptime = "99.97%";

  return (
    <>
      <Seo title={t("status.title")} description={t("status.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("footer.links.status") }]} />

        {/* Overall status banner */}
        <div className={cn(
          "mt-6 overflow-hidden rounded-2xl border p-6",
          allOk
            ? "border-success/30 bg-success-50/50 dark:bg-success-700/10"
            : "border-warning/30 bg-warning-50/50 dark:bg-warning-700/10",
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              allOk ? "bg-success-100 text-success-700 dark:bg-success-700/20" : "bg-warning-100 text-warning-700 dark:bg-warning-700/20",
            )}>
              {allOk ? <CheckCircle2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("status.title")}</h1>
              <p className={cn("mt-1 text-sm font-medium", allOk ? "text-success-700 dark:text-success-600" : "text-warning-700 dark:text-warning-600")}>
                {allOk ? t("status.allOk") : t("status.degraded")}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{overallUptime}</p>
              <p className="text-xs text-ink-400">{t("status.overall")}</p>
            </div>
          </div>
        </div>

        {/* Service list with uptime history */}
        <div className="mt-8 space-y-3">
          {SERVICES.map((s) => {
            const isOk = s.status === "operational";
            const isDegraded = s.status === "degraded";
            const Icon = isOk ? CheckCircle2 : isDegraded ? AlertTriangle : XCircle;
            return (
              <div key={s.name} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "h-5 w-5 shrink-0",
                      isOk ? "text-success-700 dark:text-success-600" : isDegraded ? "text-warning-700 dark:text-warning-600" : "text-danger",
                    )} />
                    <span className="font-medium text-ink-900 dark:text-ink-100">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-ink-500 dark:text-ink-400">{s.uptime}</span>
                    <span className={cn(
                      "badge",
                      isOk ? "badge-success" : isDegraded ? "badge-warning" : "badge-danger",
                    )}>
                      {t(`status.${s.status}`)}
                    </span>
                  </div>
                </div>

                {/* 30-day uptime history bars */}
                <div className="mt-4 flex items-end gap-0.5">
                  {s.history.map((day, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-8 flex-1 rounded-sm transition-all hover:opacity-80",
                        HISTORY_COLORS[day],
                      )}
                      title={`Day ${i + 1}: ${day === "up" ? "Operational" : day === "degraded" ? "Degraded" : "Down"}`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-ink-400">
                  <span>30 days ago</span>
                  <span>{t("status.uptime30d")}</span>
                  <span>Today</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Incidents section */}
        <div className="mt-10">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100">{t("status.incidents")}</h2>
          </div>
          <div className="mt-4 card p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success-700 dark:text-success-600" />
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">{t("status.noIncidents")}</p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-ink-400">{t("status.lastUpdated")}: {new Date().toLocaleString()}</p>
      </div>
    </>
  );
}
