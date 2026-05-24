# Hero Background Image — Design

**Date:** 2026-05-24
**Status:** Approved
**Related:** [2026-05-24-static-gallery-images-design.md](./2026-05-24-static-gallery-images-design.md) — established the static-image pattern this spec reuses.

## Problem

The Hero section is plain text on a pink gradient with a bow emoji. It feels empty next to the rest of the page, especially the gallery, which is visually rich.

## Goal

Replace the pink gradient with a static, AI-generated background image of Hello Kitty's bedroom/world. Keep the existing text (title, tagline, badge) readable on top via a tinted overlay.

## Approach

Generate a single hero PNG once using Gemini, commit it to `public/hero/`, and rewrite `Hero.tsx` to use `next/image` with `fill` as a background layer, with a semi-transparent pink overlay for text contrast. Same pattern as the gallery refactor.

## Components

### 1. Generator script — `scripts/generate-hero-image.mjs`

- Mirrors the structure of `scripts/generate-gallery-images.mjs` but generates a single image instead of looping over cities
- Calls `gemini-2.5-flash-image` with this prompt: `"Hello Kitty's pink bedroom interior, kawaii style, soft pink pastel colours, cute illustration, wide cozy scene with cute details, bed with pink covers, stuffed animals, hearts and bows on the walls, centered composition"`
- Reads `GOOGLE_AI_STUDIO_API_KEY` from `.env.local` via `process.loadEnvFile`
- Writes the result as `public/hero/bedroom.png`
- Runs via `node scripts/generate-hero-image.mjs` from repo root

### 2. Hero component rewrite — `src/components/Hero.tsx`

- Stays a server component (no `"use client"`)
- Section becomes `relative` with `min-h-[500px] sm:min-h-[600px]` and `overflow-hidden`
- Background layer: `<Image src="/hero/bedroom.png" fill alt="" priority className="object-cover" />` — empty `alt` because the image is decorative; the heading conveys the meaning
- Overlay layer: a `div` with `absolute inset-0 bg-gradient-to-b from-kitty-pink/40 via-kitty-pink/30 to-kitty-blush/70` so the bottom (where text sits) has more contrast than the top
- Content layer: existing `<div className="mx-auto max-w-3xl">` block, but inside a `relative z-10` wrapper that ensures it sits above the overlay
- Text gets `drop-shadow-md` on the heading and `drop-shadow-sm` on the tagline for legibility
- The bow emoji `🎀` is REMOVED — the background image is doing the kawaii work; the emoji would compete

### 3. Background gradient — REMOVED

- The `bg-gradient-to-b from-kitty-pink to-kitty-blush` classes on the section are removed; the background image replaces them.

## Files touched

| Action | Path |
|--------|------|
| Create | `scripts/generate-hero-image.mjs` |
| Create | `public/hero/bedroom.png` |
| Modify | `src/components/Hero.tsx` |

## Data flow

**Before:** Browser → Hero section with gradient CSS background + text + emoji

**After:** Browser → Hero section with `<Image>` background → Next.js image optimizer serves WebP/AVIF → overlay div + text on top

## Testing

Visual verification only:
- Generated image looks like a recognizable Hello Kitty bedroom in the kawaii pastel style
- Title "Hello Kitty", tagline, and "Fan Made with Love" badge are all readable against the image
- Layout doesn't break on mobile (image still covers the section, text still readable)
- Image loads quickly (it's the first thing visible — `priority` is set)

## Risks and edge cases

- **Text readability:** If the generated image is too busy or too light/dark in the bottom region, the overlay strength may need tweaking — bump the `to-kitty-blush/70` higher (e.g. `/85` or `/95`) until the text reads. If even at maximum overlay opacity the text is still hard to read, switch the text colour from `text-kitty-red` to `text-kitty-white` for stronger contrast — but try the red text first to keep the brand consistent.
- **Gemini variation:** Each generation produces different art. If the first run looks off (wrong style, distorted Hello Kitty, weird artifacts), re-run the script. The committed PNG is the canonical version.
- **Aspect ratio:** Gemini outputs 1024×1024. On widescreen displays the top/bottom gets cropped by `object-cover`. The prompt asks for "centered composition" to keep the focal point in the middle.
- **Mobile cropping:** On phones, the image is tall-and-narrow due to `object-cover` — sides get cropped. As long as the focal point is roughly centered, this works.
- **Next.js version constraint:** Per project `AGENTS.md`, this Next.js install has breaking changes from training data. The implementation step must consult `node_modules/next/dist/docs/` for the current `<Image fill />` API and the deprecation status of `priority` before writing the Hero rewrite. The gallery rewrite already confirmed `priority` is deprecated in favor of `preload` in v16 — use `preload` if confirmed for `fill` images too.

## Out of scope

- Animations or parallax on the hero image
- Multiple hero variants (A/B testing different images)
- A CTA button in the hero (no behavior change requested)
- Making `Hero.tsx` accept props — it stays a fixed-content component
