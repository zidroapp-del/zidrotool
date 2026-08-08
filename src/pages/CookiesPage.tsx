import { useTranslation } from "react-i18next";
import { StaticPage } from "@/components/StaticPage";

export default function CookiesPage() {
  const { t } = useTranslation();
  return (
    <StaticPage title={t("cookies.title")} updated={t("cookies.updated")} breadcrumbs={[{ label: t("footer.links.cookies") }]}>
      <h2>1. What Are Cookies</h2>
      <p>Cookies are small text files stored in your browser. They help websites remember your preferences and maintain sessions.</p>
      <h2>2. Cookies We Use</h2>
      <ul>
        <li><strong>Essential cookies:</strong> Required for authentication and session management. These cannot be disabled.</li>
        <li><strong>Preference cookies:</strong> Remember your theme (light/dark/system) and language choice.</li>
        <li><strong>Local storage:</strong> Stores your favorites and tool history locally in your browser.</li>
      </ul>
      <h2>3. Managing Cookies</h2>
      <p>You can control cookies through your browser settings. Disabling essential cookies may affect functionality such as signing in. Preference and local storage data can be cleared from your browser at any time.</p>
      <h2>4. Third-Party Cookies</h2>
      <p>If you sign in using Google or GitHub, those providers may set their own cookies as part of the authentication process. We do not control these cookies — refer to their respective privacy policies.</p>
      <h2>5. Updates</h2>
      <p>We may update this policy as our service evolves. Significant changes will be communicated through the website.</p>
    </StaticPage>
  );
}
