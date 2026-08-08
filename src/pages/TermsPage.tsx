import { useTranslation } from "react-i18next";
import { StaticPage } from "@/components/StaticPage";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <StaticPage title={t("terms.title")} updated={t("terms.updated")} breadcrumbs={[{ label: t("footer.links.terms") }]}>
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using ZidroTool, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</p>
      <h2>2. Use of the Service</h2>
      <p>ZidroTool provides free online tools. You agree to use the service lawfully and not to misuse, abuse, or attempt to disrupt the service. All tools are provided "as is" without warranty of any kind.</p>
      <h2>3. Accounts</h2>
      <p>Registration is optional. If you create an account, you are responsible for maintaining the security of your credentials. You must provide accurate information when registering.</p>
      <h2>4. Premium Subscription</h2>
      <p>Premium features are available via a paid subscription. Subscriptions auto-renew unless cancelled. You can cancel at any time and retain access until the end of your billing period. Refunds are handled on a case-by-case basis.</p>
      <h2>5. Intellectual Property</h2>
      <p>The ZidroTool name, logo, and website design are the property of ZidroTool. User-generated content (such as text processed by tools) remains the property of the user.</p>
      <h2>6. Limitation of Liability</h2>
      <p>ZidroTool is not liable for any damages arising from the use or inability to use the service. Tools are provided for convenience and should not be relied upon for critical operations without verification.</p>
      <h2>7. Changes</h2>
      <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
      <h2>8. Contact</h2>
      <p>Questions about these terms? Email us at {SITE_CONFIG.emails.legal}.</p>
    </StaticPage>
  );
}
