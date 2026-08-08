export interface OnlineService {
  slug: string;
  nameKey: string;
  descKey: string;
  longDescKey: string;
  icon: string;
  gradient: string;
  badge?: "new" | "soon" | "beta";
  features: string[];
  comingSoon?: boolean;
}

export const ONLINE_SERVICES: OnlineService[] = [
  {
    slug: "temporary-email",
    nameKey: "service.tempEmail.name",
    descKey: "service.tempEmail.desc",
    longDescKey: "service.tempEmail.long",
    icon: "Mail",
    gradient: "from-brand-500 to-accent-500",
    badge: "soon",
    features: ["Disposable addresses", "Inbox viewer", "Custom domain (Business+)", "Auto-expiry"],
    comingSoon: true,
  },
  {
    slug: "temporary-notes",
    nameKey: "service.tempNotes.name",
    descKey: "service.tempNotes.desc",
    longDescKey: "service.tempNotes.long",
    icon: "StickyNote",
    gradient: "from-accent-500 to-brand-600",
    badge: "soon",
    features: ["Self-destructing notes", "Password protection", "Read receipts", "Custom expiry"],
    comingSoon: true,
  },
  {
    slug: "file-sharing",
    nameKey: "service.fileShare.name",
    descKey: "service.fileShare.desc",
    longDescKey: "service.fileShare.long",
    icon: "Share2",
    gradient: "from-success-600 to-brand-500",
    badge: "soon",
    features: ["Large file transfer", "Encrypted at rest", "Download limits", "Auto-delete links"],
    comingSoon: true,
  },
  {
    slug: "url-shortener",
    nameKey: "service.urlShort.name",
    descKey: "service.urlShort.desc",
    longDescKey: "service.urlShort.long",
    icon: "Link",
    gradient: "from-warning-600 to-danger",
    badge: "soon",
    features: ["Custom aliases", "Click analytics", "QR code per link", "Bulk shorten"],
    comingSoon: true,
  },
  {
    slug: "qr-generator",
    nameKey: "service.qrGen.name",
    descKey: "service.qrGen.desc",
    longDescKey: "service.qrGen.long",
    icon: "QrCode",
    gradient: "from-danger to-accent-600",
    badge: "new",
    features: ["URL, text, WiFi QR", "Custom colors & logos", "SVG & PNG export", "Bulk generation"],
    comingSoon: true,
  },
  {
    slug: "password-manager",
    nameKey: "service.passMgr.name",
    descKey: "service.passMgr.desc",
    longDescKey: "service.passMgr.long",
    icon: "KeyRound",
    gradient: "from-brand-600 to-success-600",
    badge: "soon",
    features: ["Encrypted vault", "Auto-fill browser extension", "Secure sharing", "Breach monitoring"],
    comingSoon: true,
  },
  {
    slug: "link-in-bio",
    nameKey: "service.linkBio.name",
    descKey: "service.linkBio.desc",
    longDescKey: "service.linkBio.long",
    icon: "Link2",
    gradient: "from-accent-600 to-warning-600",
    badge: "soon",
    features: ["Custom profile page", "Analytics & click tracking", "Themes & branding", "Social integration"],
    comingSoon: true,
  },
  {
    slug: "paste-tool",
    nameKey: "service.paste.name",
    descKey: "service.paste.desc",
    longDescKey: "service.paste.long",
    icon: "Clipboard",
    gradient: "from-ink-600 to-brand-600",
    badge: "soon",
    features: ["Syntax highlighting", "Shareable links", "Password protection", "Auto-expiry"],
    comingSoon: true,
  },
];

const SERVICE_MAP: ReadonlyMap<string, OnlineService> = new Map(
  ONLINE_SERVICES.map((s) => [s.slug, s]),
);

export function getService(slug: string): OnlineService | undefined {
  return SERVICE_MAP.get(slug);
}
