import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
  jsonLd?: object | object[];
  noIndex?: boolean;
}

const SITE_URL = "https://zidrotool.com";

export function Seo({
  title,
  description,
  path,
  image,
  type = "website",
  jsonLd,
  noIndex,
}: SeoProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const pageTitle = title ? `${title} — ZidroTool` : "ZidroTool — Smart Online Tools for Everyone";
  const desc =
    description ||
    (t("brand.tagline") as string) ||
    "Smart Online Tools for Everyone. Free, fast, privacy-first utilities.";
  const canonical = `${SITE_URL}${path || location.pathname}`;
  const ogImage = image || `${SITE_URL}/og-image.png`;

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ZidroTool",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    slogan: "Smart Online Tools for Everyone",
  };

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="ZidroTool" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
      <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
    </Helmet>
  );
}
