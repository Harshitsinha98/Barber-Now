import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client using the SECRET service-role key.
 *
 * This bypasses RLS and can use the Admin API (create users, generate
 * sessions). NEVER import this into a client component — the key must never
 * reach the browser. Guarded by "server-only".
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Add the service-role (secret) key to .env.local for OTP auth."
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
