import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, CheckCircle2, AlertCircle, MessageSquare, Newspaper, Handshake, Briefcase, Camera, Clock, MapPin, Mail, Phone, Zap, ShieldCheck, ChevronDown } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useToast } from "@/components/Toast";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type ContactCategory = "general" | "technical" | "business" | "partnership" | "media";

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<ContactCategory>("general");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = t("contact.error.name");
    if (!email.trim()) e.email = t("contact.error.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t("contact.error.emailInvalid");
    if (!subject.trim()) e.subject = t("contact.error.subject");
    if (!message.trim()) e.message = t("contact.error.message");
    else if (message.trim().length < 10) e.message = t("contact.error.messageShort");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setTimeout(() => {
      if (Math.random() > 0.95) {
        setStatus("error");
        error(t("contact.error.generic"));
      } else {
        setStatus("success");
        success(t("contact.success"));
      }
    }, 1200);
  };

  const categories: { key: ContactCategory; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
    { key: "general", icon: MessageSquare, labelKey: "contact.cat.general" },
    { key: "technical", icon: Zap, labelKey: "contact.cat.technical" },
    { key: "business", icon: Briefcase, labelKey: "contact.cat.business" },
    { key: "partnership", icon: Handshake, labelKey: "contact.cat.partnership" },
    { key: "media", icon: Camera, labelKey: "contact.cat.media" },
  ];

  const channels = [
    { icon: MessageSquare, label: t("contact.support"), value: SITE_CONFIG.emails.support },
    { icon: Newspaper, label: t("contact.press"), value: SITE_CONFIG.emails.press },
    { icon: Handshake, label: t("contact.partner"), value: SITE_CONFIG.emails.partners },
  ];

  const mapsSrc = `https://www.google.com/maps?q=${encodeURIComponent(SITE_CONFIG.mapsEmbedQuery)}&output=embed`;

  return (
    <>
      <Seo title={t("contact.title")} description={t("contact.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("nav.contact") }]} />

        <div className="mt-6 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("contact.title")}</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("contact.subtitle")}</p>
        </div>

        {/* Support category selector */}
        <div className="mt-8">
          <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{t("contact.categoryLabel")}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 active:scale-[0.97]",
                  category === cat.key
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "border-ink-200 text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400 dark:hover:border-ink-600",
                )}
              >
                <cat.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{t(cat.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left sidebar */}
          <div className="space-y-4 lg:col-span-1">
            {channels.map((c) => (
              <a key={c.label} href={`mailto:${c.value}`} className="card card-hover flex items-center gap-3 p-4 transition-all duration-300">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{c.label}</p>
                  <p className="truncate text-sm text-ink-500 dark:text-ink-400">{c.value}</p>
                </div>
              </a>
            ))}

            {/* Business hours */}
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-semibold text-ink-900 dark:text-ink-100">{t("contact.hours")}</h3>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-ink-500 dark:text-ink-400">{t("contact.hours.days")}</span><span className="text-ink-700 dark:text-ink-300">{SITE_CONFIG.businessHours.days}</span></div>
                <div className="flex justify-between"><span className="text-ink-500 dark:text-ink-400">{t("contact.hours.time")}</span><span className="text-ink-700 dark:text-ink-300">{SITE_CONFIG.businessHours.hours}</span></div>
                <div className="flex justify-between"><span className="text-ink-500 dark:text-ink-400">{t("contact.hours.tz")}</span><span className="text-ink-700 dark:text-ink-300">{SITE_CONFIG.businessHours.timezone}</span></div>
              </div>
              <div className="mt-3 border-t border-ink-100 pt-3 dark:border-ink-800">
                <p className="flex items-center gap-1.5 text-xs text-success-700 dark:text-success-600"><ShieldCheck className="h-3.5 w-3.5" />{t("contact.responseTime")}: {SITE_CONFIG.responseTime}</p>
              </div>
            </div>

            {/* Address */}
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-semibold text-ink-900 dark:text-ink-100">{t("contact.address")}</h3>
              </div>
              <p className="mt-3 text-sm text-ink-600 dark:text-ink-400">{SITE_CONFIG.address.full}</p>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{SITE_CONFIG.phone}</p>
            </div>

            {/* FAQ link */}
            <Link to="/blog" className="card card-hover flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <ChevronDown className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span className="text-sm font-medium text-ink-900 dark:text-ink-100">{t("contact.faqLink")}</span>
              </div>
              <span className="text-xs text-brand-600 dark:text-brand-400">{t("common.readMore")}</span>
            </Link>
          </div>

          {/* Form + map */}
          <div className="lg:col-span-2">
            {status === "success" ? (
              <div className="card flex flex-col items-center justify-center p-12 text-center animate-scale-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-700/20">
                  <CheckCircle2 className="h-8 w-8 text-success-700 dark:text-success-600" />
                </div>
                <p className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-100">{t("contact.success")}</p>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("contact.successDesc")}</p>
                <button onClick={() => { setStatus("idle"); setName(""); setEmail(""); setSubject(""); setMessage(""); }} className="btn-secondary mt-6 btn-sm">
                  {t("contact.sendAnother")}
                </button>
              </div>
            ) : status === "error" ? (
              <div className="card flex flex-col items-center justify-center p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 dark:bg-danger/15">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
                <p className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-100">{t("contact.errorTitle")}</p>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("contact.error.generic")}</p>
                <button onClick={() => setStatus("idle")} className="btn-secondary mt-6 btn-sm">{t("common.retry")}</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="card space-y-4 p-6">
                {/* Spam protection honeypot */}
                <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">{t("contact.name")} <span className="text-danger">*</span></label>
                    <input
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                      className={cn("input", errors.name && "border-danger focus:border-danger")}
                      placeholder={t("contact.namePlaceholder")}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="label">{t("contact.email")} <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                      className={cn("input", errors.email && "border-danger focus:border-danger")}
                      placeholder="you@example.com"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">{t("contact.subject")} <span className="text-danger">*</span></label>
                  <input
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value); if (errors.subject) setErrors({ ...errors, subject: undefined }); }}
                    className={cn("input", errors.subject && "border-danger focus:border-danger")}
                    placeholder={t("contact.subjectPlaceholder")}
                    aria-invalid={!!errors.subject}
                  />
                  {errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject}</p>}
                </div>
                <div>
                  <label className="label">{t("contact.message")} <span className="text-danger">*</span></label>
                  <textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors({ ...errors, message: undefined }); }}
                    className={cn("input min-h-[160px] resize-y", errors.message && "border-danger focus:border-danger")}
                    placeholder={t("contact.messagePlaceholder")}
                    aria-invalid={!!errors.message}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    {errors.message ? <p className="text-xs text-danger">{errors.message}</p> : <span />}
                    <span className={cn("text-xs", message.length < 10 ? "text-ink-400" : "text-success-700 dark:text-success-600")}>{message.length} / 2000</span>
                  </div>
                </div>

                {/* Spam protection note */}
                <p className="flex items-center gap-1.5 rounded-lg bg-ink-50 p-3 text-xs text-ink-400 dark:bg-ink-800/50 dark:text-ink-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t("contact.spamNote")}
                </p>

                <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
                  {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t("contact.send")}
                </button>
              </form>
            )}

            {/* Google Maps placeholder */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
              <iframe
                title="Map"
                src={mapsSrc}
                width="100%"
                height="240"
                loading="lazy"
                style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale-[0.2] dark:grayscale dark:invert-[0.9] dark:hue-rotate-180"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
