import { useTranslation } from "react-i18next";
import { StaticPage } from "@/components/StaticPage";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <StaticPage title={t("privacy.title")} updated={t("privacy.updated")} breadcrumbs={[{ label: t("footer.links.privacy") }]}>
      <h2>1. Information We Collect</h2>
      <p>ZidroTool is designed with a privacy-first philosophy. Most tools run entirely in your browser, meaning the data you process never reaches our servers. We collect minimal information necessary to operate the service:</p>
      <ul>
        <li>Account information (email address) — only if you choose to create an account.</li>
        <li>Usage analytics aggregated and anonymized to improve our tools.</li>
        <li>Essential cookies required for the website to function.</li>
      </ul>
      <h2>2. How We Use Your Data</h2>
      <p>We use the limited data we collect solely to: provide and maintain the service, improve user experience, communicate updates, and ensure security. We never sell your data to third parties.</p>
      <h2>3. Data Storage</h2>
      <p>Tool inputs and outputs are processed locally in your browser and are not stored on our servers. Favorites and history are stored in your browser's local storage unless you sync them with a Premium account.</p>
      <h2>4. Cookies</h2>
      <p>We use essential cookies for authentication and preference storage. See our <a href="/cookies">Cookie Policy</a> for details.</p>
      <h2>5. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal data. Since most data stays in your browser, clearing your browser data removes it immediately. For account data, contact us at {SITE_CONFIG.emails.privacy}.</p>
      <h2>6. Third-Party Services</h2>
      <p>We use Supabase for authentication and data storage. If you sign in with Google or GitHub, those providers handle the authentication flow. QR code generation uses a third-party API for the image rendering only.</p>
      <h2>7. Contact</h2>
      <p>Questions about privacy? Email us at {SITE_CONFIG.emails.privacy}.</p>
    </StaticPage>
  );
}
