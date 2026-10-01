import { requireBarberShop } from "@/lib/barber";
import type { ServiceRow } from "@/lib/supabase/database.types";
import { AddServiceForm } from "./AddServiceForm";
import { ServiceRowItem } from "./ServiceRowItem";
import { Scissors } from "lucide-react";

export default async function ServicesPage() {
  const { supabase, shop } = await requireBarberShop();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: true });
  const services = (data as ServiceRow[]) ?? [];
  const active = services.filter((s) => s.is_active).length;

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Services &amp; prices</h1>
      <p className="text-sm text-ink/60">
        {services.length} service{services.length === 1 ? "" : "s"} · {active} visible to customers.
        Add offers with the discount field.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <div>
          <AddServiceForm salonType={shop.salon_type} />
        </div>
        <div>
          {services.length === 0 ? (
            <div className="card flex flex-col items-center justify-center p-10 text-center">
              <Scissors size={32} className="text-ink/20" />
              <p className="mt-3 font-medium text-ink">No services yet</p>
              <p className="text-sm text-ink/50">Use “Quick add” to set up your menu in seconds.</p>
            </div>
          ) : (
            <div className="card divide-y divide-black/5 overflow-hidden">
              {services.map((s) => (
                <ServiceRowItem key={s.id} s={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
