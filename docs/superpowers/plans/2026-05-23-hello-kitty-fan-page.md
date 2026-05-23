# Hello Kitty Fan Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Hello Kitty fan page in Next.js 16 (App Router) that fetches 4 AI-generated images from Gemini via a server-side route and deploys to Vercel.

**Architecture:** Server Components by default for static sections; one Client Component (`Gallery`) that fetches `/api/generate-images` on mount and renders 4 base64 images with loading skeletons + an error state. The API route holds the Gemini SDK call and the 4 city prompts inline — no extra `lib` module since the route is the only consumer (YAGNI). Brand colors live in `globals.css` under Tailwind v4's `@theme inline` block so they become utility classes (`bg-kitty-pink`, `text-kitty-red`, etc.).

**Tech Stack:** Next.js 16.2.6 (App Router, Route Handlers), React 19.2.4, Tailwind v4 (PostCSS), TypeScript, `@google/generative-ai` SDK targeting `gemini-2.0-flash-exp` with image-output modality.

**Testing strategy:** This is a visual fan page with one piece of real logic (the API route). Approach:
- **API route:** smoke test by curling the dev server and checking the JSON shape — fast, real, no test framework needed.
- **UI components:** manual browser verification (the dev server is the test harness). The `superpowers:verification-before-completion` skill applies — every UI task ends with "open browser, confirm it looks right."
- We **do not** add Jest/Vitest. The user is testing their dev stack on a small project; a unit test framework would be over-engineering (YAGNI).

**Out of scope (per spec):** Supabase, mobile hamburger nav, animations beyond Tailwind transitions, user accounts.

**Important Next.js 16 notes (this is NOT the Next.js in your training data):**
- Route Handlers live at `app/api/.../route.ts` with named HTTP exports (`export async function GET(req: NextRequest) { ... }`).
- `Response.json(...)` returns JSON; no `NextResponse.json` needed for simple cases.
- Route Handlers are **not cached by default** (good — Gemini calls should run fresh).
- Server Components are the default. Add `'use client'` only when you need state, effects, or browser APIs.
- Tailwind v4 uses `@import "tailwindcss"` in CSS and defines theme tokens in an `@theme inline` block — there is no `tailwind.config.js`.

**Environment:** `GOOGLE_AI_STUDIO_API_KEY` is already set in `~/projects/website/.env.local`. The dev server starts with `export PATH="/opt/homebrew/bin:$PATH" && cd ~/projects/website && npm run dev` (PATH export is required because Node lives in Homebrew).

---

## File Structure

**Create:**
- `src/app/api/generate-images/route.ts` — `GET` handler. Loads `GOOGLE_AI_STUDIO_API_KEY`, calls Gemini once per city prompt in parallel, returns `{ images: [{ city, dataUrl }] }`. Prompts inlined here.
- `src/components/Navbar.tsx` — sticky nav, server component, anchor links to each section.
- `src/components/Hero.tsx` — gradient hero, server component.
- `src/components/About.tsx` — bio paragraph, server component.
- `src/components/Gallery.tsx` — **client component**. Fetches the API route on mount; renders skeletons → images → error fallback.
- `src/components/FunFacts.tsx` — server component.
- `src/components/Favourites.tsx` — pill tags, server component.
- `src/components/Footer.tsx` — server component.

**Modify:**
- `src/app/page.tsx` — replace boilerplate with `<Navbar/><Hero/>...<Footer/>` composition.
- `src/app/layout.tsx` — update `metadata` (title, description), set body background to `bg-kitty-bg`.
- `src/app/globals.css` — add Hello Kitty color tokens to `@theme inline`; remove the Next.js boilerplate dark-mode block and font vars we won't use.
- `package.json` — add `@google/generative-ai` dependency.

---

### Task 1: Project setup — install Gemini SDK, add brand colors, update layout metadata

**Files:**
- Modify: `package.json` (via `npm install`)
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install the Gemini SDK**

```bash
export PATH="/opt/homebrew/bin:$PATH" && cd ~/projects/website && npm install @google/generative-ai
```

