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
];

export function getLanding(slug: string): ToolLanding | undefined {
  return TOOL_LANDINGS.find((l) => l.slug === slug);
}

export function getLandingsForTool(toolSlug: string): ToolLanding[] {
  return TOOL_LANDINGS.filter((l) => l.tool === toolSlug);
}
