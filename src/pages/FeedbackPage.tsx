import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, Send, Bug, Lightbulb, MessageSquare, Star, Paperclip, AlertTriangle, ChevronDown } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

type FeedbackType = "bug" | "feature" | "general";
type Priority = "low" | "medium" | "high";

export default function FeedbackPage() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [type, setType] = useState<FeedbackType>("feature");
  const [priority, setPriority] = useState<Priority>("medium");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const types: { key: FeedbackType; icon: React.ComponentType<{ className?: string }>; labelKey: string; descKey: string }[] = [
    { key: "feature", icon: Lightbulb, labelKey: "feedback.feature", descKey: "feedback.feature.desc" },
    { key: "bug", icon: Bug, labelKey: "feedback.bug", descKey: "feedback.bug.desc" },
    { key: "general", icon: MessageSquare, labelKey: "feedback.general", descKey: "feedback.general.desc" },
  ];

  const priorities: { key: Priority; labelKey: string; color: string }[] = [
    { key: "low", labelKey: "feedback.priority.low", color: "badge-neutral" },
    { key: "medium", labelKey: "feedback.priority.medium", color: "badge-warning" },
    { key: "high", labelKey: "feedback.priority.high", color: "badge-danger" },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) {
      error(t("feedback.error.short"));
      return;
    }
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      success(t("feedback.success"));
    }, 1200);
  };

  const reset = () => {
    setStatus("idle");
    setMessage("");
    setSubject("");
    setRating(0);
    setPriority("medium");
    setType("feature");
  };

  return (
    <>
      <Seo title={t("feedback.title")} description={t("feedback.subtitle")} />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: t("footer.links.feedback") }]} />
        <div className="mx-auto mt-8 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{t("feedback.title")}</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("feedback.subtitle")}</p>

          {status === "success" ? (
            <div className="card mt-8 flex flex-col items-center p-12 text-center animate-scale-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-700/20">
                <CheckCircle2 className="h-8 w-8 text-success-700 dark:text-success-600" />
              </div>
              <p className="mt-4 font-semibold text-ink-900 dark:text-ink-100">{t("feedback.success")}</p>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("feedback.successDesc")}</p>
              <p className="mt-2 text-xs text-ink-400">{t("feedback.trackingId")}: FB-{Date.now().toString().slice(-6)}</p>
              <button onClick={reset} className="btn-secondary mt-6 btn-sm">{t("feedback.sendAnother")}</button>
            </div>
          ) : (
            <form onSubmit={submit} className="card mt-8 space-y-5 p-6">
              {/* Type selector */}
              <div>
                <label className="label">{t("feedback.type")}</label>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {types.map((tp) => (
                    <button
                      key={tp.key}
                      type="button"
                      onClick={() => setType(tp.key)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 active:scale-[0.97]",
                        type === tp.key
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                          : "border-ink-200 text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400 dark:hover:border-ink-600",
                      )}
                    >
                      <tp.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{t(tp.labelKey)}</span>
                      <span className="text-xs text-ink-400">{t(tp.descKey)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="label">{t("feedback.rating")}</label>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="rounded p-1 transition-transform active:scale-90"
                      aria-label={`${n} stars`}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition-colors",
                          (hoverRating || rating) >= n ? "fill-warning-500 text-warning-500" : "text-ink-300 dark:text-ink-600",
                        )}
                      />
                    </button>
                  ))}
                  {rating > 0 && <span className="ml-2 text-sm text-ink-500 dark:text-ink-400">{t(`feedback.ratingLabel.${rating}`)}</span>}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="label">{t("feedback.priority")}</label>
                <div className="mt-2 flex gap-2">
                  {priorities.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPriority(p.key)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                        priority === p.key
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                          : "border-ink-200 hover:border-ink-300 dark:border-ink-700",
                      )}
                    >
                      {p.key === "high" && <AlertTriangle className="h-3.5 w-3.5" />}
                      {t(p.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="label">{t("feedback.subject")}</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input"
                  placeholder={t("feedback.subjectPlaceholder")}
                />
              </div>

              {/* Message */}
              <div>
                <label className="label">{t("feedback.message")}</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input min-h-[160px] resize-y"
                  placeholder={t(type === "bug" ? "feedback.bugPlaceholder" : type === "feature" ? "feedback.featurePlaceholder" : "feedback.generalPlaceholder")}
                />
                <p className="mt-1 text-right text-xs text-ink-400">{message.length} / 2000</p>
              </div>

              {/* Attachment placeholder */}
              <div>
                <label className="label">{t("feedback.attachments")}</label>
                <div className="mt-2 flex items-center justify-center rounded-xl border-2 border-dashed border-ink-200 p-6 text-center transition-colors hover:border-brand-300 dark:border-ink-700 dark:hover:border-brand-700">
                  <div className="flex flex-col items-center gap-2">
                    <Paperclip className="h-6 w-6 text-ink-400" />
                    <p className="text-sm text-ink-500 dark:text-ink-400">{t("feedback.attachDesc")}</p>
                    <p className="text-xs text-ink-400">{t("feedback.attachFormats")}</p>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={status === "loading"} className="btn-primary w-full transition-transform active:scale-[0.98]">
                {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("feedback.send")}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
