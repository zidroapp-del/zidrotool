import { useCallback, useEffect, useMemo, useState } from "react";
import { AdSlot } from "@/components/AdSlot";
import { Seo } from "@/components/Seo";
import { Copy, Inbox, Mail, RefreshCw, ShieldCheck, Trash2, Clock3, ChevronRight } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/Toast";

const TTL = 10 * 60 * 1000;

type MailItem = {
  id: string;
  from: string;
  subject: string;
  date: string;
  intro?: string;
};

type MailDetail = MailItem & { text?: string; htmlBody?: string };

type Session = {
  address: string;
  login: string;
  domain: string;
  createdAt: number;
  token: string;
  provider?: string;
};

function remaining(createdAt: number) {
  return Math.max(0, TTL - (Date.now() - createdAt));
}

function formatTime(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function TemporaryEmail() {
  const { success, error } = useToast();
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = localStorage.getItem("zidro_temp_mail_session");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Session;
      return parsed.token && remaining(parsed.createdAt) > 0 ? parsed : null;
    } catch { return null; }
  });
  const [left, setLeft] = useState(() => session ? remaining(session.createdAt) : 0);
  const [messages, setMessages] = useState<MailItem[]>([]);
  const [selected, setSelected] = useState<MailDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);

  const expired = !!session && left <= 0;

  const createMailbox = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    setMessages([]);
    try {
      const res = await fetch("/api/tempmail?action=create", { headers: { accept: "application/json" } });
      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch {
        throw new Error(contentType.includes("application/json") ? "Temporary email service returned invalid JSON." : "The local temporary-email API is not available. Make sure `npm run dev` is running.");
      }
      if (!res.ok || !data.address) throw new Error(data?.error || "Unable to create a temporary email.");
      const next: Session = { ...data, createdAt: Date.now() };
      localStorage.setItem("zidro_temp_mail_session", JSON.stringify(next));
      setSession(next);
      setLeft(TTL);
      success("Temporary email created");
    } catch (e) {
      error(e instanceof Error ? e.message : "Could not create the mailbox.");
    } finally { setLoading(false); }
  }, [error, success]);

  const refreshInbox = useCallback(async () => {
    if (!session || remaining(session.createdAt) <= 0) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "list", token: session.token });
      const res = await fetch(`/api/tempmail?${params}`, { headers: { accept: "application/json" } });
      const raw = await res.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch { throw new Error("The local temporary-email API is not available. Make sure `npm run dev` is running."); }
      if (!res.ok) throw new Error(data?.error || "Unable to refresh the inbox.");
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (e) {
      error(e instanceof Error ? e.message : "Unable to refresh the inbox.");
    } finally { setLoading(false); }
  }, [error, session]);

  const openMessage = async (id: string) => {
    if (!session || remaining(session.createdAt) <= 0) return;
    setLoadingMessage(true);
    try {
      const params = new URLSearchParams({ action: "read", token: session.token, id: String(id) });
      const res = await fetch(`/api/tempmail?${params}`, { headers: { accept: "application/json" } });
      const raw = await res.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch { throw new Error("The local temporary-email API is not available. Make sure `npm run dev` is running."); }
      if (!res.ok) throw new Error(data?.error || "Unable to open the message.");
      setSelected(data.message);
    } catch (e) {
      error(e instanceof Error ? e.message : "Unable to open the message.");
    } finally { setLoadingMessage(false); }
  };

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      const next = remaining(session.createdAt);
      setLeft(next);
      if (next <= 0) {
        localStorage.removeItem("zidro_temp_mail_session");
        setMessages([]);
        setSelected(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!session || expired) return;
    refreshInbox();
    const poll = window.setInterval(refreshInbox, 8000);
    return () => window.clearInterval(poll);
  }, [session, expired, refreshInbox]);

  const progress = useMemo(() => Math.max(0, Math.min(100, (left / TTL) * 100)), [left]);

  const copyAddress = async () => {
    if (!session) return;
    const ok = await copyToClipboard(session.address);
    if (ok) success("Email address copied");
  };

  const reset = () => {
    localStorage.removeItem("zidro_temp_mail_session");
    setSession(null); setMessages([]); setSelected(null); setLeft(0);
  };

  return (
    <>
      <Seo
        title="10 Minute Mail — Free Temporary Email | ZidroTool"
        description="Create a free temporary email address that lasts 10 minutes. Receive verification emails in a disposable inbox without using your personal email."
      />
      <div className="container-page py-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-brand-200/70 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 p-6 text-white shadow-xl shadow-brand-500/20 sm:p-10">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                <ShieldCheck className="h-4 w-4" /> Privacy-first disposable inbox
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">10 Minute Mail</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">Create a disposable email in seconds, receive messages in a temporary inbox, and let the session expire automatically after 10 minutes.</p>
            </div>
          </div>

          <div className="my-6"><AdSlot variant="header" /></div>

          {!session || expired ? (
            <div className="card overflow-hidden p-6 sm:p-8">
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-accent-100 text-brand-600 dark:from-brand-950/50 dark:to-accent-950/50 dark:text-brand-300">
                  <Mail className="h-10 w-10" />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-ink-900 dark:text-white">Your temporary inbox is ready</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-ink-500 dark:text-ink-400">No signup required. Your generated address is intended for short-lived messages and expires after 10 minutes.</p>
                <button onClick={createMailbox} disabled={loading} className="btn-primary btn-lg mt-6 w-full sm:w-auto sm:min-w-64">
                  <Mail className="h-5 w-5" /> {loading ? "Creating inbox…" : expired ? "Create a new email" : "Create temporary email"}
                </button>
                <div className="mt-5 grid gap-3 text-left sm:grid-cols-3">
                  {[[Clock3, "10 minutes", "Automatic expiry"], [Inbox, "Live inbox", "Checks for new mail"], [ShieldCheck, "No account", "No signup needed"]].map(([Icon, title, desc]) => {
                    const I = Icon as typeof Clock3;
                    return <div key={String(title)} className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-800/60"><I className="h-5 w-5 text-brand-600 dark:text-brand-400"/><p className="mt-2 text-sm font-semibold text-ink-900 dark:text-white">{String(title)}</p><p className="text-xs text-ink-500 dark:text-ink-400">{String(desc)}</p></div>;
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <section className="card overflow-hidden">
                <div className="border-b border-ink-200/70 bg-ink-50/70 p-4 dark:border-ink-800 dark:bg-ink-900/70 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Temporary address</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="break-all text-base font-bold text-ink-900 dark:text-white">{session.address}</span>
                        <button onClick={copyAddress} className="btn-ghost btn-sm shrink-0" aria-label="Copy email"><Copy className="h-4 w-4"/></button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 dark:border-brand-800 dark:bg-brand-950/30">
                      <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300"><Clock3 className="h-4 w-4"/><span className="font-mono text-lg font-bold">{formatTime(left)}</span></div>
                      <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-brand-200 dark:bg-brand-900"><div className="h-full rounded-full bg-brand-500 transition-all" style={{width:`${progress}%`}}/></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-ink-200/70 px-4 py-3 dark:border-ink-800 sm:px-5">
                  <div className="flex items-center gap-2"><Inbox className="h-4 w-4 text-brand-600"/><span className="text-sm font-semibold text-ink-900 dark:text-white">Inbox</span><span className="badge-neutral">{messages.length}</span></div>
                  <button onClick={refreshInbox} disabled={loading} className="btn-ghost btn-sm"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}/>Refresh</button>
                </div>
                {selected ? (
                  <div className="p-5 sm:p-6">
                    <button onClick={() => setSelected(null)} className="btn-ghost btn-sm mb-4"><ChevronRight className="h-4 w-4 rotate-180"/>Back to inbox</button>
                    <div className="rounded-2xl border border-ink-200 p-5 dark:border-ink-700">
                      <p className="text-xs text-ink-500">From</p><p className="mt-1 font-medium text-ink-900 dark:text-white">{selected.from}</p>
                      <h2 className="mt-5 text-xl font-bold text-ink-900 dark:text-white">{selected.subject || "(No subject)"}</h2>
                      <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-ink-700 dark:text-ink-300">{selected.text || selected.intro || "No text content available."}</div>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-10 text-center sm:p-16"><Inbox className="mx-auto h-10 w-10 text-ink-300 dark:text-ink-600"/><h2 className="mt-4 font-semibold text-ink-900 dark:text-white">Your inbox is empty</h2><p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Waiting for a new message… The inbox checks automatically.</p></div>
                ) : (
                  <div className="divide-y divide-ink-100 dark:divide-ink-800">
                    {messages.map((m) => <button key={m.id} onClick={() => openMessage(m.id)} className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-ink-50 dark:hover:bg-ink-800/50"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300"><Mail className="h-5 w-5"/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{m.subject || "(No subject)"}</p><p className="mt-0.5 truncate text-xs text-ink-500">{m.from}</p><p className="mt-1 truncate text-xs text-ink-400">{m.intro}</p></div><span className="shrink-0 text-xs text-ink-400">{m.date}</span></button>)}
                  </div>
                )}
              </section>
              <aside className="space-y-6">
                <AdSlot variant="sidebar" />
                <div className="card p-5"><h3 className="font-bold text-ink-900 dark:text-white">Session controls</h3><p className="mt-2 text-xs leading-5 text-ink-500 dark:text-ink-400">This inbox is temporary. When the 10-minute timer reaches zero, the address is removed from this browser and the inbox stops polling.</p><button onClick={reset} className="btn-secondary mt-4 w-full"><Trash2 className="h-4 w-4"/>Discard inbox</button></div>
              </aside>
            </div>
          )}

          <div className="my-8"><AdSlot variant="inline" /></div>

          <section className="card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-white">How to use 10 Minute Mail</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {["Create a temporary address", "Copy it to the website that needs an email", "Wait for the message and open it from your inbox"].map((text, i) => <div key={text} className="rounded-2xl bg-ink-50 p-5 dark:bg-ink-800/60"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-black text-white">{i+1}</div><p className="mt-4 text-sm font-semibold text-ink-900 dark:text-white">{text}</p></div>)}
            </div>
            <div className="mt-6 rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900 dark:border-warning-900/60 dark:bg-warning-950/30 dark:text-warning-200"><strong>Important:</strong> Temporary email is not suitable for banking, password recovery, important personal accounts, or messages you need to keep permanently.</div>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="card p-6"><h2 className="text-lg font-bold text-ink-900 dark:text-white">Is this email permanent?</h2><p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">No. ZidroTool limits each browser session to 10 minutes. Once the timer ends, the interface stops checking the inbox and removes the saved session from your browser.</p></div>
            <div className="card p-6"><h2 className="text-lg font-bold text-ink-900 dark:text-white">Do I need to register?</h2><p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">No account is required for the free 10-minute mailbox. Use it only for short-lived, non-sensitive messages.</p></div>
          </section>
        </div>
      </div>
    </>
  );
}
