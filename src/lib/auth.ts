import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

/** Last 10 digits of an Indian phone, regardless of +91 / 91 prefix. */
export function phoneDigits(phone?: string | null): string {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

/** Phone of a Supabase user (stored on the user and in metadata by OTP login). */
export function userPhone(user: User): string {
  return phoneDigits(user.phone || (user.user_metadata?.phone as string | undefined));
}

/** "+91 98765 43210" */
export function formatPhone(phone?: string | null): string {
  const d = phoneDigits(phone);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : String(phone || "");
}

/** Best display name for a user. */
export function displayName(user: User): string {
  const name = (user.user_metadata?.full_name as string | undefined)?.trim();
  return name || formatPhone(userPhone(user)) || "Customer";
}

/** Current logged-in user, or null. Never throws. */
export async function getSessionUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Platform admins are configured by phone number, comma-separated:
 *   ADMIN_PHONES=9653043939,9876543210
 * Keeping admin identity in a server-only env var means no one can promote
 * themselves through the database.
 */
export function isAdminUser(user: User | null): boolean {
  if (!user) return false;
  const allowed = String(process.env.ADMIN_PHONES || "")
    .split(",")
    .map(phoneDigits)
    .filter((p) => p.length === 10);
  return allowed.includes(userPhone(user));
}
