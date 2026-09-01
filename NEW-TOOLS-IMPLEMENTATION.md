# ZidroTool – New Tools Implementation

This build preserves the existing catalog, categories, routes, translations, authentication, SEO, ads, and existing tools.

## Added tools
- Facebook Video Downloader (`/tools/facebook-video-downloader`)
- TikTok Downloader (`/tools/tiktok-downloader`)
- Text to Handwriting Converter (`/tools/text-to-handwriting`)
- Fake WhatsApp Chat Generator (`/tools/fake-whatsapp-chat-generator`)
- PDF to JPG (`/tools/pdf-to-jpg`)
- JPG to PDF (`/tools/jpg-to-pdf`)
- Free Plagiarism Checker (`/tools/plagiarism-checker`)

## New categories
- Video Downloaders
- Viral Tools
- Files & SEO

The existing `category` field and category architecture were not removed or renamed.

## Cookie consent
The project already had a CookieConsent implementation and App integration. It was preserved rather than duplicated.

## Video API
`api/video-download.js` keeps provider access server-side. The optional `COBALT_API_URL` environment variable can override the resolver endpoint. No secret API key is placed in client code.

## Before deployment
Run locally:

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

If your video provider requires credentials or has changed its API contract, configure its server-side environment variables/API endpoint before production use.
