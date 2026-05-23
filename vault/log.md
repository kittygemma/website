# Log

Append-only chronological record of wiki activity.

Format: `## [YYYY-MM-DD] type | description`

---

## [2026-05-23] init | Website project wiki created

Initialized vault with LLM Wiki pattern (Karpathy). Schema, index, and log created. Ready for first ingest.

## [2026-05-23] setup | GitHub + Vercel connected

Repo live at github.com/kittygemma/website. Vercel connected — every push to main auto-deploys.

## [2026-05-23] setup | Next.js + Supabase scaffolded

Next.js app created with TypeScript, Tailwind, and App Router. Supabase client set up for database, auth, and storage.

## [2026-05-23] design | Hello Kitty fan page spec approved

First project: Hello Kitty fan page to test the full stack. Design brainstormed and approved via visual companion.

**Decisions:**
- Full fan page: Navbar, Hero, About, Gallery, Fun Facts, Favourite Things, Footer
- Classic Kitty palette (soft pink, blush, white)
- Gallery: 4 Gemini AI-generated images of Hello Kitty around the world (Paris, Tokyo, New York, London)
- Image generation via Next.js API route using `gemini-2.0-flash-exp`

**Spec:** `docs/superpowers/specs/2026-05-23-hello-kitty-fan-page-design.md`

**Next session:** Run `superpowers:writing-plans` then implement.
