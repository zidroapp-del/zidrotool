import { useMemo } from "react";
import { BookOpen, CheckCircle2, Lightbulb, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Tool } from "@/types";

function prettyName(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ToolSEOContent({ tool }: { tool: Tool }) {
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
        `Instead of installing desktop software or moving between several websites, you can use ${name} directly in your browser. The workflow is designed for quick results, clear controls and practical output that can be copied, downloaded or reused immediately.`,
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
        `Use clean, complete input whenever possible and check the result before publishing, sharing or using it in another application. For SEO and creator workflows, treat generated or extracted information as a research aid and verify important details against the original source.`,
        `For privacy-sensitive work, avoid entering confidential information into any online service unless you understand how that service processes data. ZidroTool clearly indicates when a tool uses browser-side processing or an external service.`,
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
            <div><h4 className="font-semibold text-ink-900 dark:text-white">Is {name} free?</h4><p className="mt-1 text-sm leading-6">Yes. ZidroTool provides the tool as a browser-based utility, with premium features clearly marked when applicable.</p></div>
            <div><h4 className="font-semibold text-ink-900 dark:text-white">Do I need to install software?</h4><p className="mt-1 text-sm leading-6">No installation is required for the normal web workflow. Open the page, use the tool and process the result in your browser.</p></div>
            <div><h4 className="font-semibold text-ink-900 dark:text-white">Can I use the result commercially?</h4><p className="mt-1 text-sm leading-6">That depends on the content you enter and the source material involved. The tool itself does not replace any licence, copyright or platform requirements that apply to your content.</p></div>
          </div>
        </section>
      </div>
    </article>
  );
}
