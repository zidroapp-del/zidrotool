import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { ToolLayout } from "@/components/ToolLayout";
import { getTool } from "@/data/catalog";
import { getToolMeta } from "@/data/toolMeta";
import { GenericTool } from "@/tools/GenericTool";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

const TOOL_COMPONENTS = import.meta.glob("/src/tools/*.tsx");

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const tool = slug ? getTool(slug) : undefined;
  const { t } = useTranslation();

  if (!tool) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-ink-500">Tool not found.</p>
      </div>
    );
  }

  const meta = getToolMeta(tool.slug);
  const componentPath = `/src/${tool.component}.tsx`;
  const LazyComp = TOOL_COMPONENTS[componentPath] as
    | (() => Promise<{ default: React.ComponentType<any> }>)
    | undefined;

  const seoTitle = t(tool.seoTitleKey) as string;
  const seoDesc = t(tool.seoDescKey) as string;

  const fallback = (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
    </div>
  );

  if (!LazyComp) {
    return (
      <ToolLayout
        output=""
        onReset={() => {}}
        howToSteps={meta.howTo}
        faqs={meta.faqs}
        seoTitle={seoTitle}
        seoDescription={seoDesc}
      >
        <GenericTool slug={tool.slug} />
      </ToolLayout>
    );
  }

  const ToolComponent = lazy(LazyComp);

  return (
    <ToolLayout
      output=""
      onReset={() => {}}
      howToSteps={meta.howTo}
      faqs={meta.faqs}
      seoTitle={seoTitle}
      seoDescription={seoDesc}
    >
      <Suspense fallback={fallback}>
        <ToolComponent slug={tool.slug} />
      </Suspense>
    </ToolLayout>
  );
}
