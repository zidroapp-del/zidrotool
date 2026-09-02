import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { ToolLayout } from "@/components/ToolLayout";
import { getTool } from "@/data/catalog";
import { getToolMeta } from "@/data/toolMeta";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

const TOOL_COMPONENTS = import.meta.glob([
  "/src/tools/*.tsx",
  "!/src/tools/GenericTool.tsx",
]);

const GenericToolLazy = lazy(() =>
  import("@/tools/GenericTool").then((module) => ({
    default: module.GenericTool,
  }))
);

type VideoPlatform =
  | "facebook"
  | "tiktok"
  | "youtube"
  | "instagram"
  | "x"
  | "auto";

function getVideoPlatforms(slug: string): VideoPlatform[] | undefined {
  // TikTok tool → TikTok + YouTube
  if (
    slug === "tiktok-downloader" ||
    slug.includes("tiktok-downloader")
  ) {
    return ["tiktok", "youtube"];
  }

  // Facebook tool → Facebook + Instagram
  if (
    slug === "facebook-video-downloader" ||
    slug.includes("facebook-video-downloader")
  ) {
    return ["facebook", "instagram"];
  }

  // Keep these if these tools exist separately
  if (
    slug === "youtube-video-downloader" ||
    slug === "youtube-downloader"
  ) {
    return ["youtube"];
  }

  if (
    slug === "instagram-video-downloader" ||
    slug === "instagram-downloader"
  ) {
    return ["instagram"];
  }

  if (
    slug === "twitter-video-downloader" ||
    slug === "x-video-downloader"
  ) {
    return ["x"];
  }

  return undefined;
}

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

  const videoPlatforms = getVideoPlatforms(tool.slug);

  const toolProps = {
    slug: tool.slug,
    ...(videoPlatforms
      ? {
          platforms: videoPlatforms,
        }
      : {}),
  };

  if (!LazyComp) {
    return (
      <ToolLayout
        output=""
        onReset={() => {}}
        howToSteps={meta.howTo}
        faqs={meta.faqs}
        seoTitle={seoTitle}
        seoDescription={seoDesc}
        slug={tool.slug}
      >
        <Suspense fallback={fallback}>
          <GenericToolLazy slug={tool.slug} />
        </Suspense>
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
      slug={tool.slug}
    >
      <Suspense fallback={fallback}>
        <ToolComponent {...toolProps} />
      </Suspense>
    </ToolLayout>
  );
}