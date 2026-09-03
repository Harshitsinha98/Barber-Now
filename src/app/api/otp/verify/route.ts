import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp/service";
import { createSessionForPhone } from "@/lib/otp/session";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone ?? "");
    const code = String(body?.code ?? "");
    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone and code are required." },
        { status: 400 }
      );
    }

    // 1) Check the OTP.
    const result = await verifyOtp(phone, code);
    if (!result.ok || !result.e164) {
      return NextResponse.json(result, { status: 400 });
    }

    // 2) Mint a real Supabase session for this phone (creates user if new).
    const session = await createSessionForPhone(result.e164);
    if (!session.ok || !session.access_token || !session.refresh_token) {
      return NextResponse.json(
        { error: session.error || "Could not sign you in." },
        { status: 500 }
      );
    }

    // 3) Persist the session in cookies (server client writes auth cookies).
    const supabase = await createClient();
    const { error: setErr } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (setErr) {
      return NextResponse.json({ error: setErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not verify code." },
      { status: 500 }
    );
  }
}
