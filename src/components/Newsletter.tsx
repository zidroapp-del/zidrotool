import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Mail, CheckCircle2, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

const SUBSCRIBED_KEY = "zidrotool-newsletter-subscribed";
const SESSION_KEY = "zidrotool-newsletter-session";

function isAlreadySubscribedInSession(email: string): boolean {
  try {
    const list: string[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    return list.some((e) => e.toLowerCase() === email.toLowerCase());
  } catch {
    return false;
  }
}

function addToSession(email: string) {
  try {
    const list: string[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    list.push(email);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
  } catch { /* noop */ }
}

export function Newsletter({ variant = "section" }: { variant?: "section" | "compact" }) {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const alreadySubscribed = typeof window !== "undefined" && localStorage.getItem(SUBSCRIBED_KEY) === "true";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg(t("newsletter.error.empty"));
      setStatus("error");
      error(t("newsletter.error.empty"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg(t("newsletter.error.invalid"));
      setStatus("error");
      error(t("newsletter.error.invalid"));
      return;
    }
    if (isAlreadySubscribedInSession(email)) {
      setErrorMsg(t("newsletter.error.duplicate"));
      setStatus("error");
      error(t("newsletter.error.duplicate"));
      return;
    }

    setStatus("loading");
    setTimeout(() => {
      if (Math.random() > 0.97) {
        setStatus("error");
        setErrorMsg(t("newsletter.error.generic"));
        error(t("newsletter.error.generic"));
      } else {
        setStatus("success");
        addToSession(email);
        try { localStorage.setItem(SUBSCRIBED_KEY, "true"); } catch { /* noop */ }
        success(t("newsletter.success"));
      }
    }, 900);
  };

  const reset = () => {
    setEmail("");
    setStatus("idle");
    setErrorMsg("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (variant === "compact") {
    if (status === "success" || alreadySubscribed) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-50 px-3 py-2 text-sm text-success-700 dark:bg-success-700/20 dark:text-success-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("newsletter.subscribed")}</span>
        </div>
      );
    }
    return (
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
            placeholder={t("newsletter.placeholder")}
            className={cn("input flex-1", status === "error" && "border-danger")}
            aria-label={t("newsletter.placeholder")}
            disabled={status === "loading"}
          />
          <button type="submit" className="btn-primary btn-sm shrink-0" disabled={status === "loading"}>
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("newsletter.button")}
          </button>
        </div>
        {status === "error" && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-danger animate-slide-down">
            <AlertCircle className="h-3 w-3" />
            {errorMsg}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink-200/70 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-8 dark:border-ink-800 dark:from-ink-900 dark:via-ink-900 dark:to-ink-900 sm:p-12">
      <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-xl text-center">
        <div className={cn(
          "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-all duration-500",
          status === "success" ? "bg-success-600 scale-110 animate-bounce-once" : "bg-brand-600 shadow-brand-600/20",
        )}>
          {status === "success" ? <CheckCircle2 className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
        </div>
        <h2 className="mt-5 text-2xl font-bold text-ink-900 dark:text-ink-100">{t("section.newsletter")}</h2>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("section.newsletter.sub")}</p>

        {status === "success" || alreadySubscribed ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success-50 py-6 animate-scale-in dark:bg-success-700/20">
            <CheckCircle2 className="h-8 w-8 text-success-700 dark:text-success-600 animate-bounce-once" />
            <div>
              <p className="font-semibold text-success-700 dark:text-success-600">{t("newsletter.success")}</p>
              <p className="mt-1 text-sm text-success-600/80 dark:text-success-500/80">{t("newsletter.successDesc")}</p>
            </div>
            <button onClick={reset} className="text-xs font-medium text-success-700 underline dark:text-success-600">{t("newsletter.subscribeAnother")}</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mx-auto mt-6 max-w-md">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                placeholder={t("newsletter.placeholder")}
                className={cn("input flex-1", status === "error" && "border-danger animate-shake")}
                aria-label={t("newsletter.placeholder")}
                aria-invalid={status === "error"}
              />
              <button type="submit" className="btn-primary shrink-0 transition-transform active:scale-95" disabled={status === "loading"}>
                {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {t("newsletter.button")}
              </button>
            </div>
            {status === "error" && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-danger animate-slide-down">
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </p>
            )}
            <p className="mt-3 text-xs text-ink-400 dark:text-ink-500">{t("newsletter.privacy")}</p>
          </form>
        )}
      </div>
    </div>
  );
}
