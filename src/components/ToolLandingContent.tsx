import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { getTool } from "@/data/catalog";
import { getLandingsForTool, type ToolLanding } from "@/data/toolLandings";
import { useTranslation } from "react-i18next";

/**
 * Unique guide text + FAQ for a long-tail landing page (see src/data/toolLandings.ts).
 * Rendered under the real tool. Emits its own FAQPage JSON-LD.
 */
export function ToolLandingContent({ landing }: { landing: ToolLanding }) {
  const { t } = useTranslation();
  const tool = getTool(landing.tool);
  const toolName = tool ? (t(tool.nameKey) as string) : landing.tool;
  const siblings = getLandingsForTool(landing.tool).filter((l) => l.slug !== landing.slug);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landing.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <article className="mt-10 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">{landing.h1}</h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600 dark:text-ink-300">{landing.intro}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {landing.sections.map((s) => (
          <section key={s.heading}>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">{s.heading}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-600 dark:text-ink-300">{s.text}</p>
          </section>
        ))}
      </div>

      <section className="mt-8">
        <h3 className="text-lg font-bold text-ink-900 dark:text-white">Frequently asked questions</h3>
        <dl className="mt-3 divide-y divide-ink-100 dark:divide-ink-800">
          {landing.faqs.map((f) => (
            <div key={f.q} className="py-3">
              <dt className="text-sm font-semibold text-ink-900 dark:text-white">{f.q}</dt>
              <dd className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-300">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav aria-label="Related pages" className="mt-6 flex flex-wrap gap-2 border-t border-ink-100 pt-5 dark:border-ink-800">
        {tool && (
          <Link to={`/tools/${tool.slug}`} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-200">
            {toolName}
          </Link>
        )}
        {siblings.map((l) => (
          <Link key={l.slug} to={`/tools/${l.slug}`} className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800">
            {l.h1}
          </Link>
        ))}
      </nav>
    </article>
  );
}
