import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, User, Github, Chrome, Loader2, AlertCircle, Zap } from "lucide-react";
import { Seo } from "@/components/Seo";
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result =
      mode === "signin"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, name);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <Seo title={t("auth.signin.title")} noIndex />
      <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                <Zap className="h-6 w-6" fill="currentColor" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-ink-900 dark:text-ink-100">
                {mode === "signin" ? t("auth.signin.title") : t("auth.signup.title")}
              </h1>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                {mode === "signin" ? t("auth.signin.subtitle") : t("auth.signup.subtitle")}
              </p>
            </div>

            <div className="space-y-2">
              <button onClick={signInWithGoogle} className="btn-secondary w-full">
                <Chrome className="h-4 w-4" />
                {t("auth.google")}
              </button>
              <button onClick={signInWithGithub} className="btn-secondary w-full">
                <Github className="h-4 w-4" />
                {t("auth.github")}
              </button>
            </div>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
              <span className="text-xs text-ink-400">or</span>
              <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <div>
                  <label className="label">{t("auth.name")}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input pl-10" placeholder="Jane Doe" />
                  </div>
                </div>
              )}
              <div>
                <label className="label">{t("auth.email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="label">{t("auth.password")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="••••••••" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-50 px-3 py-2 text-sm text-danger dark:bg-danger/10">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.emailBtn")}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-ink-500 dark:text-ink-400">
              {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
              <button
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                {mode === "signin" ? t("auth.signup.link") : t("auth.signin.link")}
              </button>
            </p>
            <p className="mt-3 text-center text-xs text-ink-400 dark:text-ink-500">{t("auth.optional")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
