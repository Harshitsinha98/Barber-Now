import "server-only";
/**
 * Turns a verified phone number into a real Supabase auth session.
 *
 * Strategy (keeps RLS clean — the user IS a Supabase user):
 *  1. Find an existing auth user by phone; create one if new.
 *  2. Generate a magiclink to obtain tokens for that user, then verify the
 *     OTP hash server-side to mint an access/refresh token pair.
 *
 * We use `generateLink` + `verifyOtp` (email_otp style) is not available for
 * phone-only users, so instead we use the admin API to create the user with a
 * confirmed phone and then issue a session via `admin.generateLink` is limited.
 * The robust, supported path is to use a dedicated email alias per phone and
 * a passwordless magic token. To keep this simple and provider-agnostic we
 * create the user with phone_confirm and return the user id; the API route
 * then sets the session using a signed one-time token via `setSession`.
 *
 * NOTE: Supabase's admin API does not expose "create session for user id"
 * directly. The supported approach used here: create/confirm the user, then
 * generate an email magiclink token bound to a per-phone alias email and
 * immediately verify it to obtain tokens. This yields a normal Supabase
 * session (access + refresh) that RLS understands.
 */
import { createAdminClient } from "@/lib/supabase/admin";

/** Deterministic internal alias email for a phone-only account. */
function aliasEmail(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return `phone_${digits}@barber-now.local`;
}

export interface SessionResult {
  ok: boolean;
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

/**
 * Ensure a Supabase user exists for this phone and return a session token pair.
 */
export async function createSessionForPhone(e164: string): Promise<SessionResult> {
  const admin = createAdminClient();
  const email = aliasEmail(e164);

  // 1) Find existing user by alias email; create if missing.
  //    listUsers is paginated; for our purpose we look up via generateLink,
  //    which upserts on the alias email deterministically.
  // First, ensure the user exists with a confirmed email + phone.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    phone: e164,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { phone: e164 },
  });

  // If the user already exists, createUser errors — that's fine, continue.
  if (createErr && !/already been registered|already exists/i.test(createErr.message)) {
    // A genuine failure.
    return { ok: false, error: createErr.message };
  }
  void created;

  // 2) Generate a magiclink for the alias email, which returns an OTP token
  //    hash we can immediately verify to obtain a real session.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !linkData) {
    return { ok: false, error: linkErr?.message || "Could not create session." };
  }

  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) return { ok: false, error: "Could not create session token." };

  // 3) Verify the magiclink token hash to mint access/refresh tokens.
  const { data: verified, error: verifyErr } = await admin.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr || !verified.session) {
    return { ok: false, error: verifyErr?.message || "Could not establish session." };
  }

  return {
    ok: true,
    access_token: verified.session.access_token,
    refresh_token: verified.session.refresh_token,
  };
}
