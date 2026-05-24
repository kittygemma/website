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
