import { useTranslation } from "react-i18next";
import { Sparkles, Clock } from "lucide-react";

interface GenericToolProps {
  slug: string;
  placeholder?: string;
}

export function GenericTool({ slug: _slug }: GenericToolProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/20">
        <Clock className="h-8 w-8 text-brand-500 dark:text-brand-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-100">
        {t("tool.comingSoon")}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
        {t("tool.comingSoonDesc")}
      </p>
      <div className="mt-4 flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
        <Sparkles className="h-3.5 w-3.5" />
        {t("tool.inDevelopment")}
      </div>
    </div>
  );
}
