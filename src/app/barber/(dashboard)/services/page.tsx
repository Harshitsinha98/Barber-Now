import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyShop } from "@/lib/supabase/queries";
import type { ServiceRow } from "@/lib/supabase/database.types";
import { AddServiceForm } from "./AddServiceForm";
import { deleteService, toggleService } from "./actions";
import { formatINR } from "@/lib/utils";
import { Clock, Tag, Trash2, Scissors } from "lucide-react";

export default async function ServicesPage() {
  const shop = await getMyShop();
  if (!shop) redirect("/barber/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: true });
  const services = (data as ServiceRow[]) ?? [];

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
        Services &amp; Prices
      </h1>
      <p className="text-sm text-ink/60">
        Add and manage your services, prices and discounts.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Add form */}
        <div>
          <AddServiceForm />
        </div>

        {/* List */}
        <div>
          {services.length === 0 ? (
            <div className="card flex flex-col items-center justify-center p-10 text-center">
              <Scissors size={32} className="text-ink/20" />
              <p className="mt-3 font-medium text-ink">No services yet</p>
              <p className="text-sm text-ink/50">
                Add your first service to start taking bookings.
              </p>
            </div>
          ) : (
            <div className="card divide-y divide-black/5">
              {services.map((s) => {
                const discounted =
                  s.discount_percent && s.discount_percent > 0
                    ? Math.round(s.price * (1 - s.discount_percent / 100))
                    : null;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-4 ${
                      s.is_active ? "" : "opacity-50"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ink">{s.name}</p>
                        <span className="badge bg-black/5 text-ink/60 capitalize">
                          {s.category}
                        </span>
                        {s.discount_percent ? (
                          <span className="badge bg-emerald-50 text-emerald-700">
                            <Tag size={10} /> {s.discount_percent}% off
                          </span>
                        ) : null}
                      </div>
                      {s.description && (
                        <p className="text-xs text-ink/50">{s.description}</p>
                      )}
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/50">
                        <Clock size={11} /> {s.duration_minutes} min
                      </p>
                    </div>

                    <div className="text-right">
                      {discounted != null ? (
                        <>
                          <span className="block text-xs text-ink/40 line-through">
                            {formatINR(s.price)}
                          </span>
                          <span className="font-semibold text-ink">
                            {formatINR(discounted)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-ink">
                          {formatINR(s.price)}
                        </span>
                      )}
                    </div>

                    {/* Active toggle */}
                    <form action={toggleService}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="active" value={String(s.is_active)} />
                      <button
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          s.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-black/5 text-ink/50"
                        }`}
                        title={s.is_active ? "Click to hide" : "Click to show"}
                      >
                        {s.is_active ? "Active" : "Hidden"}
                      </button>
                    </form>

                    {/* Delete */}
                    <form action={deleteService}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        className="rounded-lg p-2 text-ink/40 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
