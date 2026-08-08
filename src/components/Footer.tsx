import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Zap, Twitter, Github, Linkedin, Youtube, Mail, MessageCircle, Heart } from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { getIcon } from "@/lib/icons";
import { Newsletter } from "@/components/Newsletter";
import { SITE_CONFIG, getSocialLinks } from "@/lib/siteConfig";

const SOCIAL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
    <footer className="mt-auto border-t border-ink-200 bg-ink-50/50 dark:border-ink-800 dark:bg-ink-950">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand + newsletter */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                <Zap className="h-5 w-5" fill="currentColor" />
              </div>
              <span className="text-lg font-bold tracking-tight text-ink-900 dark:text-ink-100">
                Zidro<span className="text-brand-600 dark:text-brand-400">Tool</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              {t("footer.tagline")}
            </p>
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-600">
                {t("footer.newsletter")}
              </p>
              <Newsletter variant="compact" />
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
              <FooterLink to="/changelog">{t("footer.links.changelog")}</FooterLink>
            </FooterCol>

            <FooterCol title={t("footer.developers")}>
              <FooterLink to="/api">{t("footer.links.api")}</FooterLink>
              <FooterLink to="/status">{t("footer.links.status")}</FooterLink>
              <FooterLink to="/feedback">{t("footer.links.feedback")}</FooterLink>
              <FooterLink to="/release-notes">{t("footer.links.releases")}</FooterLink>
            </FooterCol>

            <FooterCol title={t("footer.legal")}>
              <FooterLink to="/privacy">{t("footer.links.privacy")}</FooterLink>
              <FooterLink to="/terms">{t("footer.links.terms")}</FooterLink>
              <FooterLink to="/cookies">{t("footer.links.cookies")}</FooterLink>
            </FooterCol>
          </div>
        </div>

        {/* Categories quick links */}
        <div className="mt-10 flex flex-wrap gap-2 border-t border-ink-200 pt-8 dark:border-ink-800">
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
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-ink-200 pt-8 dark:border-ink-800 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
            <span>© {year} {SITE_CONFIG.name}.</span>
            <span>{t("footer.rights")}</span>
            <span className="rounded-md border border-ink-200 px-1.5 py-0.5 font-mono text-[10px] text-ink-400 dark:border-ink-700">v{SITE_CONFIG.version}</span>
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

        <p className="mt-4 flex items-center justify-center gap-1 text-center text-[11px] text-ink-400 dark:text-ink-600">
          <span>{t("footer.madeWith")}</span>
          <Heart className="h-3 w-3 fill-danger text-danger" />
          <span>{t("footer.madeFor")}</span>
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-600">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-ink-600 transition-colors hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400"
      >
        {children}
      </Link>
    </li>
  );
}
