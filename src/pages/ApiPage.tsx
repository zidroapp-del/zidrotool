import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Code2, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function ApiPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setDone(true);
  };

  return (
    <>
      <Seo title={t("api.title")} description={t("api.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("footer.links.api") }]} />
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
            <Code2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("api.title")}</h1>
          <p className="mt-3 text-lg text-ink-500 dark:text-ink-400">{t("api.subtitle")}</p>
          <span className="badge-warning mt-4">{t("common.comingSoon")}</span>

          {done ? (
            <div className="mt-8 flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-success-700" />
              <p className="mt-3 font-medium text-ink-900 dark:text-ink-100">{t("newsletter.success")}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-8 flex max-w-sm gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("newsletter.placeholder")} className="input pl-10" />
              </div>
              <button type="submit" className="btn-primary shrink-0">{t("api.notify")}</button>
            </form>
          )}

          <div className="mt-12 grid gap-4 text-left sm:grid-cols-2">
            {[
              { title: "RESTful Design", desc: "Clean, predictable endpoints following REST conventions." },
              { title: "Rate Limited", desc: "Fair usage with generous free tier and Premium limits." },
              { title: "JSON Responses", desc: "Consistent JSON structure with clear error messages." },
              { title: "API Keys", desc: "Secure authentication via API keys for every request." },
            ].map((f) => (
              <div key={f.title} className="card p-5">
                <h3 className="font-semibold text-ink-900 dark:text-ink-100">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
