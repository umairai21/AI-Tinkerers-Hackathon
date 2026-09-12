import { NextRequest, NextResponse } from "next/server";

// Transcribes the customer's push-to-talk recording. Matches CopilotKit's built-in
// push-to-talk `transcribeAudioUrl` contract: multipart "file" in, { text } out.
export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY is not configured." }, { status: 500 });
  }

  const incomingForm = await req.formData();
  const file = incomingForm.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const outgoingForm = new FormData();
  outgoingForm.append("file", file, "recording.mp4");
  outgoingForm.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: outgoingForm,
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Transcription failed", detail }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ text: data.text ?? "" });
}
