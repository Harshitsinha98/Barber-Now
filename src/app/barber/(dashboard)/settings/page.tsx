import { requireBarberShop } from "@/lib/barber";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const { shop } = await requireBarberShop();
  return (
    <div className="max-w-3xl p-5 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Shop settings</h1>
      <p className="mb-6 text-sm text-ink/60">This is what customers see on your shop page.</p>
      <SettingsForm shop={shop} />
    </div>
  );
}
