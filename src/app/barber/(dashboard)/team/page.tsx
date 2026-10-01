import Image from "next/image";
import { requireBarberShop } from "@/lib/barber";
import type { BarberRow } from "@/lib/supabase/database.types";
import { avatarFor } from "@/lib/shops";
import { AddBarberForm } from "./AddBarberForm";
import { removeBarber, toggleBarber } from "./actions";
import { Trash2, UserCog } from "lucide-react";

export default async function TeamPage() {
  const { supabase, shop } = await requireBarberShop();
  const { data } = await supabase
    .from("barbers")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: true });
  const team = (data as BarberRow[]) ?? [];

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Team</h1>
      <p className="text-sm text-ink/60">
        Customers can pick their favourite barber while booking. Mark someone “Away” on days off.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        <AddBarberForm />
        {team.length === 0 ? (
          <div className="card flex flex-col items-center justify-center p-10 text-center">
            <UserCog size={32} className="text-ink/20" />
            <p className="mt-3 font-medium text-ink">No team members yet</p>
            <p className="text-sm text-ink/50">Solo barber? You can skip this — customers will book “Any barber”.</p>
          </div>
        ) : (
          <div className="grid h-fit gap-3 sm:grid-cols-2">
            {team.map((b) => (
              <div key={b.id} className={`card flex items-center gap-3 p-4 ${b.is_active ? "" : "opacity-60"}`}>
                <Image
                  src={b.avatar_url || avatarFor(b.name)}
                  alt={b.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{b.name}</p>
                  <p className="truncate text-xs text-ink/50">
                    {b.experience_years} yrs{b.specialities.length > 0 && ` · ${b.specialities.join(", ")}`}
                  </p>
                </div>
                <form action={toggleBarber}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="active" value={String(b.is_active)} />
                  <button
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-ink/50"
                    }`}
                  >
                    {b.is_active ? "Working" : "Away"}
                  </button>
                </form>
                <form action={removeBarber}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="rounded-lg p-2 text-ink/40 hover:bg-rose-50 hover:text-rose-600" title="Remove">
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
