export type PlanId = "free" | "pro" | "business" | "enterprise";
export type BillingCycle = "monthly" | "yearly";

export interface PlanFeature {
  key: string;
  free: string | boolean;
  pro: string | boolean;
  business: string | boolean;
  enterprise: string | boolean;
}

export interface PricingPlan {
  id: PlanId;
  nameKey: string;
  descKey: string;
  monthly: number;
  yearly: number;
  ctaKey: string;
  popular?: boolean;
  gradient: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  { id: "free", nameKey: "premium.plan.free", descKey: "premium.plan.free.desc", monthly: 0, yearly: 0, ctaKey: "premium.cta.free", gradient: "from-ink-500 to-ink-700" },
  { id: "pro", nameKey: "premium.plan.pro", descKey: "premium.plan.pro.desc", monthly: 9, yearly: 86, ctaKey: "premium.cta.pro", popular: true, gradient: "from-brand-500 to-accent-600" },
  { id: "business", nameKey: "premium.plan.business", descKey: "premium.plan.business.desc", monthly: 29, yearly: 278, ctaKey: "premium.cta.business", gradient: "from-accent-500 to-brand-700" },
  { id: "enterprise", nameKey: "premium.plan.enterprise", descKey: "premium.plan.enterprise.desc", monthly: 99, yearly: 948, ctaKey: "premium.cta.enterprise", gradient: "from-success-600 to-brand-700" },
];

export const COMPARISON_GROUPS: { labelKey: string; features: PlanFeature[] }[] = [
  {
    labelKey: "premium.compare.tools",
    features: [
      { key: "premium.feat.toolCount", free: "100+", pro: "100+", business: "100+", enterprise: "100+" },
      { key: "premium.feat.ads", free: false, pro: true, business: true, enterprise: true },
      { key: "premium.feat.ai", free: false, pro: true, business: true, enterprise: true },
      { key: "premium.feat.favSync", free: false, pro: true, business: true, enterprise: true },
      { key: "premium.feat.cloudHistory", free: false, pro: true, business: true, enterprise: true },
      { key: "premium.feat.earlyAccess", free: false, pro: true, business: true, enterprise: true },
    ],
  },
  {
    labelKey: "premium.compare.services",
    features: [
      { key: "premium.feat.tempEmail", free: "5/day", pro: "50/day", business: "Unlimited", enterprise: "Unlimited" },
      { key: "premium.feat.tempNotes", free: "10/day", pro: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
      { key: "premium.feat.fileShare", free: "10 MB", pro: "100 MB", business: "1 GB", enterprise: "5 GB" },
      { key: "premium.feat.urlShortener", free: "20/day", pro: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
      { key: "premium.feat.qrGenerator", free: true, pro: true, business: true, enterprise: true },
      { key: "premium.feat.passwordMgr", free: "50 entries", pro: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
      { key: "premium.feat.linkInBio", free: "1 page", pro: "5 pages", business: "20 pages", enterprise: "Unlimited" },
      { key: "premium.feat.pasteTool", free: "10/day", pro: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
    ],
  },
  {
    labelKey: "premium.compare.account",
    features: [
      { key: "premium.feat.seats", free: "1", pro: "1", business: "5", enterprise: "Unlimited" },
      { key: "premium.feat.support", free: "Community", pro: "Email", business: "Priority", enterprise: "Dedicated" },
      { key: "premium.feat.sla", free: false, pro: false, business: "99.9%", enterprise: "99.99%" },
      { key: "premium.feat.api", free: false, pro: false, business: true, enterprise: true },
      { key: "premium.feat.sso", free: false, pro: false, business: false, enterprise: true },
      { key: "premium.feat.auditLog", free: false, pro: false, business: true, enterprise: true },
    ],
  },
];

export function getPlan(id: PlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.id === id);
}

export interface MockInvoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "open" | "void";
  plan: string;
}

export const MOCK_INVOICES: MockInvoice[] = [
  { id: "INV-2026-008", date: "2026-08-01", amount: 9, status: "paid", plan: "Pro Monthly" },
  { id: "INV-2026-007", date: "2026-07-01", amount: 9, status: "paid", plan: "Pro Monthly" },
  { id: "INV-2026-006", date: "2026-06-01", amount: 9, status: "paid", plan: "Pro Monthly" },
  { id: "INV-2026-005", date: "2026-05-01", amount: 9, status: "paid", plan: "Pro Monthly" },
  { id: "INV-2026-004", date: "2026-04-01", amount: 29, status: "paid", plan: "Business Monthly" },
  { id: "INV-2026-003", date: "2026-03-01", amount: 29, status: "paid", plan: "Business Monthly" },
];

export interface UsageMetric {
  labelKey: string;
  used: number;
  limit: number;
  unit: string;
}

export const USAGE_METRICS: UsageMetric[] = [
  { labelKey: "usage.tempEmail", used: 3, limit: 50, unit: "" },
  { labelKey: "usage.tempNotes", used: 18, limit: 999, unit: "" },
  { labelKey: "usage.fileShare", used: 45, limit: 100, unit: "MB" },
  { labelKey: "usage.urlShortener", used: 12, limit: 999, unit: "" },
  { labelKey: "usage.passwordMgr", used: 32, limit: 999, unit: "" },
  { labelKey: "usage.linkInBio", used: 2, limit: 5, unit: "" },
  { labelKey: "usage.pasteTool", used: 7, limit: 999, unit: "" },
  { labelKey: "usage.qrGenerator", used: 15, limit: 999, unit: "" },
];
