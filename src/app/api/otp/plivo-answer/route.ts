import { NextResponse } from "next/server";

/**
 * Plivo fetches this URL when the outbound voice call connects. Returns Plivo
 * XML that reads out the OTP via TTS. The `code` query param holds the
 * pre-formatted spoken digits (e.g. "1. 2. 3. 4. 5. 6").
 *
 * Public by necessity (Plivo must fetch it), but only speaks OTP digits that
 * are already being delivered to the verified phone owner. Input is validated
 * to prevent XML/script injection.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawCode = String(url.searchParams.get("code") || "");

  if (!rawCode || rawCode.length > 50 || /[<>&"']/.test(rawCode)) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Speak>Invalid request.</Speak><Hangup/></Response>`,
      { status: 400, headers: { "Content-Type": "application/xml" } }
    );
  }

  const code = rawCode.replace(/[^0-9.\s]/g, "");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Wait length="1"/>
  <Speak voice="Polly.Aditi" language="hi-IN">Namaste. Barber Now se aapka verification code hai:</Speak>
  <Wait length="1"/>
  <Speak voice="Polly.Aditi" language="hi-IN">${code}</Speak>
  <Wait length="2"/>
  <Speak voice="Polly.Aditi" language="hi-IN">Main dobara bolta hoon. Aapka code hai:</Speak>
  <Wait length="1"/>
  <Speak voice="Polly.Aditi" language="hi-IN">${code}</Speak>
  <Wait length="1"/>
  <Speak voice="Polly.Aditi" language="hi-IN">Dhanyavaad.</Speak>
</Response>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
