"use client";

import { useActionState, useState } from "react";
import type { ShopRow, SalonType } from "@/lib/supabase/database.types";
import { SALON_TYPES } from "@/lib/salon";
import { saveShopDetails, type OnboardState } from "./actions";
import { useGeolocation } from "@/lib/useGeolocation";
import { Crosshair, LoaderCircle, ArrowRight, CheckCircle2 } from "lucide-react";

const input =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15";

const DAYS = ["none", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Pull "9:00 AM" / "9:00 PM" back out of a stored "9:00 AM – 9:00 PM" string. */
function parseHours(h?: string | null) {
  const m = /^(.+?)\s*[–-]\s*(.+?)(?:\s*·\s*Closed\s+(\w+))?$/.exec(h ?? "");
  return { opens: m?.[1] ?? "", closes: m?.[2] ?? "", off: m?.[3] ?? "none" };
}

/** Step 1 — shop & owner details (creates the shop on first save). */
export function OnboardingForm({ shop }: { shop?: ShopRow | null }) {
  const [state, formAction, pending] = useActionState<OnboardState, FormData>(saveShopDetails, { error: null });
  const { coords, status, locate } = useGeolocation();
  const [priceLevel, setPriceLevel] = useState(shop?.price_level ?? "2");
  const [salonType, setSalonType] = useState<SalonType>(shop?.salon_type ?? "men");
  const h = parseHours(shop?.open_hours);
  const lat = coords?.lat ?? shop?.lat ?? null;
  const lng = coords?.lng ?? shop?.lng ?? null;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />
      <input type="hidden" name="priceLevel" value={priceLevel} />

      <Group title="What kind of salon?">
        <input type="hidden" name="salonType" value={salonType} />
        <div className="grid gap-3 sm:grid-cols-3">
          {SALON_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSalonType(t.value)}
              className={`rounded-2xl border p-4 text-left transition ${
                salonType === t.value ? "border-gold bg-gold/10 ring-4 ring-gold/15" : "border-black/10 hover:border-black/25"
              }`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <p className="mt-2 text-sm font-semibold text-ink">{t.label}</p>
              <p className="text-xs text-ink/50">{t.desc}</p>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 rounded-xl bg-black/[0.03] p-3 text-sm text-ink/70">
          <input type="checkbox" name="femaleStaff" defaultChecked={shop?.female_staff === true} className="h-4 w-4 accent-gold" />
          We have female stylists / beauticians (shown as a badge to customers)
        </label>
      </Group>

      <Group title="About your shop">
        <Field label="Shop name *">
          <input name="name" required defaultValue={shop?.name} placeholder="e.g. Glow Studio Unisex Salon" className={input} />
        </Field>
        <Field label="Owner's full name *">
          <input name="ownerName" required defaultValue={shop?.owner_name ?? ""} placeholder="As on your PAN" className={input} />
        </Field>
        <Field label="Tagline">
          <input name="tagline" defaultValue={shop?.tagline ?? ""} placeholder="e.g. Sharp fades, hot towel shaves" className={input} />
        </Field>
        <Field label="Price range">
          <div className="grid grid-cols-3 gap-2">
            {(["1", "2", "3"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPriceLevel(v)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  priceLevel === v ? "border-gold bg-gold/10 text-ink" : "border-black/10 text-ink/60 hover:border-black/25"
                }`}
              >
                {"₹".repeat(Number(v))} {v === "1" ? "Budget" : v === "2" ? "Standard" : "Premium"}
              </button>
            ))}
          </div>
        </Field>
      </Group>

      <Group title="Location">
        <Field label="Shop address">
          <input name="address" defaultValue={shop?.address ?? ""} placeholder="Shop no, building, street, landmark" className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Area *">
            <input name="area" required defaultValue={shop?.area ?? ""} placeholder="Lajpat Nagar" className={input} />
          </Field>
          <Field label="City *">
            <input name="city" required defaultValue={shop?.city ?? ""} placeholder="New Delhi" className={input} />
          </Field>
          <Field label="Pincode">
            <input name="pincode" inputMode="numeric" maxLength={6} defaultValue={shop?.pincode ?? ""} placeholder="110024" className={input} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-black/15 p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Pin your shop on the map</p>
            <p className="text-xs text-ink/50">
              {lat && lng
                ? `📍 Pinned at ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
                : "Stand inside your shop and tap the button — nearby customers will find you."}
            </p>
          </div>
          <button type="button" onClick={locate} className="btn-primary px-4 py-2 text-xs">
            {status === "locating" ? <LoaderCircle size={14} className="animate-spin" /> : lat && lng ? <CheckCircle2 size={14} className="text-gold" /> : <Crosshair size={14} className="text-gold" />}
            {lat && lng ? "Re-pin" : "Use current location"}
          </button>
        </div>
      </Group>

      <Group title="Timings">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Opens at">
            <input name="opens" defaultValue={h.opens || "9:00 AM"} className={input} />
          </Field>
          <Field label="Closes at">
            <input name="closes" defaultValue={h.closes || "9:00 PM"} className={input} />
          </Field>
          <Field label="Weekly off">
            <select name="weeklyOff" defaultValue={h.off} className={input}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d === "none" ? "Open all 7 days" : d}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Group>

      {state.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-gold w-full py-3.5 text-base sm:w-auto sm:px-10">
        {pending ? <LoaderCircle size={18} className="animate-spin" /> : (<>Save &amp; continue <ArrowRight size={16} /></>)}
      </button>
    </form>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-ink/40">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink/70">{label}</label>
      {children}
    </div>
  );
}
