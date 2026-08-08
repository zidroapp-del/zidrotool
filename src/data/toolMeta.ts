import type { FaqItem, HowToStep } from "@/types";

export interface ToolMeta {
  howTo: HowToStep[];
  faqs: FaqItem[];
}

const GENERIC_HOW_TO: HowToStep[] = [
  { titleKey: "howto.step1.title", descKey: "howto.step1.desc" },
  { titleKey: "howto.step2.title", descKey: "howto.step2.desc" },
  { titleKey: "howto.step3.title", descKey: "howto.step3.desc" },
];

const GENERIC_FAQS: FaqItem[] = [
  { qKey: "faq.general.q1", aKey: "faq.general.a1" },
  { qKey: "faq.general.q2", aKey: "faq.general.a2" },
  { qKey: "faq.general.q3", aKey: "faq.general.a3" },
  { qKey: "faq.general.q4", aKey: "faq.general.a4" },
];

const CREATOR_HOW_TO: HowToStep[] = [
  { titleKey: "howto.creator.step1.title", descKey: "howto.creator.step1.desc" },
  { titleKey: "howto.creator.step2.title", descKey: "howto.creator.step2.desc" },
  { titleKey: "howto.creator.step3.title", descKey: "howto.creator.step3.desc" },
];

const CREATOR_FAQS: FaqItem[] = [
  { qKey: "faq.creator.q1", aKey: "faq.creator.a1" },
  { qKey: "faq.creator.q2", aKey: "faq.creator.a2" },
  { qKey: "faq.creator.q3", aKey: "faq.creator.a3" },
  { qKey: "faq.creator.q4", aKey: "faq.creator.a4" },
];

const TOOL_META: Record<string, ToolMeta> = {
  "case-converter": {
    howTo: [
      { titleKey: "howto.case.step1.title", descKey: "howto.case.step1.desc" },
      { titleKey: "howto.case.step2.title", descKey: "howto.case.step2.desc" },
      { titleKey: "howto.case.step3.title", descKey: "howto.case.step3.desc" },
    ],
    faqs: GENERIC_FAQS,
  },
  "word-counter": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "base64": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "json-formatter": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "password-generator": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "yt-thumbnail-downloader": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "yt-thumbnail-viewer": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "yt-thumbnail-url": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "yt-channel-id": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "yt-playlist-id": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "yt-video-id": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "yt-thumbnail-size-guide": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "tt-username-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "ig-username-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "emoji-picker": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "font-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "creator-character-counter": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "social-image-size-guide": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
};

export function getToolMeta(slug: string): ToolMeta {
  return TOOL_META[slug] || { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS };
}
