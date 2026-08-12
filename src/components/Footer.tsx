import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Twitter,
  Github,
  Linkedin,
  Youtube,
  Mail,
  MessageCircle,
  Heart,
} from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { getIcon } from "@/lib/icons";
import { Newsletter } from "@/components/Newsletter";
import { SITE_CONFIG, getSocialLinks } from "@/lib/siteConfig";

const SOCIAL_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  twitter: Twitter,
  github: Github,
  linkedin: Linkedin,
  youtube: Youtube,
  discord: MessageCircle,
  reddit: MessageCircle,
};

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const socials = getSocialLinks();

  return (
    <footer>
      {/* Brand + newsletter */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-600" />
            <span className="text-lg font-bold text-ink-900 dark:text-ink-100">
              ZidroTool
            </span>
          </div>

          <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
            {t("footer.tagline")}
          </p>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-ink-700 dark:text-ink-300">
              {t("footer.newsletter")}
            </p>
            <Newsletter />
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          <FooterCol title={t("footer.company")}>
            <FooterLink to="/about">{t("footer.links.about")}</FooterLink>
            <FooterLink to="/contact">{t("footer.links.contact")}</FooterLink>
            <FooterLink to="/careers">{t("footer.links.careers")}</FooterLink>
            <FooterLink to="/partners">{t("footer.links.partners")}</FooterLink>
            <FooterLink to="/press">{t("footer.links.press")}</FooterLink>
          </FooterCol>

          <FooterCol title={t("footer.resources")}>
            <FooterLink to="/tools">{t("footer.links.tools")}</FooterLink>
            <FooterLink to="/services">{t("nav.services")}</FooterLink>
            <FooterLink to="/blog">{t("footer.links.blog")}</FooterLink>
            <FooterLink to="/roadmap">{t("footer.links.roadmap")}</FooterLink>
            <FooterLink to="/changelog">
              {t("footer.links.changelog")}
            </FooterLink>
          </FooterCol>

          <FooterCol title={t("footer.developers")}>
            <FooterLink to="/api">{t("footer.links.api")}</FooterLink>
            <FooterLink to="/status">{t("footer.links.status")}</FooterLink>
            <FooterLink to="/feedback">
              {t("footer.links.feedback")}
            </FooterLink>
            <FooterLink to="/release-notes">
              {t("footer.links.releases")}
            </FooterLink>
          </FooterCol>

          <FooterCol title={t("footer.legal")}>
            <FooterLink to="/privacy">{t("footer.links.privacy")}</FooterLink>
            <FooterLink to="/terms">{t("footer.links.terms")}</FooterLink>
            <FooterLink to="/cookies">{t("footer.links.cookies")}</FooterLink>
          </FooterCol>
        </div>
      </div>

      {/* Categories quick links */}
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap gap-2 border-t border-ink-200 px-4 pt-8 dark:border-ink-800">
        {CATEGORIES.map((cat) => {
          const Icon = getIcon(cat.icon);

          return (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-400 dark:hover:border-brand-700 dark:hover:text-brand-400"
            >
              <Icon className="h-3 w-3" />
              {t(cat.nameKey)}
            </Link>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-ink-200 px-4 pt-8 dark:border-ink-800 sm:flex-row">
        <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
          <span>
             © {year} {SITE_CONFIG.name}.
          </span>

          <span>{t("footer.rights")}</span>

          <span className="rounded-md border border-ink-200 px-1.5 py-0.5 font-mono text-[10px] text-ink-400 dark:border-ink-700">
            v{SITE_CONFIG.version}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {socials.map((s) => {
            const Icon = SOCIAL_ICON_MAP[s.key] || Mail;

            return (
              <a
                key={s.key}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-ink-400 transition-all duration-200 hover:scale-110 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800 dark:hover:text-brand-400"
                aria-label={s.label}
              >
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      </div>

      {/* Made with */}
      <p className="mt-4 flex items-center justify-center gap-1 pb-6 text-center text-[11px] text-ink-400 dark:text-ink-600">
        <span>{t("footer.madeWith")}</span>
        <Heart className="h-3 w-3 fill-danger text-danger" />
      </p>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
        {title}
      </h3>

      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

function FooterLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="block text-sm text-ink-500 transition-colors hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400"
    >
      {children}
    </Link>
  );
}