Expected: installs without errors; `package.json` now lists `@google/generative-ai` under `dependencies`. If npm warns about a newer `@google/genai` package, ignore — the spec pinned `@google/generative-ai`.

- [ ] **Step 2: Replace `src/app/globals.css` with Hello Kitty theme**

Overwrite the file with:

```css
@import "tailwindcss";

@theme inline {
  --color-kitty-pink: #ff9ebc;
  --color-kitty-blush: #ffcce0;
  --color-kitty-bg: #fff0f5;
  --color-kitty-red: #c9184a;
  --color-kitty-white: #ffffff;
}

body {
  background: var(--color-kitty-bg);
  color: #2a1a22;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}
```

Why these tokens: every color in `@theme inline` becomes a Tailwind utility (`bg-kitty-pink`, `text-kitty-red`, `border-kitty-blush`, etc.) automatically. No config file needed.

- [ ] **Step 3: Update `src/app/layout.tsx`**

Replace its contents with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hello Kitty Fan Page",
  description: "A fan-made tribute to Hello Kitty — built with Next.js and Gemini AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

Why we removed the Geist font imports: the spec specifies system sans-serif, so the Google Font fetch is wasted bytes (YAGNI).

- [ ] **Step 4: Verify the dev server still boots**

Run (in a separate terminal, or background it):

```bash
export PATH="/opt/homebrew/bin:$PATH" && cd ~/projects/website && npm run dev
```

