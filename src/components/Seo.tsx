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
  keywords?: string[];
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
  keywords,
}: SeoProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const pageTitle = title ? `${title} — ZidroTool` : "ZidroTool — Smart Online Tools for Everyone";
  const desc =
    description ||
    (t("brand.tagline") as string) ||
    "Smart Online Tools for Everyone. Free, fast, privacy-first utilities.";
  const cleanPath = (path || location.pathname || "/").split("?")[0].split("#")[0] || "/";
  const canonical = `${SITE_URL}${cleanPath === "/" ? "/" : cleanPath.replace(/\/$/, "")}`;
  const ogImage = image
    ? (image.startsWith("http://") || image.startsWith("https://") ? image : `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`)
    : `${SITE_URL}/og-image.png`;
  const currentLanguage = (location.search.match(/[?&]lang=([^&]+)/)?.[1] || document.documentElement.lang || i18n.language || "en").split("-")[0];

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ZidroTool",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    slogan: "Smart Online Tools for Everyone",
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ZidroTool",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/tools?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <html lang={currentLanguage} />
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      {keywords?.length ? <meta name="keywords" content={keywords.join(", ")} /> : null}
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="referrer" content="strict-origin-when-cross-origin" />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="ZidroTool" />
      <meta property="og:locale" content={currentLanguage === "ar" ? "ar_AR" : currentLanguage === "fr" ? "fr_FR" : currentLanguage === "de" ? "de_DE" : currentLanguage === "es" ? "es_ES" : currentLanguage === "it" ? "it_IT" : "en_US"} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

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
      <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
    </Helmet>
  );
}
