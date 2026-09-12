import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Lightweight vision pass: describe likely damage, never a definitive diagnosis.
export async function POST(req: NextRequest) {
  const { imageUrl, productName } = await req.json();

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  try {
    const response = await openrouter.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content:
            "You help triage customer support photos of products. Describe only what appears consistent with visible damage. Never give a definitive diagnosis. Keep it to 1-2 short sentences. Also output a rough confidence (low/medium/high) and a short issueType label (e.g. 'cracked_screen', 'water_damage', 'physical_damage', 'unclear').",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is a photo submitted with a support request for a ${productName ?? "product"}. Describe what appears consistent with damage, if any.`,
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 200,
    });

    const description = response.choices[0]?.message?.content ?? "Unable to analyze image.";
    return NextResponse.json({ description });
  } catch (err) {
    return NextResponse.json(
      { error: "Image analysis failed", detail: String(err) },
      { status: 500 }
    );
  }
}
