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
  "meta-title-checker": { howTo: [], faqs: [] },
  "case-converter": {
    howTo: [
      { titleKey: "howto.case.step1.title", descKey: "howto.case.step1.desc" },
      { titleKey: "howto.case.step2.title", descKey: "howto.case.step2.desc" },
      { titleKey: "howto.case.step3.title", descKey: "howto.case.step3.desc" },
    ],
    faqs: GENERIC_FAQS,
  },
  "bytes-converter": {
    howTo: GENERIC_HOW_TO,
    faqs: [
      { qKey: "faq.bytes.q1", aKey: "faq.bytes.a1" },
      { qKey: "faq.bytes.q2", aKey: "faq.bytes.a2" },
      { qKey: "faq.bytes.q3", aKey: "faq.bytes.a3" },
    ],
  },
  "image-compressor": {
    howTo: GENERIC_HOW_TO,
    faqs: [
      { qKey: "faq.imageCompressor.q1", aKey: "faq.imageCompressor.a1" },
      { qKey: "faq.imageCompressor.q2", aKey: "faq.imageCompressor.a2" },
      { qKey: "faq.imageCompressor.q3", aKey: "faq.imageCompressor.a3" },
      { qKey: "faq.imageCompressor.q4", aKey: "faq.imageCompressor.a4" },
    ],
  },
  "length-distance-converter": {
    howTo: [],
    faqs: [
      { qKey: "lengthDistance.faq.q1", aKey: "lengthDistance.faq.a1" },
      { qKey: "lengthDistance.faq.q2", aKey: "lengthDistance.faq.a2" },
      { qKey: "lengthDistance.faq.q3", aKey: "lengthDistance.faq.a3" },
      { qKey: "lengthDistance.faq.q4", aKey: "lengthDistance.faq.a4" },
    ],
  },
  "word-counter": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "base64": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "json-formatter": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "password-generator": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "yt-thumbnail-downloader": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-tag-extractor": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-tag-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-hashtag-extractor": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-hashtag-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-title-extractor": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-title-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-title-length-checker": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-description-extractor": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-description-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-embed-code-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-channel-id-extractor": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-channel-finder": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-channel-statistics": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-video-statistics": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-channel-logo-downloader": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-channel-banner-downloader": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-video-count-checker": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-channel-age-checker": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-region-restriction-checker": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-thumbnail-downloader": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-timestamp-link-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-subscribe-link-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-money-calculator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-views-ratio-calculator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-comment-picker": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-video-title-capitalizer": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
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
