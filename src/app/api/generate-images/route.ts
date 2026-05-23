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
    model: "gemini-2.5-flash-image",
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
