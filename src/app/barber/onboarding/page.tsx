import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyShop } from "@/lib/supabase/queries";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/barber/login");

  // Already has a shop? Go straight to the dashboard.
  const shop = await getMyShop();
  if (shop) redirect("/barber/dashboard");

  return (
    <div className="min-h-screen bg-ink py-10">
      <div className="container-app max-w-2xl">
        <div className="mb-6 text-center text-cream">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold text-ink">
            <Store size={26} />
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold">
            Set up your shop
          </h1>
          <p className="mt-1 text-cream/60">
            Tell customers about your barbershop. Takes just a minute.
          </p>
        </div>

        <div className="rounded-2xl bg-cream p-6 shadow-premium sm:p-8">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