Expected: server starts on `http://localhost:3000` without compile errors. Visit it in a browser — the default boilerplate page should still render (we haven't touched `page.tsx` yet), but with a pink-ish background showing through.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/website && git add package.json package-lock.json src/app/globals.css src/app/layout.tsx && git commit -m "chore: install gemini sdk and add hello kitty theme tokens"
```

---

### Task 2: Build the Gemini image-generation API route

**Files:**
- Create: `src/app/api/generate-images/route.ts`

- [ ] **Step 1: Write `src/app/api/generate-images/route.ts`**

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const CITY_PROMPTS = [
  {
    city: "Paris",
    prompt:
      "Hello Kitty standing in front of the Eiffel Tower in Paris, kawaii style, soft pink pastel colours, cute illustration",
  },
  {
    city: "Tokyo",
    prompt:
      "Hello Kitty visiting a traditional Japanese temple in Tokyo, kawaii style, soft pink pastel colours, cute illustration",
  },
  {
    city: "New York",
    prompt:
      "Hello Kitty in front of the Statue of Liberty in New York, kawaii style, soft pink pastel colours, cute illustration",
  },
  {
    city: "London",
    prompt:
      "Hello Kitty standing outside Buckingham Palace in London, kawaii style, soft pink pastel colours, cute illustration",
  },
];

async function generateOne(client: GoogleGenerativeAI, prompt: string) {
  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      responseModalities: ["Text", "Image"],
    } as any,
  });
  const result = await model.generateContent(prompt);
  const parts = result.response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: any) => p.inlineData);
  if (!imagePart?.inlineData) {
    throw new Error("Gemini response did not contain an image");
  }
  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
}

export async function GET() {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_AI_STUDIO_API_KEY is not set" },
      { status: 500 }
    );
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const images = await Promise.all(
      CITY_PROMPTS.map(async ({ city, prompt }) => ({
        city,
        dataUrl: await generateOne(client, prompt),
      }))
    );
    return Response.json({ images });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 }); 
  }
}
```

Notes:
- `responseModalities` is cast to `any` because the SDK's TS types may not yet include it for this experimental model. If TypeScript complains anyway, change the cast site or use `// @ts-expect-error` on that line — do not silence with a global ignore.
- `Promise.all` fires the 4 requests in parallel — total latency = slowest call, not sum.
- The model name `gemini-2.0-flash-exp` comes from the spec. If at runtime Gemini returns "model not found" or "modality not supported", try `gemini-2.0-flash-exp-image-generation` next, then `gemini-2.5-flash-image-preview`. Stop and ask the user before exploring further.

- [ ] **Step 2: Restart the dev server so the new route is picked up**

Most Next.js dev setups auto-detect new files, but if `npm run dev` was already running, save a file in `src/app/` to force a recompile, or restart it:

```bash
export PATH="/opt/homebrew/bin:$PATH" && cd ~/projects/website && npm run dev
```

- [ ] **Step 3: Smoke-test the route with curl**

```bash
curl -s http://localhost:3000/api/generate-images | head -c 200
```

Expected: response starts with `{"images":[{"city":"Paris","dataUrl":"data:image/png;base64,iVBOR...`

If you see `{"error":"..."}` instead:
- "GOOGLE_AI_STUDIO_API_KEY is not set" → the dev server didn't pick up `.env.local`; restart it.
- "model not found" / "modality not supported" → try the fallback model IDs listed in Step 1, in order.
- Any other error → read the message verbatim and surface it before changing code.

Do not advance until the smoke test returns 4 images.

- [ ] **Step 4: Commit**

```bash
cd ~/projects/website && git add src/app/api/generate-images/route.ts && git commit -m "feat: add gemini image generation api route"
```

---

### Task 3: Build the Navbar component

**Files:**
- Create: `src/components/Navbar.tsx`

- [ ] **Step 1: Write `src/components/Navbar.tsx`**

```tsx
const SECTIONS = [
  { id: "about", label: "About" },
  { id: "gallery", label: "Gallery" },
  { id: "facts", label: "Fun Facts" },
  { id: "favourites", label: "Favourites" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-kitty-pink shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <a href="#top" className="text-lg font-bold uppercase tracking-wider text-kitty-white">
          🎀 Hello Kitty
        </a>
        <ul className="flex gap-6 text-sm font-semibold text-kitty-white">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:text-kitty-red transition-colors">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
```

Server component — no `'use client'` needed (purely static markup + anchor links).

- [ ] **Step 2: Commit**

```bash
cd ~/projects/website && git add src/components/Navbar.tsx && git commit -m "feat: add Navbar component"
```

---

### Task 4: Build the Hero component

**Files:**
- Create: `src/components/Hero.tsx`

- [ ] **Step 1: Write `src/components/Hero.tsx`**

```tsx
export default function Hero() {
  return (
    <section
      id="top"
      className="bg-gradient-to-b from-kitty-pink to-kitty-blush px-6 py-24 text-center"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-7xl" aria-hidden="true">🎀</div>
        <h1 className="mb-3 text-5xl font-bold text-kitty-red sm:text-6xl">
          Hello Kitty
        </h1>
        <p className="mb-6 text-lg text-kitty-red/80">
          The world&rsquo;s sweetest little kitty, since 1974.
        </p>
        <span className="inline-block rounded-full bg-kitty-white px-4 py-1.5 text-sm font-semibold text-kitty-red shadow">
          🌸 Fan Made with Love
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/projects/website && git add src/components/Hero.tsx && git commit -m "feat: add Hero component"
```

---

### Task 5: Build the About component

**Files:**
- Create: `src/components/About.tsx`

- [ ] **Step 1: Write `src/components/About.tsx`**

```tsx
export default function About() {
  return (
    <section id="about" className="border-t-[3px] border-kitty-blush bg-kitty-white px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-kitty-pink">
          About
        </h2>
        <p className="text-lg leading-relaxed text-neutral-800">
          Hello Kitty (real name: Kitty White) was born on{" "}
          <strong>November 1st</strong> in the suburbs of London, England. She loves
          baking cookies, making new friends, and travelling the world with her twin
          sister Mimmy. Cheerful, kind, and famous for her signature red bow — she has
          been bringing smiles to fans of every age since 1974.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/projects/website && git add src/components/About.tsx && git commit -m "feat: add About component"
```

---

### Task 6: Build the Gallery component (client component with loading + error states)

**Files:**
- Create: `src/components/Gallery.tsx`

This is the only non-trivial component — it fetches data on mount, shows skeletons while loading, and a fallback message on error.

- [ ] **Step 1: Write `src/components/Gallery.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

type GalleryImage = { city: string; dataUrl: string };
type ApiResponse = { images?: GalleryImage[]; error?: string };

const SKELETON_CITIES = ["Paris", "Tokyo", "New York", "London"];

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/generate-images")
      .then((res) => res.json() as Promise<ApiResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.error || !data.images) {
          setError(data.error ?? "No images returned");
          return;
        }
        setImages(data.images);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load images");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="gallery"
      className="border-t-[3px] border-kitty-blush bg-kitty-bg px-6 py-16"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-kitty-pink">
          Gallery — Hello Kitty Around the World
        </h2>

        {error ? (
          <p className="rounded-lg bg-kitty-white p-6 text-center text-kitty-red">
            Images couldn&rsquo;t load — try refreshing. ({error})
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(images ?? SKELETON_CITIES.map((city) => ({ city, dataUrl: "" }))).map(
              (img) => (
                <figure key={img.city} className="overflow-hidden rounded-2xl bg-kitty-blush shadow">
                  {img.dataUrl ? (
                    <img
                      src={img.dataUrl}
                      alt={`Hello Kitty in ${img.city}`}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-full animate-pulse bg-kitty-pink/40" />
                  )}
                  <figcaption className="bg-kitty-white px-3 py-2 text-center text-sm font-semibold text-kitty-red">
                    {img.city}
                  </figcaption>
                </figure>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
```

Notes:
- `'use client'` is mandatory — we use `useEffect` and `useState`.
- The `cancelled` flag avoids setting state on an unmounted component (React Strict Mode mounts twice in dev).
- We use plain `<img>` (not `next/image`) because the source is a data URL, which `next/image` doesn't optimize.
- Grid is 2 cols on mobile, 4 on `lg+` per the spec (2×2 on mobile, 4×1 on desktop).

- [ ] **Step 2: Commit**

```bash
cd ~/projects/website && git add src/components/Gallery.tsx && git commit -m "feat: add Gallery client component with loading and error states"
```

---

### Task 7: Build the FunFacts component

**Files:**
- Create: `src/components/FunFacts.tsx`

- [ ] **Step 1: Write `src/components/FunFacts.tsx`**

```tsx
const FACTS = [
  { emoji: "🎂", text: "She was created in 1974 by Yuko Shimizu at Sanrio." },
  { emoji: "📏", text: "Her height is officially measured as 5 apples tall." },
  { emoji: "👯", text: "She has a twin sister named Mimmy who wears a yellow bow." },
  { emoji: "🇬🇧", text: "She was born in the suburbs of London, England." },
  { emoji: "🍎", text: "Her favourite food is her mama's homemade apple pie." },
];

export default function FunFacts() {
  return (
    <section
      id="facts"
      className="border-t-[3px] border-kitty-blush bg-kitty-white px-6 py-16"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-kitty-pink">
          Fun Facts
        </h2>
        <ul className="space-y-3">
          {FACTS.map((fact) => (
            <li
              key={fact.text}
              className="flex items-start gap-3 rounded-xl bg-kitty-bg p-4"
            >
              <span className="text-2xl" aria-hidden="true">{fact.emoji}</span>
              <span className="text-base text-neutral-800">{fact.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/projects/website && git add src/components/FunFacts.tsx && git commit -m "feat: add FunFacts component"
```

---

### Task 8: Build the Favourites component

**Files:**
- Create: `src/components/Favourites.tsx`

- [ ] **Step 1: Write `src/components/Favourites.tsx`**

```tsx
const FAVOURITES = [
  "🥧 Apple pie",
  "🎵 Music",
  "🍪 Cookies",
  "⭐ Stars",
  "✏️ Drawing",
];

export default function Favourites() {
  return (
    <section
      id="favourites"
      className="border-t-[3px] border-kitty-blush bg-kitty-bg px-6 py-16"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-kitty-pink">
          Favourite Things
        </h2>
        <ul className="flex flex-wrap gap-3">
          {FAVOURITES.map((item) => (
            <li
              key={item}
              className="rounded-full bg-kitty-pink px-4 py-2 text-sm font-semibold text-kitty-white shadow-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/projects/website && git add src/components/Favourites.tsx && git commit -m "feat: add Favourites component"
```

---

### Task 9: Build the Footer component

**Files:**
- Create: `src/components/Footer.tsx`

- [ ] **Step 1: Write `src/components/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="border-t-[3px] border-kitty-blush bg-kitty-red px-6 py-8 text-center">
      <p className="text-sm text-kitty-white">
        Made with 🎀 &amp; Gemini AI · Not affiliated with Sanrio
      </p>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/projects/website && git add src/components/Footer.tsx && git commit -m "feat: add Footer component"
```

---

### Task 10: Compose the page + full browser verification

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace `src/app/page.tsx` with the fan page composition**

```tsx
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Gallery from "@/components/Gallery";
import FunFacts from "@/components/FunFacts";
import Favourites from "@/components/Favourites";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Gallery />
        <FunFacts />
        <Favourites />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Verify in the browser**

With `npm run dev` running, open `http://localhost:3000`. Walk through this checklist:

1. **Navbar is sticky** — scroll down, it stays pinned to the top.
2. **Nav links jump to sections** — click "About", "Gallery", etc. Page scrolls.
3. **Hero** — large 🎀, "Hello Kitty" title in deep red, "Fan Made with Love" pill.
4. **About** — bio paragraph reads cleanly.
5. **Gallery** — 4 pink skeletons appear immediately, then are replaced by 4 generated images of Hello Kitty in Paris / Tokyo / New York / London. Caption under each.
6. **Fun Facts** — 5 emoji-prefixed bullets in soft-pink cards.
7. **Favourites** — 5 pink pill tags wrapping naturally.
8. **Footer** — deep-red bar with the credit line.
9. **No console errors** — open DevTools, refresh, confirm clean.
10. **Mobile layout** — DevTools device toolbar at ~375px width: gallery is 2×2, hero text scales, nav still works.

If anything is broken, fix before committing. Do not claim success without seeing 4 real images render.

- [ ] **Step 3: Commit**

```bash
cd ~/projects/website && git add src/app/page.tsx && git commit -m "feat: compose hello kitty fan page in app/page.tsx"
```

---

### Task 11: Push to GitHub and verify Vercel deploy

**Files:** none

- [ ] **Step 1: Confirm `GOOGLE_AI_STUDIO_API_KEY` is set on Vercel**

```bash
# Open the project's env vars page in a browser:
open "https://vercel.com/dashboard"
```

Navigate to: kittygemma/website → Settings → Environment Variables. Confirm `GOOGLE_AI_STUDIO_API_KEY` exists for the Production environment. If not, add it (value from `~/projects/website/.env.local`) — Vercel will not have it just because it's in `.env.local`, since `.env.local` is git-ignored.

Do **not** print the key value in the terminal.

- [ ] **Step 2: Push**

```bash
cd ~/projects/website && git push origin main
```

- [ ] **Step 3: Watch the deploy**

```bash
gh run watch -R kittygemma/website 2>/dev/null || open "https://vercel.com/dashboard"
```

Vercel auto-deploys on push to `main`. Wait until the deploy reports "Ready", then open the production URL and repeat the Task 10 browser checklist. The Gallery may take 5–15 seconds on first load while Gemini generates the 4 images — this is expected.

If the deployed Gallery shows the error fallback, check the Vercel function logs for `/api/generate-images` — the most likely cause is a missing env var.

- [ ] **Step 4: Update the project handoff memory**

The website is live. Update or remove `~/.claude/projects/-Users-kitty/memory/project_website_handoff.md` so the next session reflects current state (e.g. "v1 shipped; next experiment TBD" or delete and let a fresh memory get written).

---

## Notes for the executing engineer

- **Don't add a test framework.** Manual browser verification + the curl smoke test for the API route is the whole testing story here.
- **Don't introduce `lib/` indirection** for the Gemini code. The route is the only consumer; one file is right.
- **Don't tweak the prompts** unless an image clearly doesn't match its city — the user signed off on these exact strings.
- **Server vs client:** only Gallery needs `'use client'`. If you find yourself adding it to other components, stop and reconsider.
- **Secrets:** never print the contents of `.env.local` or pass it through stdout. Reference variables by name only.
- **If Gemini's experimental model has been removed**, surface that as a blocker before substituting a different model — the user should decide.
