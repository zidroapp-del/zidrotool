# ZidroTool 2.5.6 — Ads Cleanup & AdSense Integration

## Removed

- Deleted `src/components/AdInterstitial.tsx` — the modal that opened 9 seconds
  after page load and its usage in `App.tsx` (`VITE_ADS_ENABLED` gate removed).
- Deleted `src/components/DownloadAdGate.tsx` — an unused pre-download ad gate
  (it was never imported anywhere, so this is dead-code removal with no
  behavior change elsewhere).

## Ads: AdSense only

The project previously had **no real ad network integrated at all** —
`AdSlot` was a static placeholder box ("Ad" / "Sponsored Content") that
always rendered, everywhere, regardless of whether any ad provider was
configured.

- Added `src/lib/adsense.ts`: reads a publisher client id
  (`VITE_ADSENSE_CLIENT_ID`) and one slot id per placement
  (`VITE_ADSENSE_SLOT_HEADER` / `_SIDEBAR` / `_INLINE` / `_FOOTER`), injects
  the AdSense loader script at most once, and requests an impression per
  mounted ad unit.
- Rewrote `src/components/AdSlot.tsx` to render a real
  `<ins class="adsbygoogle">` unit when — and only when — both the client id
  and that placement's slot id are configured. **Otherwise it renders
  nothing** — no box, no border, no "Ad" label, no reserved space.
- Added `.env.example` documenting the five new variables and typed them in
  `src/vite-env.d.ts`.

To turn ads on in production, set the env vars in Vercel (Project Settings →
Environment Variables) and redeploy. Leaving them empty is a fully supported
state: the site simply shows no ads anywhere.

## Reviewed, no changes needed

- **Downloaders** (`api/video-download.js`, `api/youtube.js`,
  `src/tools/VideoDownloader.tsx`, `src/tools/YouTubeTools.tsx`): provider
  fallback chain (yt-dlp → Cobalt → Apify), URL validation, and error codes
  are sound. Front-end calls match the API routes.
- **Service worker** (`public/sw.js`): network-first for navigations,
  cache-first for static assets, old caches purged on activate. No issues.
- **Vercel Analytics**: correctly imported and gated behind cookie consent
  (`cookieConsent === "all"`) in `src/App.tsx`.
- **SEO** (`src/components/Seo.tsx`, `scripts/generate-sitemap.mjs`,
  `public/robots.txt`): canonical URLs, Open Graph/Twitter tags, JSON-LD
  (Organization + WebSite), sitemap generation, and disallow rules for
  private routes are all in place. Nothing was removed.

## Known pre-existing gap (not part of this pass)

Roughly 300 i18n keys used in the app (admin dashboard, billing, auth,
feedback, the premium/pricing page, blog empty states, the status page, and
a few others) are missing from `src/locales/en.ts` and even more so from
`fr/de/es/it/ar`. Because `fallbackLng` is `en`, missing keys fall back to a
humanized version of the key name (e.g. `admin.quickActions` →
"Quick Actions") rather than crashing, so this is not a build-breaking issue,
but it is a real translation gap that predates this fix. It's large enough
(five languages × ~300 strings) that it deserves its own pass rather than a
rushed batch here — flagging it so it isn't lost.

## Round 2 — error reporting, i18n hardcoding, and new tool pages

### `api/video-download.js` — stopped swallowing the real provider error
`callYtDlpExtract`, `callCobalt`, `callApify`, and `streamFromYtDlp` all
collapsed provider failures to a bare `null`/generic message, discarding the
Render service's specific `detail` and `X-ZidroTool-Error-Code` header (e.g.
the honest "YouTube is showing a bot-verification wall" message for
`YOUTUBE_BOT_CHECK`). Both the extraction and the download code paths now
track the most specific error seen across all providers and return it to the
frontend instead of a generic 502. `services/yt-dlp-api/app.py`'s extract
endpoint now also logs the `url` on failure, matching the download endpoint.

