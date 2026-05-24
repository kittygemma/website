# Static Gallery Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace runtime Gemini image generation in the Gallery with static PNGs committed to `public/gallery/`, eliminating per-pageload API calls.

**Architecture:** A one-shot Node script generates 4 PNGs from the existing Gemini prompts and writes them to `public/gallery/`. The Gallery component becomes a server component that renders `next/image` `<Image />` tags pointing at those static paths. The `/api/generate-images` route is deleted.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, Tailwind v4, `@google/generative-ai` ^0.24.1, Node 26 (built-in `process.loadEnvFile`).

**Spec:** [`docs/superpowers/specs/2026-05-24-static-gallery-images-design.md`](../specs/2026-05-24-static-gallery-images-design.md)

**Branch policy:** Direct commits to `main` (per user's experimental-project workflow). Push at the end after all tasks pass.

---

## Testing approach

This work is asset generation + a UI swap. There are no meaningful unit tests to write — the verification steps are:
- **Task 1:** `ls` confirms 4 PNG files exist with non-zero size
- **Task 2:** Browser visual check confirms all 4 images render; DevTools Network tab confirms no `/api/generate-images` request
- **Task 3:** `npm run build` succeeds and `curl` confirms route returns 404 in dev

Where steps say "verify", treat that verification as the test — don't skip it.

---

## Task 1: Generator script and image files

**Files:**
- Create: `scripts/generate-gallery-images.mjs`
- Create: `public/gallery/paris.png`
- Create: `public/gallery/tokyo.png`
- Create: `public/gallery/new-york.png`
- Create: `public/gallery/london.png`

- [ ] **Step 1: Create the scripts/ directory**

Run from repo root (`~/projects/website`):
```bash
mkdir -p scripts public/gallery
```

- [ ] **Step 2: Write the generator script**

Create `scripts/generate-gallery-images.mjs` with this exact content:

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

process.loadEnvFile(".env.local");

const CITIES = [
  {
    slug: "paris",
    prompt:
      "Hello Kitty standing in front of the Eiffel Tower in Paris, kawaii style, soft pink pastel colours, cute illustration",
  },
  {
    slug: "tokyo",
    prompt:
      "Hello Kitty visiting a traditional Japanese temple in Tokyo, kawaii style, soft pink pastel colours, cute illustration",
  },
  {
    slug: "new-york",
    prompt:
      "Hello Kitty in front of the Statue of Liberty in New York, kawaii style, soft pink pastel colours, cute illustration",
  },
  {
    slug: "london",
    prompt:
      "Hello Kitty standing outside Buckingham Palace in London, kawaii style, soft pink pastel colours, cute illustration",
  },
];

const OUT_DIR = "public/gallery";

async function generateOne(client, prompt) {
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash-image",
    generationConfig: {
      responseModalities: ["Text", "Image"],
    },
  });
  const result = await model.generateContent(prompt);
  const parts = result.response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData);
  if (!imagePart?.inlineData) {
    throw new Error("Gemini response did not contain an image");
  }
  return Buffer.from(imagePart.inlineData.data, "base64");
}

