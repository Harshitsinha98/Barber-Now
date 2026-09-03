"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  // Surfaced early so misconfiguration is obvious in dev.
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
      "Copy .env.example to .env.local and fill in your project values."
  );
}

/**
 * Browser Supabase client (used in client components).
 * The publishable key is public-safe; access is enforced by RLS policies.
 */
export function createClient() {
  return createBrowserClient(url!, key!);
}
