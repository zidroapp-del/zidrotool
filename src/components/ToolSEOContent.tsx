import { useMemo } from "react";
import { BookOpen, CheckCircle2, Lightbulb, Users, Layers, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Tool } from "@/types";

/**
 * Hand-written guides for the tools that matter most for search.
 * A tool listed here gets its own real article (with its own FAQ).
 * Every other tool keeps the generic template below, so nothing else changes.
 */
type Guide = {
  title: string;
  intro: string;
  sections: { title: string; paragraphs: string[]; list?: string[] }[];
  faqs: { q: string; a: string }[];
};

const SECTION_ICONS: LucideIcon[] = [BookOpen, CheckCircle2, Layers, Lightbulb, Users];

const GUIDES: Record<string, Guide> = {
  "image-converter": {
    title: "Image Converter: convert JPG, PNG and WebP online",
    intro:
      "Convert images between JPG, PNG and WebP directly in your browser. Add one picture or a whole batch, pick the output format and quality, and download the results. Your files are processed on your device and are not uploaded.",
    sections: [
      {
        title: "What this image converter does",
        paragraphs: [
          "An image converter changes the file format of a picture without you having to open a heavy editor. Use it to turn a PNG into a lighter JPG for a blog, a JPG into WebP for a faster website, or a WebP image you downloaded into a JPG or PNG that older apps can open.",
          "You can convert many images at once, choose the quality for lossy formats, and resize when the original is larger than you need. Because everything runs in your browser, there is no waiting for an upload and no account to create.",
        ],
      },
      {
        title: "How to convert an image",
        paragraphs: ["It takes three steps:"],
        list: [
          "Add your images: drag them into the tool or click to choose files. You can add several at the same time.",
          "Choose the output format (JPG, PNG or WebP), set the quality and, if needed, a new size.",
          "Convert and download the converted images. Check one file first if you are processing a large batch.",
        ],
      },
      {
        title: "JPG, PNG or WebP: which format should you choose?",
        paragraphs: [
          "JPG is the best all-round choice for photos. It gives small files and works everywhere, but it does not support transparency and every save at a lower quality removes a little detail.",
          "PNG keeps every pixel exactly and supports transparent backgrounds, so it suits logos, screenshots, icons and graphics with sharp text. The files are usually larger than JPG for photographs.",
          "WebP can be saved as lossy or lossless, supports transparency, and is usually smaller than JPG or PNG at similar visual quality. It is a good default for websites. Modern browsers support it, but some older software and email tools still do not.",
        ],
      },
      {
        title: "Tips for better results",
        paragraphs: [
          "Start from the best original you have. Converting a small or already compressed JPG to PNG will not bring back lost detail; it only changes the container and the file will often get bigger.",
          "For photos, a quality between 75 and 85 is usually a good balance between size and sharpness. Compare the result with the original at 100% zoom before you publish it.",
          "When you convert a transparent PNG or WebP to JPG, the transparent areas must become a solid colour, because JPG cannot store transparency. Keep PNG or WebP if you need to preserve it.",
          "For websites, resize images to the largest size they are displayed at. A 4000 px photo shown at 800 px wastes bandwidth even after conversion.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is this image converter really free?",
        a: "Yes. You can convert as many images as you like for free, with no watermark and no sign-up.",
      },
      {
        q: "Are my images uploaded to a server?",
        a: "No. The conversion happens in your browser on your own device, so your pictures stay with you.",
      },
      {
        q: "Which format is best for a website?",
        a: "WebP is usually the smallest at good quality and is supported by all modern browsers. Use JPG for photos when you need maximum compatibility, and PNG for graphics that need transparency or very sharp edges.",
      },
      {
        q: "Can I convert several images at once?",
        a: "Yes. Add multiple files and they are converted in one go with the same format and quality settings.",
      },
      {
        q: "Why is my converted file bigger than the original?",
        a: "This happens most often when a compressed JPG is converted to PNG, because PNG stores every pixel without loss. Choose JPG or WebP and lower the quality slightly to get a smaller file.",
      },
    ],
  },

  "meta-title-checker": {
    title: "Meta Title Length Checker: how long should a title tag be?",
    intro:
      "Check the length of your page title in characters and in pixels, and see how it will look in Google before you publish. The tool also checks the limits used by eBay, Etsy, Amazon and Poshmark listings.",
    sections: [
      {
        title: "How long should a meta title be?",
        paragraphs: [
          "There is no official character limit. Google cuts a title when it is wider than the space available in the results page, which is about 600 pixels on desktop. In practice that is roughly 50 to 60 characters, but narrow letters take less room than wide ones, so a pixel measurement is more accurate than counting characters.",
          "A title that is too long is shortened with “…”, and the words you cut off can be the ones that make people click. A title that is too short wastes the best space you have to describe the page.",
        ],
      },
      {
        title: "How to use the checker",
        paragraphs: ["Paste your title and read the result:"],
        list: [
          "The character count and the pixel width update as you type.",
          "The ruler shows where the title would be cut in the search results.",
          "Use bulk mode to test many titles at once, for example a list of product pages.",
          "Switch the platform to check marketplace limits such as eBay (80), Etsy (140), Amazon (200) or Poshmark (50).",
        ],
      },
      {
        title: "Writing a title people click",
        paragraphs: [
          "Put the main keyword near the beginning and write for a person first. Say clearly what the page offers, keep each page title unique, and avoid repeating the same word several times.",
          "Google sometimes rewrites titles it thinks are unclear or stuffed with keywords, so a clean, accurate title is more likely to be shown as you wrote it.",
        ],
      },
    ],
    faqs: [
      {
        q: "How many characters should a title tag have?",
        a: "Aim for about 50 to 60 characters, and check the pixel width: Google cuts titles at roughly 600 pixels on desktop.",
      },
      {
        q: "Does title length affect rankings?",
        a: "Length itself is not a ranking factor. A title that is cut off or unclear can lower your click-through rate, which is why it is worth checking.",
      },
      {
        q: "Why does Google show a different title from mine?",
        a: "Google may rewrite titles that are too long, too short, repeated across pages or do not match the page content. Writing a clear, unique title reduces this.",
      },
      {
        q: "Is the checker free?",
        a: "Yes, it is free and your text is checked in your browser.",
      },
    ],
  },

  "meta-description-checker": {
    title: "Meta Description Length Checker: characters and pixels",
    intro:
      "Check how long your meta description is, see where Google may cut it on desktop and mobile, and write a snippet that makes people want to click.",
    sections: [
      {
        title: "How long should a meta description be?",
        paragraphs: [
          "Google does not publish a fixed limit. Descriptions are shortened by width: about 920 pixels over two lines on desktop and about 680 pixels on mobile. That usually means around 150 to 160 characters on desktop and 120 on mobile.",
          "Put the most important message first so it still works if the end is cut.",
        ],
      },
      {
        title: "How to use the checker",
        paragraphs: ["Paste your description and check:"],
        list: [
          "the character count and pixel width, for desktop and mobile;",
          "a live preview of how the snippet may look in search results;",
          "the point where the text would be truncated.",
        ],
      },
      {
        title: "Writing a better description",
        paragraphs: [
          "Summarise what the visitor will get, include the main keyword naturally and end with a reason to click. Make every description unique to its page.",
          "A meta description is not a direct ranking factor, but it can improve how many people click your result. Google may also replace it with text from the page if it matches the search better.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the best meta description length?",
        a: "About 150 to 160 characters for desktop and around 120 for mobile, but the width in pixels is what decides where Google cuts it.",
      },
      {
        q: "Does a meta description help SEO?",
        a: "It does not directly raise rankings, but a clear one can increase clicks from search results.",
      },
      {
        q: "Why does Google ignore my meta description?",
        a: "Google often builds its own snippet from the page when it thinks that answers the search better than your description.",
      },
    ],
  },

  "keyword-density": {
    title: "Keyword Density Checker: find the words you repeat most",
    intro:
      "Paste your text to see how often each word and phrase appears, as a count and as a percentage of the total. Check one target keyword, spot over-used words and export the result.",
    sections: [
      {
        title: "What keyword density means",
        paragraphs: [
          "Keyword density is the number of times a word or phrase appears divided by the total number of words, shown as a percentage. If a keyword appears 10 times in 500 words, its density is 2%.",
          "There is no ideal percentage and search engines do not publish one. The number is useful as a safety check: if one phrase dominates your text it may sound repetitive or look like keyword stuffing.",
        ],
      },
      {
        title: "How to use the checker",
        paragraphs: ["Paste or type your text, then:"],
        list: [
          "read the top one-word, two-word and three-word phrases;",
          "type a target keyword to see its exact count and density;",
          "turn on the option to ignore common stop words such as “the” and “and”;",
          "export the table as CSV if you need to share or compare it.",
        ],
      },
      {
        title: "Using it well",
        paragraphs: [
          "Write naturally first and use the tool afterwards. If a word is repeated far more than the rest, replace some occurrences with synonyms or related phrases.",
          "Check that your target keyword appears in the title, the first paragraph and a heading, where it is useful to readers, rather than chasing a percentage.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a good keyword density?",
        a: "There is no fixed number. Use the keyword where it reads naturally; a very high density is a sign the text is repetitive.",
      },
      {
        q: "Does Google use keyword density as a ranking factor?",
        a: "Google has said there is no magic density to aim for. Focus on useful content that covers the topic well.",
      },
      {
        q: "Does the tool check phrases as well as single words?",
        a: "Yes, it counts one, two and three-word phrases.",
      },
    ],
  },
};


GUIDES["image-to-pdf"] = {
  title: "Image to PDF: combine JPG, PNG and WebP into one PDF",
  intro:
    "Turn one or many pictures into a single PDF file in your browser. Reorder the pages, rotate any image, choose A4, Letter or the original size, and download. Your images are not uploaded anywhere.",
  sections: [
    {
      title: "What this image to PDF converter does",
      paragraphs: [
        "It builds a PDF where every image becomes one page. That is handy for sending scanned documents, ID photos, receipts, homework pages, portfolios or a set of screenshots as a single file that opens on any device.",
        "Because the work is done by your browser, there is no waiting for an upload, no file-size limit set by a server and no watermark added to your pages.",
      ],
    },
    {
      title: "How to convert images to PDF",
      paragraphs: ["It takes three steps:"],
      list: [
        "Add your images: drag them into the box or click to choose files. You can add more at any time.",
        "Put the pages in order by dragging them or using the arrows, rotate any picture that is sideways, and pick the page size, orientation and margin.",
        "Press Create PDF and download the file.",
      ],
    },
    {
      title: "Which page size should you choose?",
      paragraphs: [
        "“Same as image” keeps every page exactly the shape of its picture, which is best for screenshots and designs. A4 is the standard paper size in most countries, and Letter is the standard in the United States and Canada, so choose one of them when the PDF may be printed.",
        "With A4 or Letter, each image is scaled to fit inside the page without being stretched. Add a small margin if you plan to print or bind the pages.",
      ],
    },
    {
      title: "Tips for a good PDF",
      paragraphs: [
        "Photos taken with a phone are often large. A PDF made from many full-resolution photos can be heavy, so reduce the size of the pictures first with an image compressor if you need to email the file.",
        "JPG and PNG images are placed in the PDF without being recompressed, so they keep their quality. Check the order of the pages before you press Create PDF, because changing it afterwards means creating the file again.",
      ],
    },
  ],
  faqs: [
    { q: "Is this image to PDF tool free?", a: "Yes. It is free, with no sign-up, no watermark and no limit on the number of pages." },
    { q: "Are my images uploaded to a server?", a: "No. The PDF is created in your browser, so your pictures stay on your device." },
    { q: "Which image formats can I use?", a: "JPG, PNG and WebP work, and most other common picture types such as GIF, BMP or AVIF are converted automatically when your browser can open them." },
    { q: "Can I change the order of the pages?", a: "Yes. Drag the images into the order you want, or use the up and down arrows on each picture." },
    { q: "Why is my PDF so big?", a: "The PDF contains your pictures at their original quality. Compress or resize the images before you add them if you need a smaller file." },
  ],
};

GUIDES["jpg-to-pdf"] = {
  ...GUIDES["image-to-pdf"],
  title: "JPG to PDF: convert JPG photos into a PDF online",
  intro:
    "Convert one or many JPG or JPEG photos into a single PDF in your browser. Put the pages in order, rotate them, choose the page size and download. Nothing is uploaded.",
};


GUIDES["pdf-to-image"] = {
  title: "PDF to Image: convert PDF pages to JPG or PNG online",
  intro:
    "Turn the pages of a PDF into JPG or PNG pictures in your browser. Choose which pages you need, pick the resolution, and download them one by one or as a ZIP. Your PDF is not uploaded.",
  sections: [
    {
      title: "What this PDF to image converter does",
      paragraphs: [
        "It draws every selected page of your PDF as a picture. That is useful when you need a page as a photo to post on social media, insert into a presentation, send in a chat app, or use as a thumbnail or preview.",
        "The conversion runs in your browser, so the PDF stays on your device and there is no waiting for an upload.",
      ],
    },
    {
      title: "How to convert a PDF to images",
      paragraphs: ["It takes three steps:"],
      list: [
        "Drop your PDF into the box or click to choose it. Small previews of the pages appear.",
        "Click the pages you want (all are selected by default), then choose JPG or PNG and the resolution.",
        "Press Convert, then download a single page or every page in one ZIP file.",
      ],
    },
    {
      title: "JPG or PNG: which one should you choose?",
      paragraphs: [
        "JPG makes smaller files and is a good choice for pages with photos. PNG keeps text and sharp lines perfectly crisp, which is better for documents, slides and screenshots, but the files are larger.",
        "Resolution decides how sharp the picture is. “Screen” (72 dpi) is fine for a quick preview, “Good” (144 dpi) suits most uses, and “High” or “Print” (216 to 288 dpi) are best when you want to print the image or zoom in.",
      ],
    },
    {
      title: "Tips for better results",
      paragraphs: [
        "Convert only the pages you need. Large PDFs at a high resolution produce many big files and take longer to process.",
        "If the PDF is protected by a password, remove the password first, because the tool cannot open locked files. If the text looks blurry, choose a higher resolution or switch to PNG.",
      ],
    },
  ],
  faqs: [
    { q: "Is this PDF to image converter free?", a: "Yes. It is free, with no sign-up, no watermark and no limit on the number of pages." },
    { q: "Is my PDF uploaded to a server?", a: "No. The pages are converted in your browser, so your document stays on your device." },
    { q: "Can I convert only some pages?", a: "Yes. Click the pages you want in the preview list, or use All, None and Invert to select them quickly." },
    { q: "How do I get a PDF page as a high-quality image?", a: "Choose PNG, or JPG with the quality slider near 100%, and set the resolution to High or Print." },
    { q: "Can I download all the pages together?", a: "Yes. When more than one image is created, a Download ZIP button saves them all in one file." },
  ],
};

GUIDES["pdf-to-jpg"] = {
  ...GUIDES["pdf-to-image"],
  title: "PDF to JPG: convert PDF pages to JPG images online",
  intro:
    "Convert every page of a PDF into a JPG photo in your browser. Choose the pages, the quality and the resolution, then download the pictures one by one or as a ZIP. Nothing is uploaded.",
};

// The counter tool shares the same engine and the same guide.
GUIDES["keyword-counter"] = {
  ...GUIDES["keyword-density"],
  title: "Keyword Counter: count how many times a word appears",
  intro:
    "Paste any text to count how many times each keyword and phrase is used. See the most frequent words, check a target keyword and export the counts.",
};

function prettyName(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function GuideArticle({ guide }: { guide: Guide }) {
  return (
    <article className="mt-12 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8">
      <div className="mb-8 border-b border-ink-100 pb-6 dark:border-ink-800">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">ZidroTool Guide</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-3xl">{guide.title}</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600 dark:text-ink-300">{guide.intro}</p>
      </div>

      <div className="space-y-9 text-ink-700 dark:text-ink-300">
        {guide.sections.map((s, i) => {
          const Icon = SECTION_ICONS[i % SECTION_ICONS.length];
          return (
            <section key={s.title}>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xl font-bold text-ink-900 dark:text-white">{s.title}</h3>
              </div>
              <div className="mt-3 space-y-3 text-sm leading-7 sm:text-[15px]">
                {s.paragraphs.map((p) => <p key={p}>{p}</p>)}
                {s.list && (
                  <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-brand-600">
                    {s.list.map((li) => <li key={li}>{li}</li>)}
                  </ol>
                )}
              </div>
            </section>
          );
        })}

        <section className="border-t border-ink-100 pt-8 dark:border-ink-800">
          <h3 className="text-xl font-bold text-ink-900 dark:text-white">Frequently asked questions</h3>
          <div className="mt-5 space-y-4">
            {guide.faqs.map((f) => (
              <div key={f.q}>
                <h4 className="font-semibold text-ink-900 dark:text-white">{f.q}</h4>
                <p className="mt-1 text-sm leading-6">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

export function ToolSEOContent({ tool }: { tool: Tool }) {
  const custom = GUIDES[tool.slug];
  if (custom) return <GuideArticle guide={custom} />;
  return <GenericGuide tool={tool} />;
}

function GenericGuide({ tool }: { tool: Tool }) {
  const { t } = useTranslation();
  const name = t(tool.nameKey) !== tool.nameKey ? t(tool.nameKey) : prettyName(tool.slug);
  const description = t(tool.descKey) !== tool.descKey ? t(tool.descKey) : `Use ${name} online with a fast, simple workflow.`;
  const category = tool.category === "creator" ? "YouTube and creator workflows" : `${tool.category} utilities`;
  const keywords = tool.keywords?.slice(0, 6).join(", ") || name;

  const sections = useMemo(() => [
    {
      icon: BookOpen,
      title: `About ${name}`,
      paragraphs: [
        `${name} is a free online tool designed to make a common digital task faster and easier. ${description}`,
        `Instead of installing desktop software or moving between several websites, you can use ${name} directly in your browser. The workflow is designed for quick results, clear controls and practical output that can be copied, downloaded or reused.`,
        `This tool is part of ZidroTool's collection of ${category}. It is useful for creators, developers, students, marketers and everyday users who need a focused utility without unnecessary complexity.`,
      ],
    },
    {
      icon: CheckCircle2,
      title: `How to use ${name}`,
      paragraphs: [
        `Open the tool, enter or upload the information it asks for, review the available options, and run the action. Results are shown directly in the tool so you can verify them before copying or downloading them.`,
        `For repeat work, keep your input organized and use the reset or copy controls between tasks. This makes ${name} practical for both one-off jobs and larger batches of everyday work.`,
      ],
    },
    {
      icon: Users,
      title: `Who can use ${name}?`,
      paragraphs: [
        `${name} can be useful for people working with ${keywords}. It is especially helpful when you need a lightweight browser-based solution instead of a full desktop application.`,
        `Because the interface is focused on one job, beginners can get started quickly while experienced users can use it as a convenient utility inside a larger workflow.`,
      ],
    },
    {
      icon: Lightbulb,
      title: `Tips for getting better results`,
      paragraphs: [
        `Use clean, complete input whenever possible and check the result before publishing, sharing or using it in another application.`,
        `For privacy-sensitive work, avoid entering confidential information into any online service unless you understand how that service processes data.`,
      ],
    },
  ], [name, description, category, keywords]);

  return (
    <article className="mt-12 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8">
      <div className="mb-8 border-b border-ink-100 pb-6 dark:border-ink-800">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">ZidroTool Guide</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-3xl">{name}: complete online guide</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600 dark:text-ink-300">Learn what {name} does, how to use it, who it is for, and how to get more useful results from the tool.</p>
      </div>

      <div className="space-y-9 text-ink-700 dark:text-ink-300">
        {sections.map(({ icon: Icon, title, paragraphs }) => (
          <section key={title}>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-xl font-bold text-ink-900 dark:text-white">{title}</h3>
            </div>
            <div className="mt-3 space-y-3 text-sm leading-7 sm:text-[15px]">
              {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}

        <section className="border-t border-ink-100 pt-8 dark:border-ink-800">
          <h3 className="text-xl font-bold text-ink-900 dark:text-white">Frequently asked questions about {name}</h3>
          <div className="mt-5 space-y-4">
            <div><h4 className="font-semibold text-ink-900 dark:text-white">Is {name} free?</h4><p className="mt-1 text-sm leading-6">Yes. ZidroTool provides the tool as a browser-based utility.</p></div>
            <div><h4 className="font-semibold text-ink-900 dark:text-white">Do I need to install software?</h4><p className="mt-1 text-sm leading-6">No installation is required. Open the page and use the tool in your browser.</p></div>
            <div><h4 className="font-semibold text-ink-900 dark:text-white">Can I use the result commercially?</h4><p className="mt-1 text-sm leading-6">That depends on the content you enter and the source material involved. Check the rights to your own content before using results commercially.</p></div>
          </div>
        </section>
      </div>
    </article>
  );
}
