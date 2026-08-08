import { useState, useMemo } from "react";
import { Search, Copy, Check } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

const STATUS_CODES: { code: number; name: string; desc: string; category: "1xx" | "2xx" | "3xx" | "4xx" | "5xx" }[] = [
  { code: 100, name: "Continue", desc: "The server has received the request headers and the client should proceed to send the request body.", category: "1xx" },
  { code: 101, name: "Switching Protocols", desc: "The requester has asked the server to switch protocols and the server has agreed.", category: "1xx" },
  { code: 200, name: "OK", desc: "Standard response for successful HTTP requests.", category: "2xx" },
  { code: 201, name: "Created", desc: "The request has been fulfilled and a new resource has been created.", category: "2xx" },
  { code: 202, name: "Accepted", desc: "The request has been accepted for processing but not completed.", category: "2xx" },
  { code: 204, name: "No Content", desc: "The server processed the request successfully but is not returning any content.", category: "2xx" },
  { code: 206, name: "Partial Content", desc: "The server is delivering only part of the resource due to a range header.", category: "2xx" },
  { code: 301, name: "Moved Permanently", desc: "This and all future requests should be directed to the given URI.", category: "3xx" },
  { code: 302, name: "Found", desc: "The resource was found but temporarily under a different URI.", category: "3xx" },
  { code: 304, name: "Not Modified", desc: "The resource has not been modified since the last request.", category: "3xx" },
  { code: 307, name: "Temporary Redirect", desc: "The request should be repeated with another URI, but future requests should still use the original URI.", category: "3xx" },
  { code: 308, name: "Permanent Redirect", desc: "The request and all future requests should be repeated using another URI.", category: "3xx" },
  { code: 400, name: "Bad Request", desc: "The server cannot process the request due to a client error.", category: "4xx" },
  { code: 401, name: "Unauthorized", desc: "Authentication is required and has failed or not been provided.", category: "4xx" },
  { code: 403, name: "Forbidden", desc: "The server understood the request but refuses to authorize it.", category: "4xx" },
  { code: 404, name: "Not Found", desc: "The requested resource could not be found.", category: "4xx" },
  { code: 405, name: "Method Not Allowed", desc: "The request method is not supported for the requested resource.", category: "4xx" },
  { code: 408, name: "Request Timeout", desc: "The server timed out waiting for the request.", category: "4xx" },
  { code: 409, name: "Conflict", desc: "The request could not be processed because of conflict in the current state of the resource.", category: "4xx" },
  { code: 410, name: "Gone", desc: "The resource is no longer available and will not be available again.", category: "4xx" },
  { code: 418, name: "I'm a Teapot", desc: "The server cannot brew coffee because it is a teapot.", category: "4xx" },
  { code: 422, name: "Unprocessable Entity", desc: "The request was well-formed but unable to be followed due to semantic errors.", category: "4xx" },
  { code: 429, name: "Too Many Requests", desc: "The user has sent too many requests in a given amount of time.", category: "4xx" },
  { code: 500, name: "Internal Server Error", desc: "A generic error message for server errors.", category: "5xx" },
  { code: 501, name: "Not Implemented", desc: "The server does not recognize the request method.", category: "5xx" },
  { code: 502, name: "Bad Gateway", desc: "The server received an invalid response from an upstream server.", category: "5xx" },
  { code: 503, name: "Service Unavailable", desc: "The server is currently unavailable (overloaded or down).", category: "5xx" },
  { code: 504, name: "Gateway Timeout", desc: "The upstream server failed to send a request in time.", category: "5xx" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "1xx": "text-ink-500",
  "2xx": "text-success-700 dark:text-success-600",
  "3xx": "text-brand-600 dark:text-brand-400",
  "4xx": "text-warning-600",
  "5xx": "text-danger",
};

export default function HttpStatusCodes() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return STATUS_CODES;
    const q = search.toLowerCase();
    return STATUS_CODES.filter((s) => s.code.toString().includes(q) || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q));
  }, [search]);

  const handleCopy = async (code: number) => {
    const ok = await copyToClipboard(code.toString());
    if (ok) { setCopied(code); setTimeout(() => setCopied(null), 2000); }
  };

  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Search status codes..." />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((s) => (
          <div key={s.code} className="flex items-center gap-4 rounded-lg border border-ink-200 p-3 transition-colors hover:border-brand-300 dark:border-ink-700">
            <button onClick={() => handleCopy(s.code)} className={cn("flex h-12 w-16 shrink-0 items-center justify-center rounded-lg text-xl font-bold tabular-nums", copied === s.code ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-ink-800", CATEGORY_COLORS[s.category])}>
              {copied === s.code ? <Check className="h-5 w-5" /> : s.code}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{s.name}</p>
              <p className="text-xs text-ink-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No status codes found</p>}
    </div>
  );
}
