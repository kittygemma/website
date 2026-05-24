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
