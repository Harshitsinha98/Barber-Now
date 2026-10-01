"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addWalkIn, type WalkInState } from "./actions";
import { UserPlus, LoaderCircle, X } from "lucide-react";

export function WalkInForm({
  services,
  barbers,
}: {
  services: { id: string; name: string; price: number }[];
  barbers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<WalkInState, FormData>(addWalkIn, { error: null });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-gold text-sm">
        <UserPlus size={16} /> Add walk-in
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <form ref={formRef} action={action} className="card w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Add walk-in customer</h3>
          <button type="button" onClick={() => setOpen(false)} className="text-ink/40 hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Customer name"
            className="rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <input
            name="phone"
            inputMode="numeric"
            placeholder="Phone (optional)"
            className="rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-ink/60">Services *</p>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {services.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/10 px-3 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10"
              >
                <input type="checkbox" name="services" value={s.id} className="accent-gold" />
                <span className="flex-1">{s.name}</span>
                <span className="text-ink/50">₹{s.price}</span>
              </label>
            ))}
          </div>
        </div>

        {barbers.length > 0 && (
          <select
            name="barber"
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="">Any barber</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
        <button disabled={pending} className="btn-gold w-full">
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : "Add to queue"}
        </button>
      </form>
    </div>
  );
}
