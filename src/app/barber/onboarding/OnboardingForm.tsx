"use client";

import { useActionState, useState } from "react";
import { createShop, type OnboardState } from "./actions";
import { useGeolocation } from "@/lib/useGeolocation";
import { Crosshair, LoaderCircle, Store, ArrowRight } from "lucide-react";

const initial: OnboardState = { error: null };

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(createShop, initial);
  const { coords, status, locate } = useGeolocation();
  const [priceLevel, setPriceLevel] = useState("2");

  return (
    <form action={formAction} className="space-y-4">
      {/* hidden geo fields */}
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />
      <input type="hidden" name="priceLevel" value={priceLevel} />

      <Field label="Shop name *" name="name" placeholder="e.g. Sharma Men's Salon" required />
      <Field label="Tagline" name="tagline" placeholder="e.g. Traditional cuts, modern comfort" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Area / Locality *" name="area" placeholder="e.g. Lajpat Nagar" required />
        <Field label="City *" name="city" placeholder="e.g. New Delhi" required />
      </div>

      <Field label="Full address" name="address" placeholder="Shop no, street, landmark" />
      <Field label="Opening hours" name="openHours" placeholder="e.g. 9:00 AM – 9:00 PM" />

      {/* Price level */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/70">
          Price level
        </label>
        <div className="flex gap-2">
          {[
            { v: "1", label: "₹ Budget" },
            { v: "2", label: "₹₹ Standard" },
            { v: "3", label: "₹₹₹ Premium" },
          ].map((p) => (
            <button
              key={p.v}
              type="button"
              onClick={() => setPriceLevel(p.v)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                priceLevel === p.v
                  ? "border-gold bg-gold/10 text-ink"
                  : "border-black/10 text-ink/60 hover:border-black/25"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="rounded-xl border border-black/10 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Shop location</p>
            <p className="text-xs text-ink/50">
              {status === "granted" && coords
                ? "✅ Location captured — customers can find you nearby."
                : "Set your location so nearby customers can discover you."}
            </p>
          </div>
          <button
            type="button"
            onClick={locate}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-xs font-medium text-cream hover:bg-ink-soft"
          >
            {status === "locating" ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Crosshair size={14} className="text-gold" />
            )}
            {status === "granted" ? "Update" : "Use current location"}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-gold w-full">
        {pending ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <>
            <Store size={18} /> Create my shop <ArrowRight size={16} />
          </>
        )}
      </button>
      <p className="text-center text-xs text-ink/40">
        Your shop starts as a draft. You can add services &amp; photos, then
        publish it when ready.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink/70">{label}</label>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
    </div>
  );
}
