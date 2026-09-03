"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

/** Barber sign up (email + password), then mark profile role = 'barber'. */
export async function signUpBarber(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 6) {
    return { error: "Please fill all fields (password min 6 characters)." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: error.message };

  // Mark this profile as a barber (trigger already created the row).
  if (data.user) {
    await supabase
      .from("profiles")
      .update({ role: "barber", full_name: fullName })
      .eq("id", data.user.id);
  }

  // If email confirmation is OFF, a session exists → go to dashboard.
  // If it's ON, there is no session yet → tell the user to check email.
  if (data.session) {
    revalidatePath("/barber", "layout");
    redirect("/barber/onboarding");
  }

  redirect("/barber/login?checkEmail=1");
}

/** Barber login (email + password). */
export async function loginBarber(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/barber");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  revalidatePath("/barber", "layout");
  redirect(next || "/barber");
}

/** Log out and return to the barber login page. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/barber/login");
}
