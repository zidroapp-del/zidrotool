import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Seo } from "@/components/Seo";
import { AdSlot } from "@/components/AdSlot";

interface StaticPageProps {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
  breadcrumbs: { label: string }[];
}

export function StaticPage({ title, subtitle, updated, children, breadcrumbs }: StaticPageProps) {
  return (
    <>
      <Seo title={title} description={subtitle} />
      <div className="container-page py-8">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-6 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
          {updated && <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">{updated}</p>}
          <div className="prose-zt mt-8">{children}</div>
          <div className="mt-12"><AdSlot variant="inline" /></div>
        </div>
      </div>
    </>
  );
}