### `src/tools/VideoDownloader.tsx` — hardcoded English text
Found the exact pattern flagged as unacceptable: `"Supports TikTok and
YouTube videos."` was hardcoded directly in the component, along with several
validation messages and placeholders. Replaced all of it with
`tool.videoDownloader.*` i18n keys, and fixed the `youtube`/`instagram`/`x`/
default branches of `getToolTitle()`, which called `t()` for facebook/tiktok
but returned raw English strings for the other platforms. Also fixed
`detectPlatformFromUrl()`, which recognized `youtube.com`/`youtu.be` but not
`youtube-nocookie.com` — inconsistent with what `api/video-download.js` and
the Render service already allow.

### Locale files — English leaking into fr/de/es/it
While adding the new keys, found that every existing
`tool.videoDownloader.*` and `tool.facebook-video-downloader.*` /
`tool.tiktok-downloader.*` key in `fr.ts`, `de.ts`, `es.ts`, and `it.ts` was
still the literal English string (only `ar.ts` had real translations). Fixed
all of them and added proper translations for every new key, in all six
languages (en/fr/de/es/it/ar).

### New tool pages: YouTube and Instagram downloaders
`ToolPage.tsx` already had dormant slug-matching logic for
`youtube-video-downloader` and `instagram-video-downloader` (and
`VideoDownloader.tsx` already had title branches for them) — but no catalog
entry ever used those slugs, so the routes 404'd. Added both to
`src/data/catalog.ts` (category `video`, reusing the existing
`tools/VideoDownloader` component — no new bundle, no new dependency),
their `name`/`desc`/`seoTitle`/`seoDesc` keys in all six locales, a thumbnail
SVG for each in `public/tool-images/` (generated from the same template the
other 162 tool thumbnails use), and regenerated `public/sitemap.xml` via
`node scripts/generate-sitemap.mjs` (a dependency-free script) — diffed
against the previous sitemap to confirm only the two new URLs were added,
nothing else changed.

**Still not exposed as a page:** X/Twitter. The backend
(`api/video-download.js` and the Render service) already accepts
`x.com`/`twitter.com` URLs, and `ToolPage.tsx` has matching logic for
`twitter-video-downloader`/`x-video-downloader`, but no catalog entry uses
those slugs. Not added in this pass since a third new page wasn't
requested — say the word and it's the same three-line addition as the two
above.

## Build verification

This work was done in a sandboxed environment with no network egress, so
`npm ci` cannot reach the npm registry here (confirmed with several retries,
including `--offline`; same limitation noted in the project's own
`FIX-2.5.5.md` from an earlier pass). No `node_modules` exists in this zip.
**You must run the commands below before deploying** — nothing here
substitutes for a real build.

What was verified without a full install:

- **`node --check`** (Node's real parser, not a heuristic) on every edited
  `.js`/`.mjs` file: `api/video-download.js`, `api/youtube.js`,
  `api/tempmail.js`, `scripts/generate-sitemap.mjs` — all pass.
- **`tsc --noEmit`** (TypeScript 6.0.3, available in this sandbox outside the
  project) run directly against every edited `.ts`/`.tsx` file with matching
  compiler flags (`--jsx react-jsx --moduleResolution bundler
  --skipLibCheck`), filtering only the expected "cannot find module" noise
  from missing `node_modules` — zero real syntax/parse errors in
  `AdSlot.tsx`, `adsense.ts`, `App.tsx`, `vite-env.d.ts`, `ToolPage.tsx`,
  `VideoDownloader.tsx`, `catalog.ts`, `toolMeta.ts`, and all six
  `src/locales/*.ts` files.
- No dangling imports anywhere in `src/` (every relative and `@/` import
  resolves to a file that exists) — checked across the whole tree.
- No duplicate keys in any locale file.
- `scripts/generate-sitemap.mjs` actually executed successfully (it has no
  dependencies beyond Node's `fs`/`path`) and the resulting `sitemap.xml`
  was diffed against the previous version to confirm a clean, additive
  change.

**Still run this before deploying** — it's the only thing that catches type
errors against the real dependency graph (React types, `@vercel/analytics`,
etc.), which nothing above can check without `node_modules`:

```bash
npm ci
npm run check   # runs typecheck, then build
```
