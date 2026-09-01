import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { parse as parseUrl } from "node:url";
import { readFile } from "node:fs/promises";

type VercelRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  send: (body: unknown) => VercelResponse;
};

function createApiResponse(res: ServerResponse): VercelResponse {
  const apiRes = Object.create(res) as VercelResponse;

  apiRes.status = (code: number) => {
    res.statusCode = code;
    return apiRes;
  };

  apiRes.setHeader = ((name: string, value: number | string | readonly string[]) => {
    res.setHeader(name, value);
    return apiRes;
  }) as typeof res.setHeader;

  apiRes.send = (body: unknown) => {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    res.end(typeof body === "string" ? body : JSON.stringify(body));
    return apiRes;
  };

  return apiRes;
}

async function readRequestBody(req: IncomingMessage): Promise<unknown> {
  if (req.method !== "POST") return undefined;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};

  const contentType = String(req.headers["content-type"] || "");
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("Invalid JSON request body.");
    }
  }

  return Object.fromEntries(new URLSearchParams(raw).entries());
}

// Vite does not execute Vercel-style /api/*.js functions during `vite`.
// This small adapter makes the same handlers work on localhost as well.
function apiDevMiddleware(server: ViteDevServer) {
  server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
    const pathname = parseUrl(req.url || "").pathname || "";
    const match = pathname.match(/^\/api\/([A-Za-z0-9_-]+)\/?$/);

    if (!match) {
      next();
      return;
    }

    try {
      const name = match[1];
      const modulePath = new URL(`./api/${name}.js`, import.meta.url);

      try {
        await readFile(modulePath);
      } catch {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: `API route not found: /api/${name}` }));
        return;
      }

      const mod = await import(/* @vite-ignore */ `${modulePath.href}?t=${Date.now()}`);
      const handler = mod.default;

      if (typeof handler !== "function") {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: `Invalid API handler: ${name}` }));
        return;
      }

      const parsed = parseUrl(req.url || "", true);
      const apiReq = Object.assign(req, {
        query: parsed.query as Record<string, string | string[] | undefined>,
        body: await readRequestBody(req),
      }) as VercelRequest;

      const apiRes = createApiResponse(res);
      await handler(apiReq, apiRes);
    } catch (error) {
      console.error("Local API error:", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({
          error: error instanceof Error ? error.message : "Local API request failed",
        }));
      }
    }
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-vercel-api",
      configureServer(server) {
        apiDevMiddleware(server);
      },
    },
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    target: "es2021",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "i18n-vendor": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
          "supabase-vendor": ["@supabase/supabase-js"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
