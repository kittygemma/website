# Static Gallery Images — Design

**Date:** 2026-05-24
**Status:** Approved
**Supersedes:** Gemini-generated gallery from [2026-05-23-hello-kitty-fan-page-design.md](./2026-05-23-hello-kitty-fan-page-design.md)

## Problem

The `Gallery` component currently calls `/api/generate-images` on every mount, which triggers 4 fresh Gemini image generations per page load. In dev mode, React 19 Strict Mode doubles this to 8 calls per refresh. This burns API credits for content that never changes.

## Goal

Serve the 4 city images as static files, eliminating runtime API calls while preserving the existing kawaii Gemini-generated look.

## Approach

Generate the 4 images once via a one-shot script, commit the PNGs to `public/`, and rewrite `Gallery` as a static server component. Delete the now-unused API route.

## Components

### 1. Generator script — `scripts/generate-gallery-images.ts`

- Imports the same 4 city prompts that currently live in the API route
- Calls `gemini-2.5-flash-image` for each prompt (sequentially or in parallel — either works for 4 images)
- Decodes the base64 `inlineData.data` from each response and writes a PNG to `public/gallery/{slug}.png`
- Slug map: Paris→`paris`, Tokyo→`tokyo`, New York→`new-york`, London→`london`
- Reads `GOOGLE_AI_STUDIO_API_KEY` from `.env.local` (load via `dotenv` or Node's built-in `--env-file` flag)
- Runs via `npx tsx scripts/generate-gallery-images.ts` — no `package.json` script needed (one-off use)

### 2. Gallery component — `src/components/Gallery.tsx`

- Drop `"use client"` directive — becomes a server component
- Remove `useEffect`, `useState`, fetch logic, error state, skeleton loading
- Replace with a static const array: `const IMAGES = [{ city: "Paris", src: "/gallery/paris.png" }, ...]`
- Render with `next/image` `<Image />` for automatic WebP/AVIF conversion, lazy loading, and responsive sizing
- Keep existing Tailwind classes and layout exactly as-is — visual output should be identical

### 3. API route — DELETE

- Remove `src/app/api/generate-images/route.ts` entirely
- It's preserved in git history if ever needed again

## Files touched

| Action | Path |
|--------|------|
| Create | `scripts/generate-gallery-images.ts` |
| Create | `public/gallery/paris.png` |
| Create | `public/gallery/tokyo.png` |
| Create | `public/gallery/new-york.png` |
| Create | `public/gallery/london.png` |
| Modify | `src/components/Gallery.tsx` |
| Delete | `src/app/api/generate-images/route.ts` |

## Data flow

**Before:** Browser → Gallery (client) → `/api/generate-images` → Gemini API → base64 data URLs → render

**After:** Browser → Gallery (server) → `<Image src="/gallery/paris.png" />` → Next.js image optimizer → optimized WebP/AVIF

## Testing

- Visual verification only — load the page and confirm all 4 city images appear with the same layout as before
- Confirm no network request to `/api/generate-images` in DevTools Network tab
- Confirm `/api/generate-images` returns 404 after deletion

## Risks and edge cases

- **Gemini output variation:** Re-running the generator script produces different art each time. The committed PNGs are the canonical set. If you want a different look, re-run the script and commit the new files.
- **File size:** Gemini PNGs may be 1–3MB each. `next/image` will serve optimized WebP/AVIF variants automatically; the source PNGs only ship to the optimizer at build time, not to browsers.
- **Next.js version constraint:** Per project `AGENTS.md`, this Next.js install has breaking changes from training data. The implementation step must consult `node_modules/next/dist/docs/` for the current `<Image />` API before writing the Gallery rewrite.

## Out of scope

- Adding more cities or images (separate feature)
- Build-time generation (overkill for content that rarely changes)
- Image preprocessing pipeline (Next.js handles optimization)
