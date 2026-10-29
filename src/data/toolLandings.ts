/**
 * Long-tail landing pages.
 *
 * Every entry becomes its own URL: /tools/<slug>
 * It renders the parent tool (optionally pre-configured with `initial`) under its own
 * title, H1, description, canonical URL, guide text and FAQ.
 *
 * HOW TO ADD ONE (for any tool you redesign later): copy an entry, change `slug`, `tool`
 * and the texts. Write real, different content for each page: pages that only change
 * a keyword are "doorway pages" and Google ignores or penalises them.
 * The sitemap picks new entries up automatically (scripts/generate-sitemap.mjs).
 */

export interface ToolLandingSection {
  heading: string;
  text: string;
}

export interface ToolLanding {
  /** URL slug: /tools/<slug>. Must not match a slug in catalog.ts. */
  slug: string;
  /** slug of the real tool in catalog.ts */
  tool: string;
  /** <title> (the site adds " — ZidroTool"), keep it under ~50 characters */
  title: string;
  /** meta description, 130–160 characters */
  description: string;
  /** visible H1 */
  h1: string;
  /** short intro under the H1 */
  intro: string;
  /** keywords for the meta tag */
  keywords: string[];
  /** optional settings handed to the tool component (Image Compressor uses it) */
  initial?: Record<string, unknown>;
  sections: ToolLandingSection[];
  faqs: { q: string; a: string }[];
}

