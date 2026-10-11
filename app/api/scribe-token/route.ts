import { NextResponse } from "next/server";

// Mints a single-use ElevenLabs token for live (streaming) speech-to-text, so the browser
// can open the realtime connection without ever seeing the API key. Tokens expire after
// 15 minutes and are consumed on use.
export async function POST() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY is not configured." }, { status: 500 });
  }

  const res = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Length": "0" },
  });
  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Could not start transcription", detail }, { status: res.status });
  }

  const { token } = await res.json();
  return NextResponse.json({ token });
}
