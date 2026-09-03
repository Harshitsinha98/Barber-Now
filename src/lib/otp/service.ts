import "server-only";
/**
 * Multi-channel OTP service (Supabase-backed).
 *
 *  - Generates a numeric code and stores only its SHA-256 (peppered) hash in
 *    the `otp_verifications` table — the plaintext code never persists.
 *  - Enforces send rate-limits (cooldown + max sends per rolling window) and
 *    verify attempt-limits, so the endpoint can't be abused.
 *  - Delivers via the WhatsApp → SMS → Voice fallback chain.
 *
 * Security notes:
 *  - Codes are single-use and expire after `ttlSeconds`.
 *  - Too many wrong attempts invalidates the code.
 *  - In dev with NO provider configured, the code is returned as `devCode`
 *    purely so the flow is testable locally. NEVER in production.
 */
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { otpConfig, type ChannelType } from "./config";
import { sendViaChannels } from "./channels";

const isProd = process.env.NODE_ENV === "production";
const nowMs = () => Date.now();

export function toE164(phone: string): string {
  return "+91" + String(phone || "").replace(/\D/g, "").slice(-10);
}

function generateCode(length: number): string {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(length, "0");
}

function hashCode(code: string, e164: string): string {
  return crypto
    .createHash("sha256")
    .update(`${code}:${e164}:${otpConfig.hashPepper}`)
    .digest("hex");
}

interface OtpRow {
  phone: string;
  code_hash: string;
  expires_at_ms: number;
  attempts: number;
  last_sent_at_ms: number;
  send_timestamps: number[];
  last_channel: string | null;
  verified: boolean;
}

export interface SendOtpResult {
  ok: boolean;
  channel?: string;
  error?: string;
  retryAfter?: number;
  devCode?: string;
}

/** Generate, persist and deliver an OTP. */
export async function sendOtp(
  phone: string,
  preferredChannel: ChannelType | null = null
): Promise<SendOtpResult> {
  const e164 = toE164(phone);
  if (e164.length !== 13) return { ok: false, error: "Invalid phone number." };

  // The service-role key is required to store/verify OTPs. Fail cleanly with a
  // helpful message instead of throwing if it's not configured yet.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error:
        "OTP backend not fully configured (missing SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  // Test-account bypass: skip delivery entirely.
  if (otpConfig.testPhone && e164 === toE164(otpConfig.testPhone)) {
    return { ok: true, channel: "test" };
  }

  const supabase = createAdminClient();
  const { data: prev } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("phone", e164)
    .maybeSingle<OtpRow>();

  // Rate limits ---------------------------------------------------------
  if (prev) {
    const sinceLast = (nowMs() - (prev.last_sent_at_ms || 0)) / 1000;
    if (sinceLast < otpConfig.resendCooldownSeconds) {
      return {
        ok: false,
        error: "Please wait before requesting another code.",
        retryAfter: Math.ceil(otpConfig.resendCooldownSeconds - sinceLast),
      };
    }
    const windowStart = nowMs() - otpConfig.sendWindowSeconds * 1000;
    const recentSends = (prev.send_timestamps || []).filter((t) => t > windowStart);
    if (recentSends.length >= otpConfig.maxSendsPerWindow) {
      return { ok: false, error: "Too many code requests. Please try again later." };
    }
  }

  // Generate + persist --------------------------------------------------
  const code = generateCode(otpConfig.codeLength);
  const expiresAtMs = nowMs() + otpConfig.ttlSeconds * 1000;
  const windowStart = nowMs() - otpConfig.sendWindowSeconds * 1000;
  const sendTimestamps = [
    ...((prev?.send_timestamps as number[]) || []).filter((t) => t > windowStart),
    nowMs(),
  ];

  // Deliver (or dev fallback) ------------------------------------------
  let channel: string | null = null;
  if (otpConfig.enabled) {
    const result = await sendViaChannels(e164, code, preferredChannel);
    if (!result.ok) {
      return {
        ok: false,
        error: preferredChannel
          ? `Could not send the code via ${preferredChannel}. Please try another option.`
          : "Could not send the verification code. Please try again.",
      };
    }
    channel = result.channel!;
  } else if (isProd) {
    return { ok: false, error: "OTP service is not configured." };
  } else {
    channel = "dev";
  }

  await supabase.from("otp_verifications").upsert({
    phone: e164,
    code_hash: hashCode(code, e164),
    expires_at_ms: expiresAtMs,
    attempts: 0,
    last_sent_at_ms: nowMs(),
    send_timestamps: sendTimestamps,
    last_channel: channel,
    verified: false,
    verified_at_ms: null,
  });

  return {
    ok: true,
    channel,
    ...(channel === "dev" ? { devCode: code } : {}),
  };
}

export interface VerifyOtpResult {
  ok: boolean;
  e164?: string;
  error?: string;
}

/** Verify a submitted code. */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const e164 = toE164(phone);

  // Test-account bypass.
  if (otpConfig.testPhone && e164 === toE164(otpConfig.testPhone)) {
    if (String(code || "").trim() === otpConfig.testCode) return { ok: true, e164 };
    return { ok: false, error: "Incorrect code. Please check and try again." };
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("phone", e164)
    .maybeSingle<OtpRow>();

  if (!data) return { ok: false, error: "No code found. Please request a new one." };
  if (data.verified) return { ok: false, error: "This code was already used. Request a new one." };
  if (nowMs() > data.expires_at_ms) return { ok: false, error: "Code expired. Please request a new one." };
  if ((data.attempts || 0) >= otpConfig.maxAttempts) {
    await supabase.from("otp_verifications").delete().eq("phone", e164);
    return { ok: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  const matches = hashCode(String(code || "").trim(), e164) === data.code_hash;
  if (!matches) {
    await supabase
      .from("otp_verifications")
      .update({ attempts: (data.attempts || 0) + 1 })
      .eq("phone", e164);
    return { ok: false, error: "Incorrect code. Please check and try again." };
  }

  // Single-use: mark verified so the same code can't be replayed.
  await supabase
    .from("otp_verifications")
    .update({ verified: true, verified_at_ms: nowMs() })
    .eq("phone", e164);

  return { ok: true, e164 };
}
