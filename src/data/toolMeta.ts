
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
  "meta-title-checker": {
    howTo: [],
    faqs: [],
  },

  "ai-grammar-checker": {
    howTo: [],
    faqs: [
      { qKey: "grammarChecker.faq.accuracyQ", aKey: "grammarChecker.faq.accuracyA" },
      { qKey: "grammarChecker.faq.languagesQ", aKey: "grammarChecker.faq.languagesA" },
      { qKey: "grammarChecker.faq.correctionsQ", aKey: "grammarChecker.faq.correctionsA" },
      { qKey: "grammarChecker.faq.privacyQ", aKey: "grammarChecker.faq.privacyA" },
    ],
  },

  "ai-text-summarizer": {
    howTo: [
      { titleKey: "howto.summarizer.step1.title", descKey: "howto.summarizer.step1.desc" },
      { titleKey: "howto.summarizer.step2.title", descKey: "howto.summarizer.step2.desc" },
      { titleKey: "howto.summarizer.step3.title", descKey: "howto.summarizer.step3.desc" },
    ],
    faqs: [
      { qKey: "faq.summarizer.q1", aKey: "faq.summarizer.a1" },
      { qKey: "faq.summarizer.q2", aKey: "faq.summarizer.a2" },
      { qKey: "faq.summarizer.q3", aKey: "faq.summarizer.a3" },
      { qKey: "faq.summarizer.q4", aKey: "faq.summarizer.a4" },
      { qKey: "faq.summarizer.q5", aKey: "faq.summarizer.a5" },
      { qKey: "faq.summarizer.q6", aKey: "faq.summarizer.a6" },
    ],
  },



    "text-diff-checker": {
    howTo: [
      { titleKey: "howto.textdiff.step1.title", descKey: "howto.textdiff.step1.desc" },
      { titleKey: "howto.textdiff.step2.title", descKey: "howto.textdiff.step2.desc" },
      { titleKey: "howto.textdiff.step3.title", descKey: "howto.textdiff.step3.desc" },
    ],
    faqs: [
      { qKey: "faq.textdiff.q1", aKey: "faq.textdiff.a1" },
      { qKey: "faq.textdiff.q2", aKey: "faq.textdiff.a2" },
      { qKey: "faq.textdiff.q3", aKey: "faq.textdiff.a3" },
      { qKey: "faq.textdiff.q4", aKey: "faq.textdiff.a4" },
      { qKey: "faq.textdiff.q5", aKey: "faq.textdiff.a5" },
      { qKey: "faq.textdiff.q6", aKey: "faq.textdiff.a6" },
    ],
  },

  "reading-time-calculator": {
    howTo: [
      { titleKey: "howto.readtime.step1.title", descKey: "howto.readtime.step1.desc" },
      { titleKey: "howto.readtime.step2.title", descKey: "howto.readtime.step2.desc" },
      { titleKey: "howto.readtime.step3.title", descKey: "howto.readtime.step3.desc" },
    ],
    faqs: [
      { qKey: "faq.readtime.q1", aKey: "faq.readtime.a1" },
      { qKey: "faq.readtime.q2", aKey: "faq.readtime.a2" },
      { qKey: "faq.readtime.q3", aKey: "faq.readtime.a3" },
      { qKey: "faq.readtime.q4", aKey: "faq.readtime.a4" },
      { qKey: "faq.readtime.q5", aKey: "faq.readtime.a5" },
      { qKey: "faq.readtime.q6", aKey: "faq.readtime.a6" },
    ],
  },

  "case-converter": {
    howTo: [
      { titleKey: "howto.casecv.step1.title", descKey: "howto.casecv.step1.desc" },
      { titleKey: "howto.casecv.step2.title", descKey: "howto.casecv.step2.desc" },
      { titleKey: "howto.casecv.step3.title", descKey: "howto.casecv.step3.desc" },
    ],
    faqs: [
      { qKey: "faq.casecv.q1", aKey: "faq.casecv.a1" },
      { qKey: "faq.casecv.q2", aKey: "faq.casecv.a2" },
      { qKey: "faq.casecv.q3", aKey: "faq.casecv.a3" },
      { qKey: "faq.casecv.q4", aKey: "faq.casecv.a4" },
      { qKey: "faq.casecv.q5", aKey: "faq.casecv.a5" },
      { qKey: "faq.casecv.q6", aKey: "faq.casecv.a6" },
    ],
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
    howTo: [
      { titleKey: "howto.imgcompressor.step1.title", descKey: "howto.imgcompressor.step1.desc" },
      { titleKey: "howto.imgcompressor.step2.title", descKey: "howto.imgcompressor.step2.desc" },
      { titleKey: "howto.imgcompressor.step3.title", descKey: "howto.imgcompressor.step3.desc" },
    ],
    faqs: [
      { qKey: "faq.imgcompressor.q1", aKey: "faq.imgcompressor.a1" },
      { qKey: "faq.imgcompressor.q2", aKey: "faq.imgcompressor.a2" },
      { qKey: "faq.imgcompressor.q3", aKey: "faq.imgcompressor.a3" },
      { qKey: "faq.imgcompressor.q4", aKey: "faq.imgcompressor.a4" },
      { qKey: "faq.imgcompressor.q5", aKey: "faq.imgcompressor.a5" },
      { qKey: "faq.imgcompressor.q6", aKey: "faq.imgcompressor.a6" },
      { qKey: "faq.imgcompressor.q7", aKey: "faq.imgcompressor.a7" },
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

  "word-counter": {
    howTo: [
      { titleKey: "howto.wordcounter.step1.title", descKey: "howto.wordcounter.step1.desc" },
      { titleKey: "howto.wordcounter.step2.title", descKey: "howto.wordcounter.step2.desc" },
      { titleKey: "howto.wordcounter.step3.title", descKey: "howto.wordcounter.step3.desc" },
    ],
    faqs: [
      { qKey: "faq.wordcounter.q1", aKey: "faq.wordcounter.a1" },
      { qKey: "faq.wordcounter.q2", aKey: "faq.wordcounter.a2" },
      { qKey: "faq.wordcounter.q3", aKey: "faq.wordcounter.a3" },
      { qKey: "faq.wordcounter.q4", aKey: "faq.wordcounter.a4" },
      { qKey: "faq.wordcounter.q5", aKey: "faq.wordcounter.a5" },
      { qKey: "faq.wordcounter.q6", aKey: "faq.wordcounter.a6" },
    ],
  },

  "sentence-counter": {
    howTo: [
      { titleKey: "howto.sentencecounter.step1.title", descKey: "howto.sentencecounter.step1.desc" },
      { titleKey: "howto.sentencecounter.step2.title", descKey: "howto.sentencecounter.step2.desc" },
      { titleKey: "howto.sentencecounter.step3.title", descKey: "howto.sentencecounter.step3.desc" },
    ],
    faqs: [
      { qKey: "faq.sentencecounter.q1", aKey: "faq.sentencecounter.a1" },
      { qKey: "faq.sentencecounter.q2", aKey: "faq.sentencecounter.a2" },
      { qKey: "faq.sentencecounter.q3", aKey: "faq.sentencecounter.a3" },
      { qKey: "faq.sentencecounter.q4", aKey: "faq.sentencecounter.a4" },
      { qKey: "faq.sentencecounter.q5", aKey: "faq.sentencecounter.a5" },
      { qKey: "faq.sentencecounter.q6", aKey: "faq.sentencecounter.a6" },
    ],
  },

  "base64": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "json-formatter": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },
  "password-generator": { howTo: GENERIC_HOW_TO, faqs: GENERIC_FAQS },

  "yt-thumbnail-downloader": {
    howTo: CREATOR_HOW_TO,
    faqs: CREATOR_FAQS,
  },

  "youtube-description-extractor": {
    howTo: [
      { titleKey: "howto.ytdesc.step1.title", descKey: "howto.ytdesc.step1.desc" },
      { titleKey: "howto.ytdesc.step2.title", descKey: "howto.ytdesc.step2.desc" },
      { titleKey: "howto.ytdesc.step3.title", descKey: "howto.ytdesc.step3.desc" },
    ],
    faqs: [
      { qKey: "faq.ytdesc.q1", aKey: "faq.ytdesc.a1" },
      { qKey: "faq.ytdesc.q2", aKey: "faq.ytdesc.a2" },
      { qKey: "faq.ytdesc.q3", aKey: "faq.ytdesc.a3" },
      { qKey: "faq.ytdesc.q4", aKey: "faq.ytdesc.a4" },
      { qKey: "faq.ytdesc.q5", aKey: "faq.ytdesc.a5" },
      { qKey: "faq.ytdesc.q6", aKey: "faq.ytdesc.a6" },
    ],
  },

  "youtube-tag-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-hashtag-extractor": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-hashtag-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-title-extractor": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-title-generator": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
  "youtube-title-length-checker": { howTo: CREATOR_HOW_TO, faqs: CREATOR_FAQS },
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
