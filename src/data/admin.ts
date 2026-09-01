export type AdminSection =
  | "overview"
  | "analytics"
  | "users"
  | "messages"
  | "newsletter"
  | "feedback"
  | "bugs"
  | "features"
  | "tools"
  | "blog"
  | "categories"
  | "services"
  | "settings"
  | "logs";

export interface AdminNavItem {
  id: AdminSection;
  labelKey: string;
  icon: string;
  group: "main" | "content" | "system";
  badge?: number;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: "overview", labelKey: "admin.nav.overview", icon: "LayoutDashboard", group: "main" },
  { id: "analytics", labelKey: "admin.nav.analytics", icon: "BarChart3", group: "main" },
  { id: "users", labelKey: "admin.nav.users", icon: "Users", group: "main", badge: 1248 },
  { id: "messages", labelKey: "admin.nav.messages", icon: "MessageSquare", group: "main", badge: 3 },
  { id: "newsletter", labelKey: "admin.nav.newsletter", icon: "Mail", group: "main", badge: 521 },
  { id: "feedback", labelKey: "admin.nav.feedback", icon: "Star", group: "main" },
  { id: "bugs", labelKey: "admin.nav.bugs", icon: "Bug", group: "main", badge: 7 },
  { id: "features", labelKey: "admin.nav.features", icon: "Lightbulb", group: "main", badge: 12 },
  { id: "tools", labelKey: "admin.nav.tools", icon: "Wrench", group: "content" },
  { id: "blog", labelKey: "admin.nav.blog", icon: "FileText", group: "content" },
  { id: "categories", labelKey: "admin.nav.categories", icon: "FolderTree", group: "content" },
  { id: "services", labelKey: "admin.nav.services", icon: "Globe", group: "content" },
  { id: "settings", labelKey: "admin.nav.settings", icon: "Settings", group: "system" },
  { id: "logs", labelKey: "admin.nav.logs", icon: "ScrollText", group: "system" },
];

export interface AdminStat {
  labelKey: string;
  value: string;
  change: string;
  trend: "up" | "down" | "flat";
  icon: string;
  color: string;
}

export const ADMIN_STATS: AdminStat[] = [
  { labelKey: "admin.stats.revenue", value: "$12,840", change: "+18%", trend: "up", icon: "DollarSign", color: "text-success-700 bg-success-50 dark:bg-success-700/20 dark:text-success-600" },
  { labelKey: "admin.stats.users", value: "1,248", change: "+124", trend: "up", icon: "Users", color: "text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400" },
  { labelKey: "admin.stats.tools", value: "47", change: "+3", trend: "up", icon: "Wrench", color: "text-accent-600 bg-accent-50 dark:bg-accent-900/30 dark:text-accent-400" },
  { labelKey: "admin.stats.subscribers", value: "521", change: "+38", trend: "up", icon: "Mail", color: "text-warning-700 bg-warning-50 dark:bg-warning-700/20 dark:text-warning-600" },
];

export interface AdminActivity {
  id: string;
  type: "user" | "tool" | "blog" | "feedback" | "system";
  messageKey: string;
  time: string;
}

export const ADMIN_ACTIVITIES: AdminActivity[] = [
  { id: "1", type: "user", messageKey: "admin.activity.userSignup", time: "2 min ago" },
  { id: "2", type: "tool", messageKey: "admin.activity.toolAdded", time: "1 hour ago" },
  { id: "3", type: "feedback", messageKey: "admin.activity.feedbackNew", time: "3 hours ago" },
  { id: "4", type: "blog", messageKey: "admin.activity.blogPublished", time: "5 hours ago" },
  { id: "5", type: "system", messageKey: "admin.activity.systemUpdate", time: "1 day ago" },
];

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: "active" | "suspended" | "trial";
  joined: string;
}

export const ADMIN_USERS: AdminUser[] = [
  { id: "U-1042", name: "Sarah Chen", email: "sarah.cchen@outlook.com", plan: "Pro", status: "active", joined: "2026-07-15" },
  { id: "U-1041", name: "Marcus Webb", email: "m.webb@gmail.com", plan: "Business", status: "active", joined: "2026-07-12" },
  { id: "U-1040", name: "Elena Rodriguez", email: "elena.r@proton.me", plan: "Free", status: "trial", joined: "2026-07-10" },
  { id: "U-1039", name: "James Park", email: "jpark@duck.com", plan: "Pro", status: "active", joined: "2026-07-08" },
  { id: "U-1038", name: "Aisha Patel", email: "aisha.patel@icloud.com", plan: "Enterprise", status: "active", joined: "2026-07-05" },
  { id: "U-1037", name: "Tom Bradley", email: "tbradley@yahoo.com", plan: "Free", status: "suspended", joined: "2026-07-01" },
];

export interface AdminLogEntry {
  id: string;
  level: "info" | "warning" | "error";
  message: string;
  time: string;
}

export const ADMIN_LOGS: AdminLogEntry[] = [
  { id: "L-9012", level: "info", message: "Daily backup completed successfully", time: "2026-08-02 03:00:02" },
  { id: "L-9011", level: "warning", message: "Rate limit threshold reached for /api/tools", time: "2026-08-02 02:47:18" },
  { id: "L-9010", level: "info", message: "New user registration: U-1042", time: "2026-08-02 02:31:05" },
  { id: "L-9009", level: "error", message: "Failed to send newsletter batch (3/50 bounced)", time: "2026-08-02 01:15:44" },
  { id: "L-9008", level: "info", message: "Edge function deployed: temp-email", time: "2026-08-01 23:22:11" },
  { id: "L-9007", level: "warning", message: "Storage bucket reaching 80% capacity", time: "2026-08-01 22:08:30" },
  { id: "L-9006", level: "info", message: "Monthly invoice generated for Business plan users", time: "2026-08-01 20:00:00" },
];
