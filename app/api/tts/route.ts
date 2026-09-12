import { NextRequest, NextResponse } from "next/server";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // ElevenLabs "Rachel" — always available

// Synthesizes speech for an assistant reply. Runs server-side so the API key stays private.
// GET + ?text= matches CopilotKit's built-in push-to-talk `textToSpeechUrl` contract.
export async function GET(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY is not configured." }, { status: 500 });
  }

  const text = req.nextUrl.searchParams.get("text");
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Text-to-speech failed", detail }, { status: res.status });
  }

  return new NextResponse(res.body, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
