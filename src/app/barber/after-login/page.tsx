import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * OtpLogin redirects here after a successful barber OTP verification.
 * We mark the profile role = 'barber' and route to onboarding or dashboard.
 *
 * IMPORTANT: redirect() works by throwing NEXT_REDIRECT, so the destination is
 * computed inside try/catch (which swallows real DB errors) and redirect() is
 * called OUTSIDE the try/catch.
 */
export default async function AfterLoginPage() {
  let destination = "/barber/onboarding";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/barber/login");
    }

    // Mark as barber (idempotent). Ignore errors — non-critical.
    await supabase
      .from("profiles")
      .update({ role: "barber" })
      .eq("id", user.id);

    // Already has a shop? → dashboard, else → onboarding.
    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (shop) destination = "/barber/dashboard";

    revalidatePath("/barber", "layout");
  } catch (err) {
    // Let Next's redirect signal propagate; only swallow real errors.
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    // On any real failure, fall back to onboarding rather than crashing.
    destination = "/barber/onboarding";
  }

  redirect(destination);
}
