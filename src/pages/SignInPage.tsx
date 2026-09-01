import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, User, Github, Chrome, Loader2, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { Seo } from "@/components/Seo";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const { t } = useTranslation();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithGithub } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const disabled = !isSupabaseConfigured || loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setError("");
    setLoading(true);
    try {
      const result = mode === "signin"
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password, name.trim());
      if (result.error) {
        setError(result.error);
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError(t("auth.providerError"));
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: "google" | "github") => {
    if (!isSupabaseConfigured || loading) return;
    setError("");
    setLoading(true);
    try {
      const result = provider === "google" ? await signInWithGoogle() : await signInWithGithub();
      if (result.error) setError(result.error);
    } catch {
      setError(t("auth.providerError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title={t("auth.signin.title")} description={t("auth.signin.subtitle")} noIndex />
      <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/20">
              <Zap className="h-7 w-7" fill="currentColor" />
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">
              {mode === "signin" ? t("auth.signin.title") : t("auth.signup.title")}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500 dark:text-ink-400">
              {mode === "signin" ? t("auth.signin.subtitle") : t("auth.signup.subtitle")}
            </p>
          </div>

          <div className="card p-6 sm:p-8">
            {!isSupabaseConfigured && (
              <div className="mb-5 flex gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">{t("auth.unavailable")}</p>
                  <p className="mt-1 text-xs leading-5 opacity-85">{t("auth.setupHint")}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button type="button" disabled={disabled} onClick={() => oauth("google")} className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
                {t("auth.google")}
              </button>
              <button type="button" disabled={disabled} onClick={() => oauth("github")} className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                {t("auth.github")}
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
              <span className="text-xs font-medium text-ink-400">{t("auth.or")}</span>
              <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="label">{t("auth.name")}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input pl-10" placeholder="Jane Doe" autoComplete="name" disabled={disabled} />
                  </div>
                </div>
              )}
              <div>
                <label className="label">{t("auth.email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" autoComplete="email" disabled={disabled} />
                </div>
              </div>
              <div>
                <label className="label">{t("auth.password")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="••••••••" autoComplete={mode === "signin" ? "current-password" : "new-password"} disabled={disabled} />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-50 px-3 py-2 text-sm text-danger dark:bg-danger/10">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={disabled} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? t("auth.emailBtn") : t("auth.signup.emailBtn")}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-ink-500 dark:text-ink-400">
              {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")} {" "}
              <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                {mode === "signin" ? t("auth.signup.link") : t("auth.signin.link")}
              </button>
            </p>
            <p className="mt-3 text-center text-xs leading-5 text-ink-400 dark:text-ink-500">{t("auth.optional")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
