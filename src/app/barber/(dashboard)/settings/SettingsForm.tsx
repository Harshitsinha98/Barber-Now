"use client";

import { useActionState, useState } from "react";
import type { ShopRow } from "@/lib/supabase/database.types";
import { updateShopSettings, type SettingsState } from "./actions";
import { useGeolocation } from "@/lib/useGeolocation";
import { Crosshair, LoaderCircle, Save, Check } from "lucide-react";

const AMENITIES = [
  "AC",
  "UPI / Cards",
  "Sanitised tools",
  "Kids friendly",
  "Wi-Fi",
  "Parking",
  "Women welcome",
  "Complimentary beverage",
  "Home service",
];

const input =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold";

export function SettingsForm({ shop }: { shop: ShopRow }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateShopSettings, { error: null });
  const { coords, status, locate } = useGeolocation();
  const [priceLevel, setPriceLevel] = useState(shop.price_level);
  const lat = coords?.lat ?? shop.lat;
  const lng = coords?.lng ?? shop.lng;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />
      <input type="hidden" name="priceLevel" value={priceLevel} />

      <Card title="Basic details">
        <Field label="Shop name *">
          <input name="name" required defaultValue={shop.name} className={input} />
        </Field>
        <Field label="Tagline">
          <input name="tagline" defaultValue={shop.tagline ?? ""} placeholder="Traditional cuts, modern comfort" className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Opening hours">
            <input name="openHours" defaultValue={shop.open_hours ?? ""} placeholder="9:00 AM – 9:00 PM" className={input} />
          </Field>
          <Field label="Avg. minutes per customer">
            <input name="avgMinutes" type="number" min={5} max={180} defaultValue={shop.queue_avg_minutes} className={input} />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-ink/40">
          Average time is used to show customers their estimated wait. Keep it realistic.
        </p>
        <Field label="Price level">
          <div className="flex gap-2">
            {(["1", "2", "3"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPriceLevel(v)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  priceLevel === v ? "border-gold bg-gold/10 text-ink" : "border-black/10 text-ink/60"
                }`}
              >
                {"₹".repeat(Number(v))} {v === "1" ? "Budget" : v === "2" ? "Standard" : "Premium"}
              </button>
            ))}
          </div>
        </Field>
      </Card>

      <Card title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Area / Locality *">
            <input name="area" required defaultValue={shop.area ?? ""} className={input} />
          </Field>
          <Field label="City *">
            <input name="city" required defaultValue={shop.city ?? ""} className={input} />
          </Field>
        </div>
        <Field label="Full address">
          <input name="address" defaultValue={shop.address ?? ""} placeholder="Shop no, street, landmark" className={input} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/5 p-3">
          <p className="text-sm text-ink/70">
            {lat && lng ? (
              <>📍 Pinned at {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}</>
            ) : (
              "Not pinned yet — nearby customers can't find you."
            )}
          </p>
          <button
            type="button"
            onClick={locate}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-xs font-medium text-cream"
          >
            {status === "locating" ? <LoaderCircle size={14} className="animate-spin" /> : <Crosshair size={14} className="text-gold" />}
            Use my current location
          </button>
        </div>
        <p className="text-xs text-ink/40">Tip: stand inside your shop when pinning the location.</p>
      </Card>

      <Card title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <label
              key={a}
              className="cursor-pointer rounded-full border border-black/10 px-3 py-1.5 text-sm text-ink/70 has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:checked]:text-ink"
            >
              <input
                type="checkbox"
                name="amenities"
                value={a}
                defaultChecked={shop.amenities?.includes(a)}
                className="sr-only"
              />
              {a}
            </label>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-4 flex items-center gap-3">
        <button disabled={pending} className="btn-gold shadow-premium">
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : (<><Save size={16} /> Save changes</>)}
        </button>
        {state.ok && !pending && (
          <span className="flex items-center gap-1 text-sm text-emerald-600"><Check size={15} /> Saved</span>
        )}
        {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4 p-5">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink/60">{label}</label>
      {children}
    </div>
  );
}
