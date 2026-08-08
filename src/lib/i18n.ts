import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { en } from "@/locales/en";
import { fr } from "@/locales/fr";
import { de } from "@/locales/de";
import { es } from "@/locales/es";
import { it } from "@/locales/it";
import { ar } from "@/locales/ar";
import type { Lang } from "@/types";

export const LANGUAGES: { code: Lang; label: string; flag: string; rtl?: boolean }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ar", label: "العربية", flag: "🇸🇦", rtl: true },
];

export function isRtl(lang: string) {
  return LANGUAGES.find((l) => l.code === lang)?.rtl === true;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      es: { translation: es },
      it: { translation: it },
      ar: { translation: ar },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "fr", "de", "es", "it", "ar"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "zidrotool-lang",
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", (lang) => {
  const rtl = isRtl(lang);
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  document.documentElement.lang = lang;
});

export function setLanguage(lang: Lang) {
  i18n.changeLanguage(lang);
  const rtl = isRtl(lang);
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function applyDir(lang: string) {
  const rtl = isRtl(lang);
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export default i18n;
