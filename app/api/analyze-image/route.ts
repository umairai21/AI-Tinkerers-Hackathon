import { NextRequest, NextResponse } from "next/server";
import { openrouter, OPENROUTER_MODEL } from "@/lib/openrouter";

// Lightweight vision pass: describe likely damage, never a definitive diagnosis.
export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null);
  const { imageUrl, productName } = (body ?? {}) as Record<string, unknown>;

  if (typeof imageUrl !== "string" || !imageUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "imageUrl must be an image data URL" }, { status: 400 });
  }

  try {
    const response = await openrouter.chat.completions.create({
      model: OPENROUTER_MODEL,
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
              text: `This is a photo submitted with a support request for a ${typeof productName === "string" ? productName : "product"}. Describe what appears consistent with damage, if any.`,
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