async function main() {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_STUDIO_API_KEY is not set in .env.local");
  }
  await mkdir(OUT_DIR, { recursive: true });
  const client = new GoogleGenerativeAI(apiKey);

  for (const { slug, prompt } of CITIES) {
    console.log(`Generating ${slug}...`);
    const png = await generateOne(client, prompt);
    const path = join(OUT_DIR, `${slug}.png`);
    await writeFile(path, png);
    console.log(`  wrote ${path} (${png.length} bytes)`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Run the script**

```bash
export PATH="/opt/homebrew/bin:$PATH"
cd ~/projects/website
node scripts/generate-gallery-images.mjs
```

Expected output (slug names and byte counts will match; exact byte counts vary per run):
```
Generating paris...
  wrote public/gallery/paris.png (NNNNNN bytes)
Generating tokyo...
  wrote public/gallery/tokyo.png (NNNNNN bytes)
Generating new-york...
  wrote public/gallery/new-york.png (NNNNNN bytes)
Generating london...
  wrote public/gallery/london.png (NNNNNN bytes)
Done.
```

If you see `GOOGLE_AI_STUDIO_API_KEY is not set`, confirm `.env.local` contains that key.
If a generation fails with a Gemini API error, re-run — transient failures are common.

- [ ] **Step 4: Verify all 4 PNGs exist with reasonable size**

```bash
ls -la public/gallery/
```

Expected: 4 files (`paris.png`, `tokyo.png`, `new-york.png`, `london.png`) each at least 100KB (Gemini PNGs are typically 500KB–3MB). If any file is 0 bytes or missing, the script failed silently — re-run.

- [ ] **Step 5: Visually verify each PNG looks right**

```bash
open public/gallery/paris.png public/gallery/tokyo.png public/gallery/new-york.png public/gallery/london.png
```

Confirm each image shows Hello Kitty at the named landmark in the expected kawaii pastel style. If any image is off-brand or broken-looking, delete it and re-run the script (Gemini output varies between runs).

- [ ] **Step 6: Commit**

```bash
cd ~/projects/website
git add scripts/generate-gallery-images.mjs public/gallery/
git commit -m "feat: add static gallery image generator and PNG outputs

Generates 4 city images via Gemini once, committed to public/gallery/
for static serving. Replaces per-pageload API calls.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Rewrite Gallery as a static server component

**Files:**
- Modify: `src/components/Gallery.tsx` (full rewrite)

- [ ] **Step 1: Check the Next.js Image docs**

Per project `AGENTS.md`, this Next.js install has breaking changes from training data. Before writing the rewrite, read the `<Image />` docs that ship with this version:

```bash
ls ~/projects/website/node_modules/next/dist/docs/ 2>/dev/null | grep -i image
```

If a relevant doc exists, read it with the Read tool. Specifically confirm:
- Import path (likely still `next/image`)
- Required props (`src`, `alt`, plus `width`/`height` for non-fill mode)
- Whether `priority` or other props have changed

If your rewrite needs a prop not shown in this plan, the docs are authoritative — adapt.

- [ ] **Step 2: Rewrite `src/components/Gallery.tsx`**

Replace the entire file contents with:

```tsx
import Image from "next/image";

const IMAGES = [
  { city: "Paris", src: "/gallery/paris.png" },
  { city: "Tokyo", src: "/gallery/tokyo.png" },
  { city: "New York", src: "/gallery/new-york.png" },
  { city: "London", src: "/gallery/london.png" },
];

export default function Gallery() {
  return (
    <section
      id="gallery"
      className="border-t-[3px] border-kitty-blush bg-kitty-bg px-6 py-16"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-kitty-pink">
          Gallery — Hello Kitty Around the World
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMAGES.map((img) => (
            <figure key={img.city} className="overflow-hidden rounded-2xl bg-kitty-blush shadow">
              <Image
                src={img.src}
                alt={`Hello Kitty in ${img.city}`}
                width={512}
                height={512}
                className="aspect-square w-full object-cover"
              />
              <figcaption className="bg-kitty-white px-3 py-2 text-center text-sm font-semibold text-kitty-red">
                {img.city}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Note: `"use client"` is removed — this is now a server component. `useEffect`, `useState`, fetch, error state, and skeleton loader are all gone.

If Step 1 revealed the `<Image />` API differs (e.g., `width`/`height` are now required differently, or a different import path), adjust the JSX above accordingly. The structure (one `<Image>` per city, same Tailwind classes) stays the same.

- [ ] **Step 3: Type-check and lint**

```bash
cd ~/projects/website
npx tsc --noEmit
npm run lint
```

Expected: both pass cleanly. If `tsc` reports errors about `Image` props, revisit the docs from Step 1.

- [ ] **Step 4: Start the dev server**

```bash
export PATH="/opt/homebrew/bin:$PATH"
cd ~/projects/website
npm run dev
```

Wait for `Ready in Xs` and `Local: http://localhost:3000` in the output.

- [ ] **Step 5: Visually verify in browser**

Open http://localhost:3000 in a browser. Confirm:
- All 4 city images appear in the Gallery section
- Layout matches the previous version (2-col on mobile, 4-col on desktop)
- City captions (Paris, Tokyo, New York, London) appear under each image
- No skeleton/loading state flashes (images should appear instantly or with the browser's native lazy-load fade)

- [ ] **Step 6: Confirm no API call in DevTools**

In the browser DevTools Network tab, filter for `generate-images`. Reload the page. Expected: **zero** requests matching that filter. If one appears, something is still calling the API — check the Gallery rewrite.

- [ ] **Step 7: Stop dev server**

Ctrl-C in the terminal running `npm run dev`.

- [ ] **Step 8: Commit**

```bash
cd ~/projects/website
git add src/components/Gallery.tsx
git commit -m "feat: rewrite Gallery as static server component

Reads 4 PNGs from public/gallery/ via next/image. Drops client-side
fetch, loading state, and error handling — no longer needed.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Delete the unused API route

**Files:**
- Delete: `src/app/api/generate-images/route.ts`

- [ ] **Step 1: Delete the route file**

```bash
cd ~/projects/website
rm src/app/api/generate-images/route.ts
```

- [ ] **Step 2: Remove empty parent directories**

```bash
rmdir src/app/api/generate-images
# if src/app/api is now empty, also remove it:
rmdir src/app/api 2>/dev/null || true
```

`rmdir` only removes empty dirs — safe to run.

- [ ] **Step 3: Type-check and build**

```bash
cd ~/projects/website
npx tsc --noEmit
npm run build
```

Expected: both pass cleanly. The build output should NOT list `/api/generate-images` in the route table.

- [ ] **Step 4: Verify route is gone in dev**

Start dev server:
```bash
npm run dev
```

In a separate terminal:
```bash
curl -i http://localhost:3000/api/generate-images
```

Expected: `HTTP/1.1 404 Not Found`.

Stop the dev server with Ctrl-C.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/website
git add -A
git commit -m "refactor: delete unused generate-images API route

Gallery now serves static PNGs from public/gallery/; this route is
dead code. Preserved in git history if dynamic generation is needed
again.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Final step: Push to main and verify production

- [ ] **Step 1: Push**

```bash
cd ~/projects/website
git push origin main
```

- [ ] **Step 2: Watch Vercel deploy**

Vercel auto-deploys on push to `main`. Either watch the build in the Vercel dashboard or:

```bash
# After ~1-2 minutes:
curl -s -o /dev/null -w "%{http_code}\n" https://website-kitty01.vercel.app/api/generate-images
```

Expected: `404` (route is gone).

- [ ] **Step 3: Visual check production**

Open https://website-kitty01.vercel.app and confirm all 4 gallery images render correctly. Open DevTools Network tab, reload, and confirm:
- 4 image requests to `/_next/image?url=%2Fgallery%2F...` (Next.js optimizer URLs)
- Zero requests to `/api/generate-images`

- [ ] **Step 4 (optional): Remove unused Vercel env var**

`GOOGLE_AI_STUDIO_API_KEY` is no longer used by the deployed app. You can remove it from Vercel's project settings → Environment Variables to clean up. Leave it if you might re-add dynamic generation later. Not removing it doesn't break anything.

---

## Self-review notes

- **Spec coverage:** All three spec components (script, Gallery rewrite, route deletion) have tasks. The "files touched" table in the spec matches the files in this plan.
- **Next.js version constraint:** Step 1 of Task 2 explicitly reads the local Next.js docs before writing `<Image />` code, addressing the AGENTS.md warning.
- **Type/name consistency:** Slug names (`paris`, `tokyo`, `new-york`, `london`) and image paths (`/gallery/{slug}.png`) match across Task 1 (script), Task 2 (Gallery), and the production verification step.
- **No placeholders:** Every step has either complete code or an exact command with expected output.
