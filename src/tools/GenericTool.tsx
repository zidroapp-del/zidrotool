import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, Clock, ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface GenericToolProps {
  slug?: string;
  placeholder?: string;
}

export function GenericTool({ slug: propSlug }: GenericToolProps) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  // الحصول على الـ slug من الـ Props أو من رابط الـ Route تلقائياً
  const currentSlug = propSlug || routeSlug || "tool";
  const formattedTitle = currentSlug.replace(/-/g, " ").toUpperCase();

  return (
    <>
      <Seo 
        title={`${formattedTitle} - ${t("tool.comingSoon") || "Coming Soon"}`} 
        description={t("tool.comingSoonDesc") || "This tool is under development."} 
      />

      <div className="container-page py-12 max-w-2xl mx-auto text-center px-4">
        <Breadcrumbs 
          items={[
            { label: t("breadcrumbs.tools") || "Tools", to: "/tools" },
            { label: formattedTitle }
          ]} 
        />

        <div className="mt-8 card p-8 sm:p-12 border border-ink-200/60 dark:border-ink-800 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/20">
            <Clock className="h-8 w-8 text-brand-500 dark:text-brand-400" />
          </div>

          <h1 className="mt-4 text-xl sm:text-2xl font-bold text-ink-900 dark:text-ink-100">
            {formattedTitle}
          </h1>

          <h3 className="mt-2 text-base font-semibold text-brand-600 dark:text-brand-400">
            {t("tool.comingSoon") || "Coming Soon"}
          </h3>

          <p className="mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
            {t("tool.comingSoonDesc") || "We are working hard to build this tool. It will be available very soon!"}
          </p>

          <div className="mt-4 flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
            <Sparkles className="h-3.5 w-3.5" />
            {t("tool.inDevelopment") || "In Active Development"}
          </div>

          <Link to="/tools" className="btn-primary mt-8 inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            {t("blog.back") || "Back to Tools"}
          </Link>
        </div>
      </div>
    </>
  );
}

export default GenericTool;