export const TOOL_LANDINGS: ToolLanding[] = [
  /* ------------------------------------------------------------ image compressor */

  {
    slug: "compress-image-to-100kb",
    tool: "image-compressor",
    title: "Compress Image to 100KB Online Free",
    description: "Reduce any JPG, PNG or WebP photo to under 100 KB in seconds. Free, no sign-up, and your image never leaves your browser.",
    h1: "Compress an image to 100 KB",
    intro: "Add your photo and it is shrunk until it is smaller than 100 KB. The quality is lowered first and the dimensions only if that is not enough.",
    keywords: ["compress image to 100kb", "reduce image size to 100kb", "image under 100kb", "jpg to 100kb", "resize photo to 100kb"],
    initial: { mode: "target", targetKB: 100, preset: "kb100" },
    sections: [
      { heading: "Why 100 KB?", text: "Many job portals, government websites, exam forms and e-commerce uploads reject files over 100 KB. A phone photo is usually 2 to 6 MB, so it has to be reduced by more than 95% to be accepted." },
      { heading: "How the tool reaches the limit", text: "It re-encodes the image at the highest quality that still fits. If even the lowest sensible quality is too large, it makes the picture a little smaller in width and height and tries again. If the target cannot be met, the row says \"Target not reached\" instead of pretending it worked." },
      { heading: "Tips for photos that stay too big", text: "Pick a smaller longest side (for example 1280 px), switch the output to WebP, or crop the picture first. Screenshots and logos shrink most as PNG because the palette is reduced; photographs shrink most as JPG or WebP." },
    ],
    faqs: [
      { q: "Is 100 KB enough for a readable photo?", a: "Yes for web and form uploads. A 100 KB JPG around 800 to 1200 px wide looks fine on screen, but it is not suitable for printing large." },
      { q: "Will my image be uploaded anywhere?", a: "No. The compression runs inside your browser, so the file never leaves your device." },
      { q: "What if the image is still larger than 100 KB?", a: "The tool tells you the target was not reached. Try a smaller longest side, a different format, or a simpler image." },
    ],
  },
  {
    slug: "what-is-the-length-of-a-title",
    tool: "meta-title-checker",
    title: "What Is the Length of a Title? SEO Title Length Guide",
    description: "What is the right length of a title for Google? Aim for about 50 to 60 characters or 600 pixels. Check your own title length with the free checker below.",
    h1: "What is the length of a title?",
    intro: "For a page title in Google, a good length is about 50 to 60 characters, or roughly 600 pixels wide. Type your title below to check it.",
    keywords: ["what is the length of a title", "title length", "seo title length", "title tag length", "how long should a title be", "meta title length"],
    initial: { kind: "title" },
    sections: [
      { heading: "The short answer", text: "Google shows a title until it runs out of width, around 600 pixels on desktop. In practice that is about 50 to 60 characters, but a title with many wide letters can be cut sooner and one with narrow letters can fit more. This is why the checker measures pixels as well as characters." },
      { heading: "Title length on other platforms", text: "A YouTube video title can be up to 100 characters, but the first part is what viewers see in lists, so put the main words first. Email subject lines are usually kept short, often around 40 to 60 characters, so they are not cut on a phone. Social platforms show different amounts of a shared title, so check the preview in each one." },
      { heading: "What happens when a title is too long", text: "The end of the title is replaced by three dots, and the words you put there may not be seen. Google can also choose to show a different title than the one you wrote, especially when the title is very long or repeats the same words." },
      { heading: "How to write a good title", text: "Put the main topic near the start, make it specific, add your brand name last if there is room, and avoid stuffing the same keyword several times. A title is first of all a promise to the reader about what the page contains." },
    ],
    faqs: [
      { q: "Is the title length a ranking factor?", a: "No. Length itself does not rank a page, but a title that is cut off or unclear can lower the number of clicks." },
      { q: "Is 70 characters too long?", a: "Often yes for Google. It may fit if the letters are narrow, so check the pixel width in the tool." },
      { q: "What is the maximum title length for YouTube?", a: "YouTube allows up to 100 characters. Keep the important words at the beginning because lists show only part of the title." },
      { q: "Does the brand name count?", a: "Yes. Everything in the title counts toward the width, including the brand name and separators." },
    ],
  },
  {
    slug: "keyword-density-checker",
    tool: "keyword-density",
    title: "Keyword Density Checker Tool – Count Keywords and Phrases",
    description: "Free keyword density checker tool. Paste your text to see how often each word and 2 to 3 word phrase appears and check the density of one keyword.",
    h1: "Keyword density checker tool",
    intro: "Paste your article or page text to see the most used words and phrases, and check how often one keyword appears as a percentage of all words.",
    keywords: ["keyword density checker", "keyword density checker tool", "keyword density tool", "keyword density tool checker", "keyword density calculator", "keyword frequency"],
    sections: [
      { heading: "What keyword density means", text: "Keyword density is the number of times a keyword appears divided by the total number of words, shown as a percentage. If a word appears 10 times in 1,000 words, its density is 1%." },
      { heading: "Use it as a writing aid", text: "Search engines do not use a perfect percentage, and there is no number that guarantees a ranking. The tool helps you notice a word you repeat too often, or an important topic you barely mention. Write for the reader first." },
      { heading: "Words and phrases", text: "Switch between single words, two-word and three-word phrases. Common words such as the, and or de can be ignored so the useful terms stand out. Click any row to check it as your keyword." },
      { heading: "Private by design", text: "The text is analysed in your browser and is not uploaded, so you can check drafts and unpublished pages." },
    ],
    faqs: [
      { q: "What is a good keyword density?", a: "There is no official number. Many writers stay below roughly 3% so the text reads naturally, but clarity matters more than a percentage." },
      { q: "Does the tool work in other languages?", a: "Yes. It counts words in many languages, including Arabic, and ignores common words in several of them." },
      { q: "Can I check a phrase?", a: "Yes. Type a phrase in the keyword box or click a phrase in the list." },
      { q: "Is there a limit on text length?", a: "No fixed limit. Very long texts depend on your device speed." },
    ],
  },
  {
    slug: "keyword-counter-tool",
    tool: "keyword-counter",
    title: "Keyword Counter Tool – Count Keywords in Text",
    description: "Count how many times a keyword appears in your text. Free keyword counter that shows the top words, 2 to 3 word phrases and the density of your keyword.",
    h1: "Keyword counter tool",
    intro: "Paste your text, type a keyword and see how many times it is used, where it first appears and what share of the text it makes up.",
    keywords: ["keyword counter tool", "keyword counter", "count keywords in text", "keyword count checker", "word frequency counter"],
    sections: [
      { heading: "Count one keyword", text: "Type a word or a phrase and the tool shows the exact number of times it appears, its density and the position of its first use. It matches whole words, so counting the word art does not count the word start." },
      { heading: "See what you use most", text: "The list shows your most used words and phrases with counts and percentages, which is useful to find repetition in an article or product description." },
      { heading: "Export the list", text: "Copy the table as CSV to paste into a spreadsheet and compare drafts." },
    ],
    faqs: [
      { q: "Does it count different forms of a word?", a: "No. It counts the exact word or phrase you type, so run and running are counted separately." },
      { q: "Is the counting case sensitive?", a: "No. Capital and small letters are treated the same." },
      { q: "Is my text stored?", a: "No. It stays in your browser." },
    ],
  },
 
  {
    slug: "compress-image-to-50kb",
    tool: "image-compressor",
    title: "Compress Image to 50KB Online Free",
    description: "Make a JPG, PNG or WebP image smaller than 50 KB for forms, signatures and ID uploads. Free and private, it runs in your browser.",
    h1: "Compress an image to 50 KB",
    intro: "For signatures, stamps and small ID photos. The tool searches for the best quality below 50 KB and reduces the size only when it has to.",
    keywords: ["compress image to 50kb", "reduce image size to 50kb", "photo under 50kb", "signature under 50kb", "jpg 50kb"],
    initial: { mode: "target", targetKB: 50, preset: "custom" },
    sections: [
      { heading: "When you need 50 KB", text: "Signature and thumbnail fields on application forms are often capped at 20 to 50 KB. A small, simple image reaches this easily; a large detailed photo has to be scaled down as well." },
      { heading: "Get a sharper result", text: "Start from the original file rather than a screenshot of it, and crop away empty borders first. Fewer pixels at a decent quality look better than a huge picture squeezed hard." },
      { heading: "Signatures and scans", text: "Photograph the signature on plain white paper in daylight. High contrast, flat-colour images compress extremely well, often far below 50 KB without visible damage." },
    ],
    faqs: [
      { q: "Can I compress several images to 50 KB at once?", a: "Yes. Add up to 50 images, each one is brought under the limit separately, and you can download all of them as one ZIP." },
      { q: "Which format is best for 50 KB?", a: "JPG or WebP for photos, PNG for flat graphics such as signatures. Keep \"Same as original\" if the site only accepts the format you started with." },
      { q: "Does it remove location data?", a: "Yes. The image is redrawn, so camera details and GPS coordinates are not kept in the result." },
    ],
  },
  {
    slug: "compress-image-to-200kb",
    tool: "image-compressor",
    title: "Compress Image to 200KB Online Free",
    description: "Shrink photos to under 200 KB while keeping them sharp. Works with JPG, PNG and WebP. Free, no upload, no sign-up.",
    h1: "Compress an image to 200 KB",
    intro: "A good balance for website images, email attachments and application portals: small enough to load fast, large enough to stay sharp.",
    keywords: ["compress image to 200kb", "reduce image size to 200kb", "photo under 200kb", "image under 200 kb online"],
    initial: { mode: "target", targetKB: 200, preset: "custom" },
    sections: [
      { heading: "A comfortable limit", text: "At 200 KB most photos keep their detail. Typical results are a 1600 px wide JPG at around 70 to 80% quality." },
      { heading: "For websites", text: "Large images are the most common reason a page loads slowly. Keeping hero and blog images near 200 KB, or less as WebP, improves load time without an obvious drop in quality." },
      { heading: "Check before you download", text: "Use the before-and-after slider and the magnifier to inspect fine details such as text and faces before saving the file." },
    ],
    faqs: [
      { q: "How much smaller will my photo get?", a: "A 3 to 5 MB phone photo normally ends near 150 to 200 KB, about 95% smaller, depending on how detailed the picture is." },
      { q: "Is WebP better than JPG at 200 KB?", a: "Usually yes: WebP typically keeps more detail at the same file size, and every modern browser can display it." },
      { q: "Can I keep the original size in pixels?", a: "Yes. Leave \"Longest side\" on Original size and only the quality is adjusted, unless the target is impossible without shrinking." },
    ],
  },
  {
    slug: "compress-image-to-20kb",
    tool: "image-compressor",
    title: "Compress Image to 20KB Online Free",
    description: "Reduce a photo or signature to under 20 KB for form uploads. JPG, PNG and WebP supported, processed privately in your browser.",
    h1: "Compress an image to 20 KB",
    intro: "20 KB is tiny, so the tool lowers the quality and also reduces the dimensions step by step until the image fits.",
    keywords: ["compress image to 20kb", "reduce image size to 20kb", "image under 20kb", "photo 20kb", "signature 20kb"],
    initial: { mode: "target", targetKB: 20, preset: "custom" },
    sections: [
      { heading: "What to expect", text: "Small images such as a signature or a passport-style thumbnail can reach 20 KB with little visible change. A detailed landscape cannot, so it ends up small in pixels as well." },
      { heading: "Best input", text: "Use a cropped picture with a plain background. The fewer colours and details, the more it compresses." },
      { heading: "If it says target not reached", text: "The image would need to become unreadably small. Crop it tighter, choose a simpler picture, or ask the receiving site whether a higher limit is allowed." },
    ],
    faqs: [
      { q: "Is 20 KB too small for a face photo?", a: "A 20 KB face photo is acceptable at roughly 200 to 300 px wide. It will look soft if enlarged." },
      { q: "Which format reaches 20 KB most easily?", a: "JPG or WebP for photos, PNG for signatures and line art." },
      { q: "Is the compression lossless?", a: "No. To reach this size, detail has to be removed. Use the slider to compare with the original." },
    ],
  },
  {
    slug: "compress-png",
    tool: "image-compressor",
    title: "Compress PNG Images Online Free",
    description: "Make PNG files up to 70% smaller by reducing colours, keeping transparency. Batch compress, preview and download as ZIP. Free and private.",
    h1: "Compress PNG images",
    intro: "PNG files are large because they store every pixel exactly. This tool rebuilds them with a smaller colour palette, which usually looks almost identical and is far lighter.",
    keywords: ["compress png", "reduce png size", "png compressor online", "optimize png", "shrink png file"],
    initial: { format: "png", mode: "quality", colors: 128, dither: true, preset: "custom" },
    sections: [
      { heading: "How PNG compression works here", text: "The picture is analysed and reduced to a palette of up to 256 colours (you choose how many). Transparent areas stay transparent. Optional dithering keeps gradients smooth." },
      { heading: "What gets the biggest saving", text: "Logos, icons, screenshots, charts and flat illustrations often drop by 50 to 70%. Photographs saved as PNG shrink a lot too, but JPG or WebP will still be smaller." },
      { heading: "Quality control", text: "If gradients look banded, increase the PNG colours or keep dithering on. If the file is still large, try WebP, which also supports transparency." },
    ],
    faqs: [
      { q: "Does the PNG keep its transparency?", a: "Yes. Transparent and semi-transparent pixels are kept through the palette." },
      { q: "Is this lossless?", a: "No. Reducing colours is lossy, but with 128 to 256 colours most graphics look the same. Compare with the slider." },
      { q: "Why did my PNG stay the same size?", a: "It may already be optimised. In that case the tool keeps the original and marks it \"Already optimized\" so you never get a bigger file." },
    ],
  },
  {
    slug: "compress-jpeg",
    tool: "image-compressor",
    title: "Compress JPEG / JPG Photos Online Free",
    description: "Reduce JPG and JPEG photo size by up to 90% with adjustable quality, before and after comparison and bulk ZIP download. Free, private.",
    h1: "Compress JPEG and JPG photos",
    intro: "Choose a quality, see the result straight away and compare it with the original before downloading.",
    keywords: ["compress jpeg", "compress jpg", "reduce jpg size", "jpeg compressor online", "photo compressor"],
    initial: { format: "jpeg", mode: "quality", quality: 70, preset: "custom" },
    sections: [
      { heading: "Which quality should I use?", text: "75% is a safe default: the difference from the original is hard to see and the file is often 60 to 80% smaller. Below 50% blocky artefacts start to appear around edges and text." },
      { heading: "Resize for extra savings", text: "A 4000 px phone photo is far larger than any screen needs. Setting the longest side to 1920 px cuts the file much more than quality alone." },
      { heading: "Transparent images", text: "JPG cannot store transparency, so transparent areas are filled with white. Use PNG or WebP if you need to keep it." },
    ],
    faqs: [
      { q: "Will compressing a JPG twice make it worse?", a: "Each lossy save removes some detail, so compress from the original file when you can." },
      { q: "Are EXIF and GPS data removed?", a: "Yes. The picture is redrawn, so camera and location metadata are dropped, and the correct orientation is kept." },
      { q: "Is there a size limit?", a: "Up to 50 images per batch and 40 MB per file." },
    ],
  },
  {
    slug: "compress-image-to-webp",
    tool: "image-compressor",
    title: "Compress & Convert Images to WebP Free",
    description: "Compress JPG and PNG images and save them as WebP, usually 25 to 35% smaller. Batch conversion, ZIP download, runs in your browser.",
    h1: "Compress images and convert them to WebP",
    intro: "WebP files are typically 25 to 35% smaller than JPG or PNG at similar quality and work in every modern browser.",
    keywords: ["compress image to webp", "convert jpg to webp", "png to webp", "webp compressor", "optimize images for website"],
    initial: { format: "webp", mode: "quality", quality: 78, preset: "custom" },
    sections: [
      { heading: "Why WebP for websites", text: "Smaller images mean faster pages, better Core Web Vitals and lower bandwidth costs. WebP also supports transparency, so it can replace both JPG and PNG." },
      { heading: "What to watch for", text: "Some old software and a few email clients cannot open WebP. If a form or an app only accepts JPG or PNG, choose that format instead." },
      { heading: "Best settings", text: "Quality 75 to 80 is a good starting point for photos. For a website, also set the longest side to 1920 px." },
    ],
    faqs: [
      { q: "Does WebP keep transparency?", a: "Yes, WebP supports transparent backgrounds like PNG does." },
      { q: "Why is there no WebP option on my device?", a: "The option appears only if your browser can create WebP files. Current Chrome, Edge, Firefox and Safari can." },
      { q: "Can I convert many files at once?", a: "Yes. Add up to 50 files and download them together as a ZIP." },
    ],
  },
  {
    slug: "bulk-image-compressor",
    tool: "image-compressor",
    title: "Bulk Image Compressor – Compress Many Images",
    description: "Compress up to 50 JPG, PNG and WebP images at once and download them in one ZIP. No upload, no sign-up, no daily limit.",
    h1: "Bulk image compressor",
    intro: "Drop a whole folder of pictures, apply one setting to all of them and download the results as a single ZIP file.",
    keywords: ["bulk image compressor", "batch image compressor", "compress multiple images", "compress many photos at once", "compress images zip"],
    sections: [
      { heading: "Everything at once", text: "Select several files, drag them in, or paste them from the clipboard. Each image gets its own before and after sizes and a total saving is shown for the whole batch." },
      { heading: "No upload and no limit per day", text: "The work is done by your own device, so there is no server queue and no daily quota. Speed depends on your computer and the size of the images." },
      { heading: "Consistent output", text: "Presets (Balanced, Smallest, Website, Under 100 KB) apply the same rule to every file, which is ideal for product photos and galleries." },
    ],
    faqs: [
      { q: "How many images can I compress at once?", a: "Up to 50 images, each up to 40 MB." },
      { q: "How do I download everything?", a: "Use Download all (ZIP). Names are kept and \"-compressed\" is added." },
      { q: "Can I use different settings per image?", a: "Settings apply to the whole batch. Remove an image, change the setting and add it again to treat it differently." },
    ],
  },

  /* ------------------------------------------------------------ text summarizer */
  {
    slug: "summarize-text-online",
    tool: "ai-text-summarizer",
    title: "Summarize Text Online – Free Text Summarizer",
    description: "Paste any text and get its key sentences as bullet points or a short paragraph. Free, private, no sign-up. Extractive summary, not AI-generated.",
    h1: "Summarize text online",
    intro: "Paste an article, report or email, choose how short the summary should be and read the most important sentences first.",
    keywords: ["summarize text online", "text summarizer free", "summarize paragraph", "shorten text", "tldr generator"],
    sections: [
      { heading: "How the summary is made", text: "The tool counts the important words in your text, scores every sentence and keeps the best ones in their original order. It selects sentences that already exist; it does not write new ones." },
      { heading: "Choosing the length", text: "10 to 20% gives a quick overview. 40 to 60% keeps more detail. The result updates after your first summary when you move the slider." },
      { heading: "Check it against the text", text: "The In context view highlights the selected sentences inside your original, so you can see what was left out." },
    ],
    faqs: [
      { q: "Is this an AI summarizer?", a: "No. It is a word-frequency method that runs in your browser. It cannot paraphrase or understand meaning, so read the result before relying on it." },
      { q: "Is my text stored?", a: "No. Everything happens in your browser and nothing is uploaded." },
      { q: "How long can the text be?", a: "Up to 60,000 characters, about 10,000 words." },
    ],
  },
  {
    slug: "article-summarizer",
    tool: "ai-text-summarizer",
    title: "Article Summarizer – Summarize News & Blogs",
    description: "Summarize long articles and news stories into the key sentences. Choose bullet points or a paragraph. Free and private, runs in your browser.",
    h1: "Article summarizer",
    intro: "Paste the text of a news story, blog post or research article and get the main points without reading every paragraph.",
    keywords: ["article summarizer", "summarize article", "news summarizer", "blog post summarizer", "summarize long article"],
    sections: [
      { heading: "Best results with articles", text: "News and blog writing usually puts key facts in topic sentences and the opening paragraphs, which suits an extractive method." },
      { heading: "Paste clean text", text: "Remove menus, ads and comments before pasting. They would otherwise count as part of the article." },
      { heading: "Key phrases", text: "Besides the summary you get the most important words and phrases, useful for tags or a quick sense of the topic." },
    ],
    faqs: [
      { q: "Can I paste a link instead?", a: "No. Paste the article text; the tool does not fetch web pages." },
      { q: "Does it work in other languages?", a: "It works best in English, French, Spanish, German, Italian and Arabic." },
      { q: "Can it miss important points?", a: "Yes. It chooses sentences by word frequency, so unusual but important points can be missed." },
    ],
  },
  {
    slug: "essay-summarizer",
    tool: "ai-text-summarizer",
    title: "Essay Summarizer – Shorten Essays Free",
    description: "Shorten an essay or study notes into its main sentences. Adjustable length, bullets or paragraph. Free, private, no sign-up.",
    h1: "Essay summarizer",
    intro: "Condense your own essay, chapter or lecture notes to the sentences that carry the argument, then use them to revise.",
    keywords: ["essay summarizer", "summarize essay", "study notes summarizer", "chapter summarizer", "summary generator"],
    sections: [
      { heading: "Use it for revision", text: "A short list of the strongest sentences from a chapter is a quick revision aid. Read it, then go back to the text to fill in the gaps." },
      { heading: "A note on academic work", text: "The summary consists of sentences copied from the source. Quote and cite them properly and do not present them as your own words." },
      { heading: "Get a useful result", text: "Texts with several paragraphs work best. Very short texts are not summarised." },
    ],
    faqs: [
      { q: "Will it rewrite sentences?", a: "No. Use the Content Rewriter if you want different wording." },
      { q: "Is it safe for confidential text?", a: "The text stays in your browser and is not sent anywhere." },
      { q: "What length should I choose?", a: "Start at 25%, then raise it if important points are missing." },
    ],
  },

  /* ------------------------------------------------------------ content rewriter */
  {
    slug: "sentence-rewriter",
    tool: "ai-content-rewriter",
    title: "Sentence Rewriter – Reword Text Free",
    description: "Reword sentences with synonyms and phrase swaps. Free, private, instant. A rule-based rewriter, not generative AI.",
    h1: "Sentence rewriter",
    intro: "Paste a sentence or a paragraph and get a reworded version using synonym and phrase replacements.",
    keywords: ["sentence rewriter", "reword sentence", "rewrite sentence online", "rephrase text", "synonym text changer"],
    sections: [
      { heading: "What it changes", text: "Common words and phrases are replaced with alternatives, contractions can be expanded or shortened, and US or UK spelling can be switched." },
      { heading: "What it does not do", text: "It does not understand your text, so it cannot restructure ideas the way a person or a large language model can. Always read the result and fix anything that sounds wrong." },
      { heading: "Try again for variety", text: "Each run can pick different alternatives. Press the button again to get another version." },
    ],
    faqs: [
      { q: "Is this AI?", a: "No. It uses a built-in dictionary of synonyms and phrases that runs in your browser." },
      { q: "Can I use the result for school work?", a: "Treat it as a drafting aid and write your own final version. Rewriting someone else's text does not remove the need to cite it." },
      { q: "Is my text uploaded?", a: "No." },
    ],
  },
  {
    slug: "paragraph-rewriter",
    tool: "ai-content-rewriter",
    title: "Paragraph Rewriter – Reword Paragraphs Free",
    description: "Reword whole paragraphs with alternative words and phrases. Free and private. Rule-based, so review the result before you use it.",
    h1: "Paragraph rewriter",
    intro: "Give a paragraph a fresh wording quickly, then edit it to match your voice.",
    keywords: ["paragraph rewriter", "reword paragraph", "rewrite paragraph free", "text rewriter online"],
    sections: [
      { heading: "Good for drafts", text: "It is useful for avoiding repeated words in your own writing and for producing a second version to work from." },
      { heading: "Limits", text: "Sentence structure mostly stays the same. If you need deeper rewriting, edit the output by hand." },
      { heading: "Privacy", text: "Your text is processed on your device only." },
    ],
    faqs: [
      { q: "How is it different from an AI paraphraser?", a: "It swaps words and phrases using rules instead of generating new sentences, so it is predictable but less creative." },
      { q: "Is there a length limit?", a: "Long pasted texts are accepted up to the limit shown in the tool." },
      { q: "Does it check grammar?", a: "No. Use the Grammar Checker for that." },
    ],
  },

  /* ------------------------------------------------------------ ovulation calculator */
  {
    slug: "fertile-window-calculator",
    tool: "ovulation-calculator",
    title: "Fertile Window Calculator – Find Your Fertile Days",
    description: "Estimate your fertile window and likely ovulation day from your last period and cycle length. Calendar view, free and private.",
    h1: "Fertile window calculator",
    intro: "Enter the first day of your last period and your usual cycle length to see an estimated fertile window on a calendar.",
    keywords: ["fertile window calculator", "fertile days calculator", "when am i fertile", "ovulation window", "conception calendar"],
    sections: [
      { heading: "How the estimate works", text: "It uses the calendar method: ovulation is estimated about 14 days before the next period and the fertile window is the days around it, because sperm can survive for several days." },
      { heading: "Regular and irregular cycles", text: "The method is more reliable when cycles are regular. If your cycle varies by many days, treat the dates as a rough guide and consider ovulation tests or talk to a clinician." },
      { heading: "Using the calendar", text: "Highlighted days show the estimated fertile window, the likely ovulation day and the next expected period." },
    ],
    faqs: [
      { q: "Is this accurate?", a: "It is an estimate based on averages and not a medical test. Real ovulation can shift from cycle to cycle." },
      { q: "Can I use it as contraception?", a: "No. It must not be used to avoid pregnancy." },
      { q: "Is my data saved?", a: "No. Dates are calculated in your browser and are not sent or stored." },
    ],
  },
  {
    slug: "ovulation-date-calculator",
    tool: "ovulation-calculator",
    title: "Ovulation Date Calculator by Cycle Length",
    description: "Calculate your estimated ovulation date from your last period and cycle length. Free, private and easy to read.",
    h1: "Ovulation date calculator",
    intro: "See when you are likely to ovulate this cycle and the next ones.",
    keywords: ["ovulation date calculator", "when do i ovulate", "ovulation calculator cycle length", "ovulation day", "ovulation predictor calendar"],
    sections: [
      { heading: "Cycle length matters", text: "With a 28-day cycle, ovulation is usually around day 14. With a 32-day cycle it is closer to day 18, so entering your real cycle length gives a better estimate." },
      { heading: "Next cycles", text: "The next six cycles are listed, so you can plan ahead." },
      { heading: "Confirming ovulation", text: "Tracking basal body temperature, cervical mucus or ovulation test strips gives more direct signs than any calculator." },
    ],
    faqs: [
      { q: "What if I do not know my cycle length?", a: "Count from the first day of one period to the day before the next, over a few months, and use the average." },
      { q: "Does stress change ovulation?", a: "It can shift ovulation in some people, which is another reason to treat the result as an estimate." },
      { q: "Should I see a doctor?", a: "If you have been trying to conceive for a year (six months if over 35), or your cycles are very irregular, speak to a healthcare professional." },
    ],
  },

  /* ------------------------------------------------------------ age calculator */
  {
    slug: "age-in-days-calculator",
    tool: "age-calculator",
    title: "Age in Days Calculator – How Many Days Old?",
    description: "Find out exactly how many days, weeks, months and years old you are, plus hours and minutes. Free, live and private.",
    h1: "Age in days calculator",
    intro: "Enter a date of birth and see your exact age in years, months, days, and your life in days, weeks, hours and minutes.",
    keywords: ["age in days calculator", "how many days old am i", "age calculator days", "days since birth", "exact age calculator"],
    sections: [
      { heading: "Your life in numbers", text: "Besides years, months and days you get totals such as days lived, weeks, hours and even moon cycles and trips around the Sun." },
      { heading: "Live counter", text: "The seconds count up while you watch, based on your date and optional time of birth." },
      { heading: "Age on another date", text: "Choose a specific date to find your age on that day, for example for a form or an anniversary." },
    ],
    faqs: [
      { q: "Does it handle leap years?", a: "Yes, dates are calculated using the real calendar." },
      { q: "Is my birth date stored?", a: "No. The calculation is done in your browser." },
      { q: "Can I find the days until my next birthday?", a: "Yes, the next birthday and the days remaining are shown." },
    ],
  },
  {
    slug: "how-old-am-i",
    tool: "age-calculator",
    title: "How Old Am I? Exact Age Calculator",
    description: "Type your birthday and see how old you are in years, months and days, with a live seconds counter. Free and private.",
    h1: "How old am I?",
    intro: "Pick your date of birth and get your exact age at once.",
    keywords: ["how old am i", "age calculator", "calculate my age", "age from date of birth", "birthday calculator"],
    sections: [
      { heading: "Exact, not rounded", text: "Your age is shown as full years plus months and days, rather than just a rounded number of years." },
      { heading: "Time of birth", text: "Add a time of birth to make the hours, minutes and seconds precise." },
      { heading: "Share or copy", text: "Copy the results with one click to paste into a message or document." },
    ],
    faqs: [
      { q: "Which time zone is used?", a: "Your device's local time zone." },
      { q: "Can I calculate someone else's age?", a: "Yes, enter any date of birth." },
      { q: "Is it free?", a: "Yes, with no sign-up." },
    ],
  },

  /* ------------------------------------------------------------ text to handwriting */
  {
    slug: "text-to-handwriting-converter",
    tool: "text-to-handwriting",
    title: "Text to Handwriting Converter – Free Online",
    description: "Turn typed text into realistic handwritten pages. Choose fonts, ink, paper and a scanned look, then download. Free, no sign-up.",
    h1: "Text to handwriting converter",
    intro: "Type or paste your text and see it written by hand on lined, plain or squared paper.",
    keywords: ["text to handwriting converter", "text to handwriting", "convert text to handwriting online", "handwriting generator", "handwritten text maker"],
    sections: [
      { heading: "Looks like real writing", text: "Natural-look controls vary baseline, size and spacing slightly so the page does not look printed. You can set ink colour and strength, line spacing and margins." },
      { heading: "Your own handwriting", text: "Upload a font file made from your own handwriting to use it instead of the built-in fonts." },
      { heading: "Multiple pages", text: "Long text flows over several pages that you can browse, zoom into and download." },
    ],
    faqs: [
      { q: "Is the output a real photo of paper?", a: "No. It is generated in your browser. The Scanned paper look adds a realistic texture." },
      { q: "Does it work on mobile?", a: "Yes." },
      { q: "Is my text uploaded?", a: "No, it stays on your device." },
    ],
  },
  {
    slug: "handwriting-generator-for-assignments",
    tool: "text-to-handwriting",
    title: "Handwriting Generator for Notes & Letters",
    description: "Generate neat handwritten notes, letters and practice sheets from typed text. Many fonts, paper styles and ink colours. Free online.",
    h1: "Handwriting generator for notes and letters",
    intro: "Create handwritten-style pages for notes, letters, greeting cards and practice sheets in a few clicks.",
    keywords: ["handwriting generator", "handwritten notes generator", "handwritten letter maker", "text to handwritten notes"],
    sections: [
      { heading: "Good uses", text: "Personal letters, greeting cards, thank-you notes, scrapbook pages and worksheets are natural uses." },
      { heading: "Schoolwork", text: "Check your school's rules first: many require work to be handwritten by you, and presenting generated pages as your own handwriting may break them." },
      { heading: "Customise", text: "Pick the paper, font size, margins and the position of the text on the page." },
    ],
    faqs: [
      { q: "Can I change the ink colour?", a: "Yes, from the presets or with a custom colour." },
      { q: "Can I download the pages?", a: "Yes, the tool lets you download the result." },
      { q: "Are the fonts free to use?", a: "The built-in handwriting fonts come from Google Fonts, which are open-licensed." },
    ],
  },
  /* ------------------------------------------------------------ youtube description extractor */
  {
    slug: "extract-youtube-description",
    tool: "youtube-description-extractor",
    title: "Extract YouTube Video Description – Free",
    description: "Paste a YouTube link and copy the full video description in one click, with its links, hashtags and timestamps. Free, up to 10 videos at once.",
    h1: "Extract a YouTube video description",
    intro: "Paste the link of any public video and the full description appears as text you can copy or download.",
    keywords: ["extract youtube description", "youtube description extractor", "copy youtube video description", "get youtube description", "youtube description scraper"],
    sections: [
      { heading: "Why not copy it from YouTube?", text: "On YouTube the description is folded behind a \"more\" button, on mobile it is hard to select and links are shortened. Here you get the plain text, character and word counts and the links separated out." },
      { heading: "Several videos at once", text: "Paste up to 10 links, one per line. Each video gets its own card, and you can download every description in a single text file." },
      { heading: "What you cannot get", text: "Private, removed and age-restricted videos have no readable description. Comments and transcripts are not included." },
    ],
    faqs: [
      { q: "Do I need to sign in?", a: "No account is needed and nothing has to be installed." },
      { q: "Does it work on a phone?", a: "Yes. Paste the link from the YouTube app's Share menu." },
      { q: "Is the description stored?", a: "No. It is fetched for you and shown in your browser; it is not saved on ZidroTool." },
    ],
  },
  {
    slug: "youtube-description-link-extractor",
    tool: "youtube-description-extractor",
    title: "Extract Links from a YouTube Description",
    description: "Pull every link out of a YouTube video description: websites, affiliate and social links, ready to copy as a list. Free and fast.",
    h1: "Extract links from a YouTube description",
    intro: "Creators put resources, tools and affiliate links in the description. This page lists them all in one place.",
    keywords: ["extract links from youtube description", "youtube description links", "get links from youtube video", "youtube description link extractor"],
    sections: [
      { heading: "Every link, one list", text: "After the description is fetched, all web addresses are collected into a separate box, duplicates removed, with a button to copy them together." },
      { heading: "Check before you click", text: "Links open in a new tab. Affiliate and shortened links can lead anywhere, so look at the address before you visit or buy." },
      { heading: "Useful for research", text: "See which tools, sponsors and resources successful channels in your niche recommend." },
    ],
    faqs: [
      { q: "Are shortened links expanded?", a: "No. You get the link exactly as the creator typed it." },
      { q: "Are links hidden in the video itself included?", a: "No, only links written in the description text." },
      { q: "Can I copy them all?", a: "Yes, with the copy button on the Links box." },
    ],
  },
  {
    slug: "youtube-timestamps-extractor",
    tool: "youtube-description-extractor",
    title: "YouTube Timestamps & Chapters Extractor",
    description: "Get the chapters and timestamps from a YouTube video description as a clean list you can copy. Works with up to 10 videos.",
    h1: "YouTube timestamps and chapters extractor",
    intro: "Lines that start with a time such as 00:00 or 12:45 are detected in the description and listed together.",
    keywords: ["youtube timestamps extractor", "youtube chapters extractor", "get timestamps from youtube video", "youtube video chapters list"],
    sections: [
      { heading: "What counts as a timestamp", text: "A line that begins with minutes and seconds (or hours, minutes and seconds) followed by a title, for example 05:45 Mixing the dough." },
      { heading: "Use the list", text: "Copy it to build a table of contents, show-notes or a study outline for a long video." },
      { heading: "Videos without chapters", text: "If the creator did not write timestamps in the description, the box says none were found." },
    ],
    faqs: [
      { q: "Does it read auto-generated chapters?", a: "Only timestamps written in the description text are detected." },
      { q: "Can I get timestamps for several videos?", a: "Yes, paste up to 10 links and each video shows its own list." },
      { q: "Does it work for comments?", a: "No, only the description." },
    ],
  },
  {
    slug: "youtube-description-hashtag-finder",
    tool: "youtube-description-extractor",
    title: "Find Hashtags in a YouTube Description",
    description: "See which hashtags a YouTube video uses in its description and copy them as a list. A quick way to research hashtags in your niche.",
    h1: "Find the hashtags in a YouTube description",
    intro: "Paste a competitor's video link and see the hashtags written in its description.",
    keywords: ["youtube hashtags from description", "find youtube video hashtags", "youtube description hashtags", "copy youtube hashtags"],
    sections: [
      { heading: "Learn from your niche", text: "Looking at the hashtags used by videos that already perform well gives you ideas for your own." },
      { heading: "How many to use", text: "YouTube shows the first three hashtags above the title and ignores all hashtags if a video has more than 15." },
      { heading: "Only description hashtags", text: "Hashtags added to the title or hidden tags are not part of this list. Use the tag extractor for the video's tags." },
    ],
    faqs: [
      { q: "Is this the same as video tags?", a: "No. Hashtags are written in the description or title; tags are hidden metadata." },
      { q: "Can I copy them all?", a: "Yes, with the copy button on the Hashtags box." },
      { q: "Does it show hashtag popularity?", a: "No, only which hashtags the video uses." },
    ],
  },
  {
    slug: "how-long-does-it-take-to-read-1000-words",
    tool: "reading-time-calculator",
    title: "How Long Does It Take to Read 1,000 Words?",
    description: "1,000 words take about 4 minutes 12 seconds to read silently and about 5 minutes 28 seconds aloud. Paste your own text to get its exact reading time.",
    h1: "How long does it take to read 1,000 words?",
    intro: "At the average adult speed of 238 words per minute, 1,000 words take about 4 minutes 12 seconds. Paste your text below for its exact time.",
    keywords: ["how long does it take to read 1000 words", "1000 words reading time", "how many minutes is 1000 words", "reading time for 1000 words"],
    sections: [
      { heading: "The quick answer", text: "Silent reading of non-fiction averages 238 words per minute, so 1,000 words is about 4 minutes 12 seconds. Reading aloud averages 183 words per minute, which makes it about 5 minutes 28 seconds." },
      { heading: "Why your time may differ", text: "Difficult or technical writing, a small screen and an unfamiliar topic slow you down. Light, familiar reading is faster. Use the speed slider to match your own pace." },
      { heading: "Other lengths", text: "The table under the calculator shows reading time for 250, 500, 2,000, 5,000 and 10,000 words, so you can compare common article and essay lengths." },
    ],
    faqs: [
      { q: "How many pages is 1,000 words?", a: "About two pages single-spaced or four pages double-spaced in a standard 12 pt font." },
      { q: "How long is 1,000 words as a speech?", a: "At a speaking pace of 150 words per minute it is about 6 minutes 40 seconds, plus any pauses." },
      { q: "Is the time exact?", a: "No. It is an estimate based on average speeds, and the calculator lets you change the speed." },
    ],
  },
  {
    slug: "speech-time-calculator",
    tool: "reading-time-calculator",
    title: "Speech Time Calculator – Words to Minutes",
    description: "Find out how many minutes your speech will last. Paste the text and see the speaking time at a natural pace of about 150 words per minute.",
    h1: "Speech time calculator: how long will your speech last?",
    intro: "Paste your speech and see how many minutes it takes to deliver at a typical speaking pace of 150 words per minute.",
    keywords: ["speech time calculator", "how many words is a 5 minute speech", "speech length calculator", "words per minute speech", "presentation time calculator"],
    sections: [
      { heading: "Speaking is slower than reading", text: "People read silently at around 238 words per minute but speak at roughly 130 to 160. A 5-minute speech is therefore about 750 words, and a 10-minute one about 1,500." },
      { heading: "Leave room for pauses", text: "Pauses, emphasis, slides and audience reactions add time. Aim a little below your limit and rehearse once with a stopwatch to find your own pace." },
      { heading: "Adjust to your style", text: "Fast speakers can move the slider towards 170 words per minute, careful or nervous speakers towards 120. The result updates immediately." },
    ],
    faqs: [
      { q: "How many words is a 5-minute speech?", a: "About 750 words at 150 words per minute." },
      { q: "How many words is a 10-minute speech?", a: "About 1,500 words at 150 words per minute." },
      { q: "Does it count pauses?", a: "No. Add a minute or so for pauses, slides and questions." },
    ],
  },
  {
    slug: "blog-post-reading-time-calculator",
    tool: "reading-time-calculator",
    title: "Blog Post Reading Time Calculator",
    description: "Work out the reading time of your blog post and copy a ready-made badge like \"4 min read\". Includes extra time for images. Free and private.",
    h1: "Blog post reading time calculator",
    intro: "Paste your article, add the number of images and copy a \"min read\" badge for the top of your post.",
    keywords: ["blog post reading time calculator", "article read time", "min read calculator", "estimated reading time for blog", "reading time badge"],
    sections: [
      { heading: "Show a reading time", text: "A short \"4 min read\" label near the title sets expectations and helps visitors decide whether to start. Copy it with one click." },
      { heading: "Count the images", text: "Screenshots and diagrams take time to look at. Enter how many your post has and the calculator adds 12 seconds for the first, 11 for the second and so on, down to 3 seconds each." },
      { heading: "Check readability too", text: "For English text the tool also shows an estimated US grade level, which helps you keep a blog post easy to follow." },
    ],
    faqs: [
      { q: "What speed do most blogs use?", a: "Many use about 200 to 240 words per minute. This tool defaults to 238." },
      { q: "Does it work for other languages?", a: "Yes for the reading time; the readability score is for English only." },
      { q: "Is my draft saved?", a: "No. It stays in your browser and is not uploaded." },
    ],
  },
  {
    slug: "character-counter",
    tool: "word-counter",
    title: "Character Counter – Count Characters Online",
    description: "Count characters with and without spaces as you type. Free online character counter with word, sentence and paragraph counts. Nothing is uploaded.",
    h1: "Character counter: count characters with and without spaces",
    intro: "Type or paste your text to see the character count update live, with and without spaces.",
    keywords: ["character counter", "character count online", "count characters with spaces", "characters without spaces", "letter counter"],
    initial: { primary: "chars" },
    sections: [
      { heading: "With or without spaces", text: "The first card shows every character including spaces, and the No spaces card leaves them out. Forms and platforms differ, so check which one yours uses." },
      { heading: "Emoji and special characters", text: "Characters are counted as Unicode code points, so an emoji counts as one character here. Some platforms count it as two, so leave a little margin near a limit." },
      { heading: "Set a limit", text: "Choose a preset such as a post on X, an SMS or a meta description, or enter your own limit, and the bar shows how many characters are left or how many you are over." },
    ],
    faqs: [
      { q: "Does a space count as a character?", a: "Yes. The Characters count includes spaces, tabs and line breaks. Use No spaces if you need the count without them." },
      { q: "Is a line break one character?", a: "Yes, it is counted as one character in this tool, although some systems count it as two." },
      { q: "Is there a maximum text size?", a: "You can paste up to one million characters." },
    ],
  },
  {
    slug: "essay-word-counter",
    tool: "word-counter",
    title: "Essay Word Counter – Check Your Word Limit",
    description: "Check the word count of your essay against a target such as 500 words. See sentences, paragraphs, reading time and the words you repeat most.",
    h1: "Essay word counter: stay on target",
    intro: "Paste your essay and see the word count, how far you are from your target, and which words you repeat too often.",
    keywords: ["essay word counter", "essay word count", "word count checker for essays", "how many words is my essay", "assignment word counter"],
    initial: { limit: "essay" },
    sections: [
      { heading: "Set your target", text: "The bar starts at 500 words. Switch to Custom to enter the limit from your assignment, in words or characters, and see how many you have left." },
      { heading: "What teachers usually count", text: "Rules differ. Some courses include the title, headings and quotations, others do not, and most leave out the bibliography. Check your brief and paste only the part that counts." },
      { heading: "Edit with the repeated-words list", text: "If one word shows up again and again, replace some with a synonym or cut the sentence. Switch to two or three words to find repeated phrases." },
    ],
    faqs: [
      { q: "Are footnotes and references included?", a: "Only if you paste them. Remove the parts your assignment does not count before checking." },
      { q: "How many pages is 500 words?", a: "About one page single-spaced or two pages double-spaced in a 12 pt font." },
      { q: "Does the counter match Microsoft Word?", a: "It is usually the same or within a word or two. Hyphenated words count once, as in Word." },
    ],
  },
 
    {
    slug: "meta-description-length-checker",
    tool: "meta-description-checker",
    title: "Meta Description Length Checker (Characters and Pixels)",
    description: "Check your meta description length in characters and pixels. See how Google may show it on desktop and mobile and spot text that gets cut off. Free.",
    h1: "Meta description length checker",
    intro: "Paste your meta description to see its length in characters and pixels, and a preview of how it may look in Google results on desktop and mobile.",
    keywords: ["meta description length", "meta description length checker", "meta description character limit", "seo description length", "meta description checker"],
    initial: { kind: "description" },
    sections: [
      { heading: "How long should a meta description be?", text: "A safe target is about 120 to 155 characters. Google cuts snippets by pixel width, not by a fixed number of characters, so wide letters such as W and M use more space than narrow ones such as i and l. That is why the tool shows characters and pixels together." },
      { heading: "Desktop and mobile are different", text: "Results on a phone are narrower than on a computer, so a description that fits on desktop can be shortened on mobile. Check both previews and put the most useful words at the start." },
      { heading: "Google may rewrite it", text: "Google often shows its own text taken from the page when it thinks that matches the search better. A clear description that answers the search still helps people decide to click, but the length is not a ranking factor." },
      { heading: "What to write", text: "Say what the page offers in plain words, include the main topic once, and finish with a short reason to click. Avoid repeating the same word and avoid writing in capital letters." },
    ],
    faqs: [
      { q: "Is 160 characters the limit?", a: "It is the usual guideline, but the real cut-off depends on pixel width. Aiming for roughly 150 to 155 characters is safer." },
      { q: "Does a longer meta description help ranking?", a: "No. The length is not a ranking factor. Write what is useful for the person reading the result." },
      { q: "Can I check many descriptions at once?", a: "Yes. Switch to the many-lines mode, paste one description per line and copy the table as CSV." },
      { q: "Is my text uploaded?", a: "No. Everything is calculated in your browser." },
    ],
  },
  {
    slug: "word-frequency-counter",
    tool: "word-counter",
    title: "Word Frequency Counter – Most Used Words",
    description: "Find the words and phrases you use most. Paste your text to see repeated words, two-word and three-word phrases, counts and percentages. Free and private.",
    h1: "Word frequency counter: find your most used words",
    intro: "Paste your text and the list shows which words and phrases appear most often, with counts and percentages.",
    keywords: ["word frequency counter", "most used words in text", "word frequency analyzer", "repeated words checker", "phrase frequency counter"],
    sections: [
      { heading: "Words and phrases", text: "Switch between single words, two-word phrases and three-word phrases. Only items that appear at least twice are listed." },
      { heading: "Ignore common words", text: "With the option on, small words such as the, and or of (in English and a few other languages) are left out so the useful words stand out. Turn it off to count everything." },
      { heading: "Use it as a writing aid", text: "Repeated words can make writing feel flat. The percentages are shown for your own editing, and no ideal density is promised for search engines." },
    ],
    faqs: [
      { q: "How is the percentage calculated?", a: "The number of times a word or phrase appears divided by the total number of words (or phrases) in your text." },
      { q: "Is the list case sensitive?", a: "No. Word and word are counted together." },
      { q: "Does it work for other languages?", a: "Yes for languages that use spaces. The common-word filter covers English, French, Spanish, German and Italian." },
    ],
  },
  {
    slug: "sms-character-counter",
    tool: "word-counter",
    title: "SMS Character Counter – 160 Character Check",
    description: "Check if your text message fits in 160 characters. Free SMS character counter that shows how many characters are left or over. Nothing is uploaded.",
    h1: "SMS character counter",
    intro: "Type your text message and see how many of the 160 characters in one SMS you have used.",
    keywords: ["sms character counter", "text message character count", "160 character counter", "sms length checker", "how many characters in a text message"],
    initial: { limit: "sms" },
    sections: [
      { heading: "The 160 character guideline", text: "A single SMS using the standard GSM alphabet holds 160 characters. Longer messages are usually split into several parts that are billed separately." },
      { heading: "Special characters", text: "Emoji and many accented or non-Latin letters switch a message to a different encoding that fits only 70 characters per part. This counter shows a simple character count, so keep emoji-heavy or Arabic messages shorter." },
      { heading: "Check before sending", text: "Phones and carriers differ, so the bar is a guide. Aim for fewer than 160 characters if cost or delivery matters." },
    ],
    faqs: [
      { q: "What happens if I go over 160?", a: "Most carriers send the message as several linked parts and may bill each part. Some apps send one long message instead." },
      { q: "Do spaces count?", a: "Yes, spaces and line breaks count as characters." },
      { q: "Why is my emoji message shorter?", a: "Emoji need a different encoding, which reduces the limit per message to about 70 characters." },
    ],
  },
  {
    slug: "long-sentence-checker",
    tool: "sentence-counter",
    title: "Long Sentence Checker – Find Long Sentences",
    description: "Paste your text to find sentences that are too long. Choose the word limit, see long sentences highlighted and read only those. Free and private.",
    h1: "Long sentence checker: find sentences that run too long",
    intro: "Paste your text and the sentences of 20 words or more are highlighted, so you can shorten or split them.",
    keywords: ["long sentence checker", "find long sentences", "sentence length checker", "check sentence length", "too long sentences"],
    initial: { threshold: 20, focus: "long" },
    sections: [
      { heading: "You choose what is long", text: "The slider starts at 20 words and goes up to 60. Move it to match your style guide, an exam rule or your own taste, and the highlighted sentences update at once." },
      { heading: "See only the long ones", text: "The list is filtered to long sentences, each with its number and word count. Switch to All to see them in context." },
      { heading: "How to shorten a sentence", text: "Look for an and, but or which that could start a new sentence, and cut words that repeat an idea. This tool only measures length: it does not judge whether a long sentence is correct or good." },
    ],
    faqs: [
      { q: "How many words is a long sentence?", a: "There is no official number. Many style guides treat sentences above about 25 words as long, and some suggest 20. That is why the limit is adjustable." },
      { q: "Are long sentences always wrong?", a: "No. A long sentence can be fine if it is clear. A text made only of long sentences is harder to read." },
      { q: "Does it check grammar?", a: "No. It only counts sentences and measures their length." },
    ],
  },
  {
    slug: "sentence-length-checker",
    tool: "sentence-counter",
    title: "Sentence Length Checker – Average Sentence Length",
    description: "Find the average, longest and shortest sentence length of your text in words, and see the rhythm of every sentence as a bar chart. Free and private.",
    h1: "Sentence length checker: average, longest and shortest",
    intro: "Paste your text to see how long your sentences are, in words, and how their lengths vary.",
    keywords: ["sentence length checker", "average sentence length", "average words per sentence", "sentence length calculator", "sentence length analyzer"],
    sections: [
      { heading: "Average words per sentence", text: "The average is the number of words divided by the number of sentences. Many style guides suggest around 15 to 20 words for easy reading." },
      { heading: "Rhythm, not just the average", text: "Two texts can share the same average and still read differently. The bars show every sentence, so you can see whether your text mixes short and long sentences or stays flat." },
      { heading: "Questions and exclamations", text: "The tool also counts how many sentences are questions or exclamations, which helps when you review a speech or an advert." },
    ],
    faqs: [
      { q: "What is a good average sentence length?", a: "It depends on the audience. For general readers, around 15 to 20 words is a common guideline." },
      { q: "Do headings count as sentences?", a: "Each line counts as a sentence by default. Turn off the option under the text box if you want only punctuation to decide." },
      { q: "Does it work for any language?", a: "It works for languages that use common sentence punctuation, including Arabic and Chinese." },
    ],
  },
  {
    slug: "sentence-splitter",
    tool: "sentence-counter",
    title: "Sentence Splitter – Split Text into Sentences",
    description: "Split a paragraph into sentences online. Copy every sentence on its own line for a spreadsheet or translation tool. Free and private.",
    h1: "Sentence splitter: one sentence per line",
    intro: "Paste a paragraph and copy the result with each sentence on its own line.",
    keywords: ["sentence splitter", "split text into sentences", "split paragraph into sentences", "sentence segmentation online", "one sentence per line"],
    sections: [
      { heading: "Copy sentences, one per line", text: "After you paste your text, press Copy sentences, one per line. You get a plain list that you can paste into a spreadsheet, a translation tool or a language-learning app." },
      { heading: "Abbreviations are handled", text: "Abbreviations such as Dr., e.g. and p.m., initials and decimal numbers do not split a sentence. This is rule-based, so check the list when the text has unusual punctuation." },
      { heading: "Numbers and statistics", text: "Next to each sentence you see its word count, and the totals show the number of sentences, questions and exclamations." },
    ],
    faqs: [
      { q: "Does it keep the punctuation?", a: "Yes. Each sentence is copied with its original punctuation." },
      { q: "Can I split a whole document?", a: "Yes, up to one million characters. Drop a .txt file into the box." },
      { q: "Is the text uploaded?", a: "No. Everything runs in your browser." },
    ],
  },
  {
    slug: "title-case-converter",
    tool: "case-converter",
    title: "Title Case Converter – Capitalize Titles Online",
    description: "Convert text to Title Case online. Small words like a, the and of stay in lower case, and you can keep short acronyms. Free, private, with copy and download.",
    h1: "Title case converter for headlines and titles",
    intro: "Paste your title and get proper Title Case, with small words kept in lower case.",
    keywords: ["title case converter", "capitalize title", "headline capitalizer", "title capitalization tool", "convert to title case"],
    initial: { mode: "title" },
    sections: [
      { heading: "How the rules work", text: "The first and last word are always capitalised. Short words such as a, an, the, and, but, or, for, of, in, on, at, to and by stay in lower case in the middle of a title. A word after a colon is capitalised too." },
      { heading: "Acronyms and brand names", text: "Short ALL-CAPS words such as NASA stay as they are, and words with a capital inside, such as iPhone or YouTube, are left alone. Both can be switched off in the options." },
      { heading: "Style guides differ", text: "APA, Chicago, AP and MLA treat longer prepositions and some details differently. This tool follows a common simple rule, so check your own style guide for formal work." },
    ],
    faqs: [
      { q: "Is Title Case the same as capitalizing every word?", a: "No. Capitalized Case capitalises every word, while Title Case keeps small words in lower case. Both are one click apart in the tool." },
      { q: "Does it work for non-English titles?", a: "The small-word list is English. For other languages use Capitalized Case and fix small words by hand." },
      { q: "Is my text uploaded?", a: "No. Everything is converted in your browser." },
    ],
  },
  {
    slug: "sentence-case-converter",
    tool: "case-converter",
    title: "Sentence Case Converter – Fix Capital Letters",
    description: "Convert text to sentence case online. Everything becomes lower case and the first letter of each sentence is capitalised. Free and private.",
    h1: "Sentence case converter: fix text written in all caps",
    intro: "Paste text written in ALL CAPS or all lower case and get normal sentences back.",
    keywords: ["sentence case converter", "convert caps to sentence case", "fix all caps text", "capitalize first letter of sentence", "uppercase to sentence case"],
    initial: { mode: "sentence" },
    sections: [
      { heading: "Fix text typed in caps lock", text: "Paste text that was typed with Caps Lock on and the tool lowers everything, then capitalises the first letter of each sentence after a full stop, question mark or exclamation mark, and at the start of every line." },
      { heading: "What you still need to check", text: "Names, places, acronyms and the pronoun I in English are not detected, so capitalise those by hand after converting." },
      { heading: "Works with several languages", text: "Accented letters are handled, and Arabic or Chinese text has no letter case so it stays unchanged." },
    ],
    faqs: [
      { q: "Does it capitalise names?", a: "No. It cannot know which words are names, so check them after converting." },
      { q: "Does a new line start a sentence?", a: "Yes, the first letter after a line break is capitalised." },
      { q: "Can I undo a conversion?", a: "Yes. Use result as input, then Undo to go back." },
    ],
  },
  {
    slug: "uppercase-converter",
    tool: "case-converter",
    title: "Uppercase Converter – Text to UPPER CASE",
    description: "Change any text to UPPER CASE in one click. Handles accented letters and the German ß, with a Turkish option. Free, private, copy or download.",
    h1: "Uppercase converter: change text to CAPITAL LETTERS",
    intro: "Paste your text and get it in capital letters straight away.",
    keywords: ["uppercase converter", "text to uppercase", "convert to capital letters", "all caps converter", "make text uppercase"],
    initial: { mode: "upper" },
    sections: [
      { heading: "Capital letters in one click", text: "Everything you type or paste is shown in UPPER CASE immediately. Copy it or download it as a .txt file." },
      { heading: "Accents and special letters", text: "Accented letters keep their accents (é becomes É) and the German ß becomes SS, as in standard Unicode rules." },
      { heading: "Turkish", text: "Turn on the Turkish option so that i becomes İ, which is how Turkish capitalises it." },
    ],
    faqs: [
      { q: "Does it change numbers or symbols?", a: "No. Only letters that have a capital form change." },
      { q: "What about Arabic or Chinese?", a: "These scripts have no upper case, so they stay as they are." },
      { q: "Is there a size limit?", a: "You can convert up to one million characters." },
    ],
  },
  {
    slug: "lowercase-converter",
    tool: "case-converter",
    title: "Lowercase Converter – Text to lower case",
    description: "Convert text to lower case online. Useful for emails, tags and clean data. Handles accented letters and Turkish. Free and private.",
    h1: "Lowercase converter: change text to small letters",
    intro: "Paste your text and get it in lower case, ready to copy.",
    keywords: ["lowercase converter", "convert to lowercase", "text to lower case", "uppercase to lowercase", "make text lowercase"],
    initial: { mode: "lower" },
    sections: [
      { heading: "Clean up data", text: "Lower case helps when you compare words, clean up a list of email addresses or tags, or make text consistent before you import it." },
      { heading: "Accents and special letters", text: "Accented capitals such as É become é. The result keeps your line breaks and spacing." },
      { heading: "Turkish", text: "Turn on the Turkish option so that İ becomes i and I becomes ı." },
    ],
    faqs: [
      { q: "Does it remove spaces?", a: "No. Only the letter case changes." },
      { q: "Can I lowercase a whole file?", a: "Yes. Open a .txt file or drop it into the box." },
      { q: "Is my text stored?", a: "No. It stays in your browser." },
    ],
  },
  {
    slug: "camelcase-converter",
    tool: "case-converter",
    title: "camelCase Converter – Text to camelCase",
    description: "Convert text, snake_case or kebab-case to camelCase online. Handles lists, accents and PascalCase. Free and private.",
    h1: "camelCase converter for variable names",
    intro: "Paste words, a snake_case name or a list of names and get camelCase.",
    keywords: ["camelcase converter", "text to camelcase", "snake case to camel case", "convert to camel case", "camel case generator"],
    initial: { mode: "camel" },
    sections: [
      { heading: "From any style", text: "The tool finds the words even when your input is in another style, so user_profile, user-profile, User Profile and UserProfile all become userProfile." },
      { heading: "One name per line", text: "Put a list of names on separate lines and each line is converted on its own. Switch the option off to join everything into a single name." },
      { heading: "Remove accents", text: "Turn on Remove accents if your language or codebase does not allow accented identifiers." },
    ],
    faqs: [
      { q: "What is the difference between camelCase and PascalCase?", a: "camelCase starts with a lower case letter (userProfile) and PascalCase starts with a capital (UserProfile). Both are one click apart." },
      { q: "Does it keep numbers?", a: "Yes, numbers stay part of the name." },
      { q: "Can it convert acronyms?", a: "XMLHttpRequest becomes xmlHttpRequest, because each acronym is treated as a word." },
    ],
  },
  {
    slug: "snake-case-converter",
    tool: "case-converter",
    title: "snake_case Converter – Text to snake_case",
    description: "Convert text, camelCase or kebab-case to snake_case online. Works on lists, removes accents on request. Free and private.",
    h1: "snake_case converter for variables and columns",
    intro: "Paste words or a camelCase name and get snake_case, one name per line if you like.",
    keywords: ["snake case converter", "text to snake case", "camelcase to snake case", "convert to snake_case", "snake case generator"],
    initial: { mode: "snake" },
    sections: [
      { heading: "For code and databases", text: "snake_case is common in Python, Ruby, SQL column names and file names. Words are lower case and joined with underscores." },
      { heading: "From camelCase and more", text: "userProfileID becomes user_profile_id, and Hello Big World becomes hello_big_world. Spaces, hyphens and dots are treated as word breaks." },
      { heading: "Other developer cases", text: "CONSTANT_CASE, kebab-case, dot.case and Train-Case are one click away, and the cards below show every case at once." },
    ],
    faqs: [
      { q: "How is it different from kebab-case?", a: "kebab-case uses hyphens instead of underscores. Both are available." },
      { q: "Does it handle many lines?", a: "Yes. Each line is converted separately by default." },
      { q: "Does it keep capital letters?", a: "No. snake_case is lower case. For capitals use CONSTANT_CASE." },
    ],
  },
  {
    slug: "text-compare",
    tool: "text-diff-checker",
    title: "Text Compare – Compare Two Texts Online",
    description: "Compare two texts online and see what was added, removed or changed. Word-level highlights, side by side or one column. Free and private.",
    h1: "Text compare: see what changed between two texts",
    intro: "Paste the original on the left and the new version on the right. Added text turns green and removed text turns red, right down to single words.",
    keywords: ["text compare", "compare text online", "text comparison tool", "compare two texts", "text diff"],
    sections: [
      { heading: "Matches lines first", text: "The tool pairs up the lines of both texts, so one new line in the middle does not mark everything after it as changed. Only the lines that really differ are coloured." },
      { heading: "Then highlights the words", text: "Inside an edited line, the exact words that changed are marked, so a price that went from $50 to $60 shows just the number, not the whole sentence." },
      { heading: "Numbers at a glance", text: "A summary shows the similarity, the number of changed spots and how many lines were edited, added, removed or left alone." },
    ],
    faqs: [
      { q: "Do I need to sign up?", a: "No. Paste your texts and the result appears at once." },
      { q: "Is my text sent to a server?", a: "No. The comparison runs in your browser and nothing is uploaded or saved." },
      { q: "How long a text can I compare?", a: "Up to about 600,000 characters per side. Very different long texts are shown as removed and added lines." },
    ],
  },
  {
    slug: "compare-two-texts",
    tool: "text-diff-checker",
    title: "Compare Two Texts – Side by Side Difference Tool",
    description: "Compare two texts side by side. Matching lines line up, changed words are highlighted and you can jump from one change to the next.",
    h1: "Compare two texts side by side",
    intro: "Two drafts, two emails, two versions of a policy: put them next to each other and read only what is different.",
    keywords: ["compare two texts", "compare two documents", "side by side text comparison", "compare two paragraphs", "document comparison"],
    initial: { view: "split" },
    sections: [
      { heading: "Two columns, one row per line", text: "The original sits on the left and the modified text on the right. Where a line was added or deleted, the other side stays empty so the rest still lines up." },
      { heading: "Jump between changes", text: "Use Next change and Previous change to move through the differences one by one, which saves scrolling in a long text." },
      { heading: "Show only the changes", text: "Hide the long unchanged stretches and keep two lines of context around each change." },
    ],
    faqs: [
      { q: "Can I compare two Word documents?", a: "Copy the text out of each document and paste it in. Formatting such as bold or tables is not compared, only the words." },
      { q: "Can I swap the two sides?", a: "Yes. Swap texts exchanges them in one click, which turns added lines into removed ones." },
      { q: "Does it work on a phone?", a: "Yes. On small screens the one column view is selected for you." },
    ],
  },
  {
    slug: "find-difference-between-two-texts",
    tool: "text-diff-checker",
    title: "Find the Difference Between Two Texts",
    description: "Find the difference between two texts or lists. See added, removed and changed lines and words, with a similarity score. Free, in your browser.",
    h1: "Find the difference between two texts",
    intro: "When two versions look the same but you know something moved, this shows exactly where. Paste both and read the highlights.",
    keywords: ["find difference between two texts", "spot the difference text", "difference between two documents", "text difference checker", "what changed between two texts"],
    sections: [
      { heading: "Spot a single changed word", text: "Small edits such as a different number, name or date are marked on their own, even in a long line." },
      { heading: "Compare lists", text: "Put one item per line to see which names, emails or codes were added or removed between two lists." },
      { heading: "Copy or download the result", text: "Copy the differences or download them as a .diff file to send to someone or keep a record." },
    ],
    faqs: [
      { q: "What does the similarity score mean?", a: "It is the share of text the two versions have in common, counting unchanged lines fully and edited lines by their shared words. It is a guide, not a legal measure." },
      { q: "What if the texts are identical?", a: "You get a clear message saying they match with the current options." },
      { q: "Does it detect moved paragraphs?", a: "A moved paragraph shows as one removal and one addition." },
    ],
  },
  {
    slug: "text-compare-ignore-case",
    tool: "text-diff-checker",
    title: "Compare Text Ignoring Case and Spaces",
    description: "Compare two texts while ignoring upper and lower case and extra spaces, so only real wording changes are shown. Free online tool.",
    h1: "Compare text and ignore case and extra spaces",
    intro: "Sometimes two texts differ only in capital letters or spacing. Here those options are already switched on, so you see wording changes only.",
    keywords: ["compare text ignore case", "case insensitive text compare", "compare text ignore whitespace", "diff ignore spaces", "compare strings ignoring case"],
    initial: { ignoreCase: true, ignoreSpace: true },
    sections: [
      { heading: "Ignore upper and lower case", text: "Hello and hello count as the same word. This helps with lists copied from different systems." },
      { heading: "Ignore extra spaces", text: "Spaces at the start and end of a line and repeated spaces between words are not counted as changes." },
      { heading: "Turn them off any time", text: "Both options are checkboxes under the text boxes. Untick them to see every character-level difference again." },
    ],
       faqs: [
      {
        q: "Are line breaks ignored too?",
        a: "No. Lines are still compared one by one. Only case and spacing inside a line are relaxed."
      },
      {
        q: "Is the text itself changed?",
        a: "No. The options only affect how texts are compared, your original text stays as typed."
      },
      {
        q: "Why do two lines show as the same when they look different?",
        a: "They probably differ only in case or spacing, which is ignored on this page."
      }
    ],
  },
];


export function getLanding(slug: string): ToolLanding | undefined {
  return TOOL_LANDINGS.find((l) => l.slug === slug);
}

export function getLandingsForTool(toolSlug: string): ToolLanding[] {
  return TOOL_LANDINGS.filter((l) => l.tool === toolSlug);
}
