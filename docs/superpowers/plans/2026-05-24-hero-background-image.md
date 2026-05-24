# Hero Background Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hero section's pink gradient and emoji with a Gemini-generated bedroom-scene background image, with a tinted overlay so the existing text stays readable.

**Architecture:** A one-shot Node script generates a single hero PNG from a Gemini prompt and writes it to `public/hero/bedroom.png`. The `Hero.tsx` server component renders that image via `next/image` with `fill` + `object-cover` as a background layer, with a gradient overlay div and the existing text content positioned on top.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, Tailwind v4, `@google/generative-ai` ^0.24.1, Node 26 (built-in `process.loadEnvFile`).

**Spec:** [`docs/superpowers/specs/2026-05-24-hero-background-image-design.md`](../specs/2026-05-24-hero-background-image-design.md)

**Branch policy:** Direct commits to `main` (per user's experimental-project workflow). Push at the end after all tasks pass.

---

## Testing approach

Like the gallery refactor, this is asset generation + a UI change. There are no meaningful unit tests. Verification is:
- **Task 1:** `ls`/`file` confirms one PNG exists and is valid
- **Task 2:** Type-check + lint + build all pass; build output shows `/` still prerendered as static
- **Final push:** Human visually confirms in production that the image renders, text is readable, and layout works on desktop + mobile

Where steps say "verify", treat that verification as the test.

---

## Task 1: Generate the hero PNG

**Files:**
- Create: `scripts/generate-hero-image.mjs`
- Create: `public/hero/bedroom.png`

- [ ] **Step 1: Create the output directory**

Run from repo root (`~/projects/website`):
```bash
mkdir -p scripts public/hero
```

(`scripts/` already exists from the gallery refactor; `mkdir -p` is a no-op for it.)

- [ ] **Step 2: Write the generator script**

Create `scripts/generate-hero-image.mjs` with this exact content:

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

process.loadEnvFile(".env.local");

const MODEL_NAME = "gemini-2.5-flash-image";
const OUT_DIR = "public/hero";
const OUT_FILE = "bedroom.png";

const PROMPT =
  "Hello Kitty's pink bedroom interior, kawaii style, soft pink pastel colours, cute illustration, wide cozy scene with cute details, bed with pink covers, stuffed animals, hearts and bows on the walls, centered composition";

async function generate(client, prompt) {
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
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

  console.log(`Generating ${OUT_FILE}...`);
  const png = await generate(client, PROMPT);
  const outPath = join(OUT_DIR, OUT_FILE);
  await writeFile(outPath, png);
  console.log(`  wrote ${outPath} (${png.length} bytes)`);
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
node scripts/generate-hero-image.mjs
```

Expected output:
```
Generating bedroom.png...
  wrote public/hero/bedroom.png (NNNNNN bytes)
Done.
```

If you see `GOOGLE_AI_STUDIO_API_KEY is not set`, confirm `.env.local` contains that key.
If generation fails with a Gemini error, re-run — transient failures are common.

- [ ] **Step 4: Verify the PNG exists and is valid**

```bash
ls -la public/hero/
file public/hero/bedroom.png
```

Expected: one file `bedroom.png` at least 100KB, identified as `PNG image data, 1024 x 1024, 8-bit/color RGB, non-interlaced` (or similar PNG variant).

If the file is 0 bytes or missing, the script failed silently — re-run.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/website
git add scripts/generate-hero-image.mjs public/hero/
git commit -m "feat: add hero image generator and PNG output

One-shot script generates the Hello Kitty bedroom hero background
via Gemini, committed to public/hero/bedroom.png for static serving.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Rewrite Hero as a background-image component

**Files:**
- Modify: `src/components/Hero.tsx` (full rewrite)

- [ ] **Step 1: Re-check the Next.js Image docs for the `fill` prop**

Per project `AGENTS.md`, this Next.js install has breaking changes from training data. The gallery rewrite confirmed `next/image` import path and that `priority` is deprecated in v16 in favor of `preload`. Before writing this rewrite, confirm specifically:

```bash
ls ~/projects/website/node_modules/next/dist/docs/01-app/03-api-reference/02-components/ 2>/dev/null | grep -i image
```

Then read whichever Image doc the gallery task identified (likely `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`). Confirm:
- `fill` prop behaviour — parent must have `position: relative` (or absolute/fixed) and a fixed size
- For above-the-fold images, is the prop `preload` (v16) or `priority` (legacy)? Use whichever is current.
- Does `fill` mode require omitting `width`/`height`? (Yes per standard Next.js — confirm for v16)

If your rewrite needs a prop not shown in this plan, the docs are authoritative — adapt.

- [ ] **Step 2: Rewrite `src/components/Hero.tsx`**

Replace the entire file contents with:

```tsx
import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[500px] overflow-hidden px-6 py-24 text-center sm:min-h-[600px]"
    >
      <Image
        src="/hero/bedroom.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-kitty-pink/40 via-kitty-pink/30 to-kitty-blush/70"
      />
      <div className="relative z-10 mx-auto max-w-3xl">
        <h1 className="mb-3 text-5xl font-bold text-kitty-red drop-shadow-md sm:text-6xl">
          Hello Kitty
        </h1>
        <p className="mb-6 text-lg text-kitty-red/80 drop-shadow-sm">
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

**Notes for the implementer:**
- The bow emoji `🎀` from the old Hero is intentionally removed (per spec).
- The pink gradient `bg-gradient-to-b from-kitty-pink to-kitty-blush` from the old section className is intentionally removed (per spec — the image replaces it).
- `alt=""` is correct — the image is decorative; the `<h1>` conveys meaning.
- The `aria-hidden="true"` on the overlay div is correct — it's a presentational layer.
- `priority` is used because the hero is above the fold. **If Step 1 confirmed `priority` is fully removed in v16 (not just deprecated), replace `priority` with `preload`.** If both still work, prefer `preload`.

- [ ] **Step 3: Type-check and lint**

```bash
cd ~/projects/website
npx tsc --noEmit
npm run lint
```

Expected: both pass cleanly. If `tsc` reports an error about `priority` or `fill`, revisit the docs from Step 1 and adapt.

- [ ] **Step 4: Build**

```bash
cd ~/projects/website
npm run build
```

Expected:
- Build succeeds (exit 0)
- Route `/` shows as `○` (Static / prerendered) in the route table — same as before this task
- No new warnings about missing images or invalid props

If you see a warning like "Image with src `/hero/bedroom.png` has unused properties: `width`, `height`" or similar, you've left `width`/`height` on the Image — remove them (incompatible with `fill`).

- [ ] **Step 5: Commit**

```bash
cd ~/projects/website
git add src/components/Hero.tsx
git commit -m "feat: rewrite Hero with bedroom background image

Replaces pink gradient and bow emoji with a Gemini-generated bedroom
scene as a next/image fill background, with a tinted overlay so the
title, tagline, and badge stay readable.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Final step: Push and human visual check

- [ ] **Step 1: Push**

```bash
cd ~/projects/website
git push origin main
```

Note: pushing may fail with HTTP 408 on the first try if the PNG transfer times out. Retry once if that happens.

- [ ] **Step 2: Wait for Vercel deploy**

Vercel auto-deploys on push (~1–2 minutes). Confirm the deploy started in the Vercel dashboard or just wait ~90 seconds.

- [ ] **Step 3: Production smoke check**

```bash
curl -s -o /dev/null -w "homepage: %{http_code}\n" https://website-kitty01.vercel.app/
curl -s -o /dev/null -w "hero image: %{http_code}\n" https://website-kitty01.vercel.app/hero/bedroom.png
```

Expected: both return `200`. If `bedroom.png` is `404`, the file didn't push — check `git log origin/main` to confirm the commit landed.

- [ ] **Step 4: Human visual verification**

Open https://website-kitty01.vercel.app in a browser and confirm:
- The bedroom image fills the hero section
- The "Hello Kitty" title, tagline, and "Fan Made with Love" badge are all readable on top
- Layout works on mobile (resize browser narrow, or use DevTools mobile emulation)
- No layout shift or flash of unstyled content as the page loads

**If text is hard to read** against the generated image (e.g. image is too light/busy in the bottom region):
- Open `src/components/Hero.tsx`
- Bump the overlay's `to-kitty-blush/70` higher — try `/85` then `/95`
- Re-run the type-check, lint, build sequence and commit + push the tweak
- If even `/95` doesn't help, change `text-kitty-red` to `text-kitty-white` on the heading and tagline (and `text-kitty-red/80` → `text-kitty-white/90` on the tagline)

**If the generated image itself looks off** (wrong style, distorted, weird artifacts):
- Re-run `node scripts/generate-hero-image.mjs` (Gemini output varies per run)
- The new PNG overwrites `public/hero/bedroom.png`
- Commit the replacement: `git add public/hero/bedroom.png && git commit -m "chore: regenerate hero image"` then push

---

## Self-review notes

- **Spec coverage:** All three spec components (generator script, Hero rewrite, gradient removal) have tasks. The "files touched" table in the spec (3 entries) matches the files in this plan.
- **Next.js version constraint:** Task 2 Step 1 explicitly re-checks the `fill` and `priority`/`preload` API before writing code, addressing the AGENTS.md warning. The gallery task already confirmed `next/image` v16 specifics; this builds on that knowledge.
- **Type/name consistency:** Path `/hero/bedroom.png` and file `public/hero/bedroom.png` match between Task 1 (script output) and Task 2 (Image src). Constant names in the script (`MODEL_NAME`, `OUT_DIR`, `OUT_FILE`, `PROMPT`) are internally consistent.
- **No placeholders:** Every step has either complete code or an exact command with expected output. The "if text is hard to read" branch in the final task is explicit (which class to tweak, which values to try).
- **Risk coverage:** The spec's risks (text readability, Gemini variation, aspect ratio cropping, mobile, Next.js v16 API) are all addressed either in the implementation (overlay, prompt, sizes, priority/preload check) or in the final visual-check escalation paths.
