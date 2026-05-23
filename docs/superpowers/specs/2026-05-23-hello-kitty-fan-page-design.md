# Hello Kitty Fan Page — Design Spec

**Date:** 2026-05-23  
**Goal:** Build a Hello Kitty fan page to test the full dev stack (Next.js → Gemini API → Vercel).

---

## Sections

1. **Navbar** — sticky, pink background, links to each section
2. **Hero** — gradient background (pink to blush), large bow emoji, name, tagline, "Fan Made with Love" badge
3. **About** — short paragraph bio of Hello Kitty (birthdate, hometown, personality)
4. **Gallery** — 4 AI-generated images via Gemini, Hello Kitty around the world
5. **Fun Facts** — 3–5 emoji-prefixed facts
6. **Favourite Things** — pill-style tags (apple pie, music, cookies, stars, drawing)
7. **Footer** — "Made with 🎀 & Gemini AI · Not affiliated with Sanrio"

---

## Visual Design

- **Palette:** Classic Kitty — `#ff9ebc` (primary pink), `#ffcce0` (blush), `#fff0f5` (background), `#c9184a` (accent red), white
- **Typography:** System sans-serif, bold section labels in uppercase pink
- **Section dividers:** 3px solid `#ffcce0` borders between sections
- **Gallery grid:** 2×2 on mobile, 4×1 on desktop

---

## Architecture

### Pages
- `src/app/page.tsx` — main fan page (replaces default Next.js boilerplate)

### API Route
- `src/app/api/generate-images/route.ts` — server-side route that calls Gemini to generate 4 images
  - Uses `GOOGLE_AI_STUDIO_API_KEY` from env (server-only, never exposed to browser)
  - Calls Gemini image generation with 4 prompts (one per city)
  - Returns JSON array of base64-encoded images

### Components
- `src/components/Navbar.tsx`
- `src/components/Hero.tsx`
- `src/components/About.tsx`
- `src/components/Gallery.tsx` — fetches `/api/generate-images` on mount, shows loading skeletons while generating
- `src/components/FunFacts.tsx`
- `src/components/Favourites.tsx`
- `src/components/Footer.tsx`

---

## Image Generation

**Model:** `gemini-2.0-flash-exp` (supports image generation output)  
**Package:** `@google/generative-ai`

**Prompts:**
- `"Hello Kitty standing in front of the Eiffel Tower in Paris, kawaii style, soft pink pastel colours, cute illustration"`
- `"Hello Kitty visiting a traditional Japanese temple in Tokyo, kawaii style, soft pink pastel colours, cute illustration"`
- `"Hello Kitty in front of the Statue of Liberty in New York, kawaii style, soft pink pastel colours, cute illustration"`
- `"Hello Kitty standing outside Buckingham Palace in London, kawaii style, soft pink pastel colours, cute illustration"`

---

## Data Flow

```
Browser → GET /api/generate-images
       → Gemini API (server-side, using GOOGLE_AI_STUDIO_API_KEY)
       → returns 4 base64 images
       → Gallery component renders <img src="data:image/png;base64,...">
```

---

## Error Handling

- Gallery shows pink loading skeletons while images generate
- If Gemini call fails, show a fallback message: "Images couldn't load — try refreshing"
- API route returns 500 with error message on failure

---

## Out of Scope

- User accounts / Supabase (not needed for this test page)
- Animations beyond Tailwind transitions
- Mobile nav hamburger menu
