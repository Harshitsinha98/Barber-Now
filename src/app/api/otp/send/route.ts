import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/otp/service";
import type { ChannelType } from "@/lib/otp/config";

const ALLOWED: ChannelType[] = ["whatsapp", "sms", "voice"];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone ?? "");
    const channelRaw = String(body?.channel ?? "");
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const preferred = ALLOWED.includes(channelRaw as ChannelType)
      ? (channelRaw as ChannelType)
      : null;

    const result = await sendOtp(phone, preferred);
    if (!result.ok) {
      return NextResponse.json(result, { status: result.retryAfter ? 429 : 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    // Surface the real cause in dev (e.g. missing SUPABASE_SERVICE_ROLE_KEY)
    // so setup issues are obvious; stay generic in production.
    const detail =
      process.env.NODE_ENV !== "production" ? ` (${(e as Error).message})` : "";
    return NextResponse.json(
      { error: `Could not send verification code.${detail}` },
      { status: 500 }
    );
  }
}
