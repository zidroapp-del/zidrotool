import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Handshake,
  Loader2,
  Mail,
  MessageSquare,
  Newspaper,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useToast } from "@/components/Toast";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { cn, copyToClipboard } from "@/lib/utils";

type ContactCategory = "general" | "technical" | "business" | "partnership" | "media";

type FormErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

const CATEGORY_EMAILS: Record<ContactCategory, keyof typeof SITE_CONFIG.emails> = {
  general: "contact",
  technical: "support",
  business: "contact",
  partnership: "partners",
  media: "press",
};

export default function ContactPage() {
  const { t } = useTranslation();
  const { success, error } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<ContactCategory>("general");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const categories = useMemo(
    () => [
      { key: "general" as const, icon: MessageSquare, labelKey: "contact.cat.general" },
      { key: "technical" as const, icon: Zap, labelKey: "contact.cat.technical" },
      { key: "business" as const, icon: Briefcase, labelKey: "contact.cat.business" },
      { key: "partnership" as const, icon: Handshake, labelKey: "contact.cat.partnership" },
      { key: "media" as const, icon: Newspaper, labelKey: "contact.cat.media" },
    ],
    [],
  );

  const channels = [
    {
      icon: MessageSquare,
      label: t("contact.channel.support"),
      description: t("contact.channel.supportDesc"),
      value: SITE_CONFIG.emails.support,
    },
    {
      icon: Handshake,
      label: t("contact.channel.partners"),
      description: t("contact.channel.partnersDesc"),
      value: SITE_CONFIG.emails.partners,
    },
    {
      icon: Newspaper,
      label: t("contact.channel.press"),
      description: t("contact.channel.pressDesc"),
      value: SITE_CONFIG.emails.press,
    },
  ];

  const recipient = SITE_CONFIG.emails[CATEGORY_EMAILS[category]];

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!name.trim()) next.name = t("contact.error.name");
    if (!email.trim()) next.email = t("contact.error.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t("contact.error.emailInvalid");
    }

    if (!subject.trim()) next.subject = t("contact.error.subject");
    if (!message.trim()) next.message = t("contact.error.message");
    else if (message.trim().length < 10) next.message = t("contact.error.messageShort");
    else if (message.trim().length > 2000) next.message = t("contact.error.messageLong");

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setStatus("loading");

    try {
      const body = [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        `Category: ${t(categories.find((item) => item.key === category)?.labelKey ?? "contact.cat.general")}`,
        "",
        message.trim(),
      ].join("\n");

      const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      setStatus("ready");
    } catch {
      setStatus("error");
      error(t("contact.error.generic"));
    }
  };

  const handleCopyEmail = async () => {
    const copied = await copyToClipboard(recipient);
    if (!copied) {
      error(t("contact.copyError"));
      return;
    }
    success(t("contact.copySuccess"));
  };

  const resetForm = () => {
    setStatus("idle");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setErrors({});
  };

  return (
    <>
      <Seo
        title={t("contact.seoTitle")}
        description={t("contact.seoDescription")}
      />

      <div className="container-page py-8 pb-16">
        <Breadcrumbs items={[{ label: t("nav.contact") }]} />

        <section className="relative mt-6 overflow-hidden rounded-3xl border border-ink-200 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-6 dark:border-ink-800 dark:from-brand-950/50 dark:via-ink-950 dark:to-accent-950/30 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-accent-400/15 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-700 backdrop-blur dark:border-brand-800 dark:bg-ink-900/60 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t("contact.eyebrow")}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-950 dark:text-white sm:text-4xl">
              {t("contact.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-600 dark:text-ink-300">
              {t("contact.subtitle")}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-ink-600 dark:text-ink-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm dark:bg-ink-900/70">
                <ShieldCheck className="h-4 w-4 text-success-600" />
                {t("contact.promise.private")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm dark:bg-ink-900/70">
                <Mail className="h-4 w-4 text-brand-600" />
                {t("contact.promise.response")}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
            {t("contact.categoryLabel")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.key;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={cn(
                    "group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 active:scale-[0.98]",
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500 dark:bg-brand-950/50 dark:text-brand-300"
                      : "border-ink-200 bg-white text-ink-600 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-brand-700 dark:hover:bg-brand-950/30",
                  )}
                  aria-pressed={active}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-brand-600 dark:text-brand-400" : "text-ink-400 group-hover:text-brand-500")} />
                  <span className="text-xs font-semibold">{t(cat.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <aside className="space-y-4 lg:col-span-4">
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("contact.emailUs")}</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                {t("contact.emailUsDesc")}
              </p>

              <div className="mt-4 space-y-3">
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <a
                      key={channel.value}
                      href={`mailto:${channel.value}`}
                      className="group flex items-start gap-3 rounded-xl border border-ink-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-ink-700 dark:hover:border-brand-700 dark:hover:bg-brand-950/20"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink-900 dark:text-ink-100">{channel.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-ink-500 dark:text-ink-400">{channel.description}</span>
                        <span className="mt-1 block truncate text-xs font-medium text-brand-600 dark:text-brand-400">{channel.value}</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{t("contact.selectedEmail")}</p>
                  <p className="mt-1 break-all text-sm text-brand-600 dark:text-brand-400">{recipient}</p>
                </div>
                <button type="button" onClick={handleCopyEmail} className="btn-secondary btn-sm" aria-label={t("contact.copyEmail")}>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("contact.copyEmail")}</span>
                </button>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("contact.before.title")}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-600 dark:text-ink-400">
                <li>• {t("contact.before.one")}</li>
                <li>• {t("contact.before.two")}</li>
                <li>• {t("contact.before.three")}</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/tools" className="btn-secondary btn-sm">{t("contact.browseTools")}</Link>
                <Link to="/privacy" className="btn-ghost btn-sm">{t("footer.links.privacy")}</Link>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8">
            {status === "ready" ? (
              <div className="card flex min-h-[520px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/30">
                  <CheckCircle2 className="h-8 w-8 text-success-700 dark:text-success-500" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-ink-900 dark:text-ink-100">{t("contact.readyTitle")}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">{t("contact.readyDesc")}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <a href={`mailto:${recipient}`} className="btn-primary btn-sm">
                    <Mail className="h-4 w-4" />
                    {t("contact.openEmail")}
                  </a>
                  <button type="button" onClick={resetForm} className="btn-secondary btn-sm">{t("contact.sendAnother")}</button>
                </div>
              </div>
            ) : status === "error" ? (
              <div className="card flex min-h-[520px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 dark:bg-danger/15">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-ink-900 dark:text-ink-100">{t("contact.errorTitle")}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">{t("contact.error.generic")}</p>
                <button type="button" onClick={() => setStatus("idle")} className="btn-secondary mt-6 btn-sm">{t("contact.retry")}</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="card p-6 sm:p-7">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{t("contact.formTitle")}</h2>
                  <p className="mt-1 text-sm leading-6 text-ink-500 dark:text-ink-400">{t("contact.formDesc")}</p>
                </div>

                <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="label">{t("contact.name")} <span className="text-danger">*</span></label>
                    <input id="contact-name" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: undefined }); }} className={cn("input", errors.name && "border-danger focus:border-danger")} placeholder={t("contact.namePlaceholder")} aria-invalid={!!errors.name} autoComplete="name" />
                    {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="label">{t("contact.email")} <span className="text-danger">*</span></label>
                    <input id="contact-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }} className={cn("input", errors.email && "border-danger focus:border-danger")} placeholder="you@example.com" aria-invalid={!!errors.email} autoComplete="email" />
                    {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="contact-subject" className="label">{t("contact.subject")} <span className="text-danger">*</span></label>
                  <input id="contact-subject" value={subject} onChange={(e) => { setSubject(e.target.value); if (errors.subject) setErrors({ ...errors, subject: undefined }); }} className={cn("input", errors.subject && "border-danger focus:border-danger")} placeholder={t("contact.subjectPlaceholder")} aria-invalid={!!errors.subject} />
                  {errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject}</p>}
                </div>

                <div className="mt-4">
                  <label htmlFor="contact-message" className="label">{t("contact.message")} <span className="text-danger">*</span></label>
                  <textarea id="contact-message" value={message} onChange={(e) => { setMessage(e.target.value.slice(0, 2000)); if (errors.message) setErrors({ ...errors, message: undefined }); }} className={cn("input min-h-[190px] resize-y", errors.message && "border-danger focus:border-danger")} placeholder={t("contact.messagePlaceholder")} aria-invalid={!!errors.message} />
                  <div className="mt-1 flex items-center justify-between gap-3">
                    {errors.message ? <p className="text-xs text-danger">{errors.message}</p> : <span className="text-xs text-ink-400">{t("contact.messageHint")}</span>}
                    <span className="shrink-0 text-xs text-ink-400">{message.length} / 2000</span>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-ink-200 bg-ink-50/70 p-3 text-xs leading-5 text-ink-500 dark:border-ink-700 dark:bg-ink-800/50 dark:text-ink-400">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success-600" />
                    <span>{t("contact.formPrivacy")}</span>
                  </div>
                </div>

                <button type="submit" disabled={status === "loading"} className="btn-primary mt-5 w-full">
                  {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t("contact.send")}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-ink-400 dark:text-ink-500">
                  {t("contact.mailtoNote")} <span className="font-medium text-ink-500 dark:text-ink-400">{recipient}</span>
                </p>
              </form>
            )}
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-ink-900 dark:text-ink-100">{t("contact.footerTitle")}</h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{t("contact.footerDesc")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/about" className="btn-secondary btn-sm">{t("nav.about")}</Link>
              <Link to="/terms" className="btn-secondary btn-sm">{t("footer.links.terms")}</Link>
              <Link to="/cookies" className="btn-secondary btn-sm">{t("footer.links.cookies")}</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
