export interface SiteConfig {
  name: string;
  shortName: string;
  domain: string;
  url: string;
  description: string;
  version: string;
  founded: string;

  emails: {
    support: string;
    contact: string;
    press: string;
    partners: string;
    careers: string;
    security: string;
    legal: string;
    privacy: string;
  };

  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    full: string;
  };

  phone: string;

  social: {
    twitter: string;
    github: string;
    linkedin: string;
    youtube: string;
    discord: string;
    reddit: string;
  };

  businessHours: {
    days: string;
    hours: string;
    timezone: string;
  };

  responseTime: string;
  mapsEmbedQuery: string;

  stats: {
    tools: string;
    categories: string;
    countries: string;
    languages: string;
    users: string;
    uptime: string;
  };
}

export const SITE_CONFIG: SiteConfig = {
  name: "ZidroTool",
  shortName: "Zidro",
  domain: "zidrotool.com",
  url: "https://zidrotool.com",

  description:
    "Free online tools for developers, designers, creators, and everyday users. Fast, simple, and privacy-first.",

  version: "2.4.1",
  founded: "2024",

  emails: {
    support: "hello@zidrotool.com",
    contact: "contact@zidrotool.com",
    press: "press@zidrotool.com",
    partners: "partners@zidrotool.com",
    careers: "careers@zidrotool.com",
    security: "security@zidrotool.com",
    legal: "legal@zidrotool.com",
    privacy: "privacy@zidrotool.com",
  },

  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    full: "",
  },

  phone: "",

  social: {
    twitter: "",
    github: "https://github.com/zidrotool",
    linkedin: "",
    youtube: "",
    discord: "",
    reddit: "",
  },

  businessHours: {
    days: "Monday – Friday",
    hours: "9:00 AM – 6:00 PM",
    timezone: "UTC",
  },

  responseTime: "Within 24 hours on business days",

  mapsEmbedQuery: "",

  stats: {
    tools: "70+",
    categories: "13",
    countries: "Worldwide",
    languages: "6",
    users: "—",
    uptime: "—",
  },
};

export function getEmail(key: keyof SiteConfig["emails"]): string {
  return SITE_CONFIG.emails[key];
}

export function getSocialLinks() {
  return [
    {
      key: "twitter",
      label: "Twitter",
      url: SITE_CONFIG.social.twitter,
    },
    {
      key: "github",
      label: "GitHub",
      url: SITE_CONFIG.social.github,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      url: SITE_CONFIG.social.linkedin,
    },
    {
      key: "youtube",
      label: "YouTube",
      url: SITE_CONFIG.social.youtube,
    },
    {
      key: "discord",
      label: "Discord",
      url: SITE_CONFIG.social.discord,
    },
    {
      key: "reddit",
      label: "Reddit",
      url: SITE_CONFIG.social.reddit,
    },
  ].filter((s) => s.url);
}