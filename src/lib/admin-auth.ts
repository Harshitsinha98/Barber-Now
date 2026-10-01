import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSessionUser, isAdminUser } from "./auth";
import { createAdminClient } from "./supabase/admin";

export interface AdminContext {
  user: User;
  /** Service-role client — bypasses RLS. Only ever used after the admin check. */
  db: ReturnType<typeof createAdminClient>;
}

/** For admin pages: redirect away unless the caller is a platform admin. */
export async function requireAdmin(): Promise<AdminContext> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!isAdminUser(user)) redirect("/admin/login?denied=1");
  return { user, db: createAdminClient() };
}

/** For admin server actions: returns null instead of redirecting. */
export async function getAdmin(): Promise<AdminContext | null> {
  const user = await getSessionUser();
  if (!user || !isAdminUser(user)) return null;
  return { user, db: createAdminClient() };
}
