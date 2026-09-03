"use client";

import { useActionState, useEffect, useRef } from "react";
import { addService, type ServiceState } from "./actions";
import { Plus, LoaderCircle } from "lucide-react";

const initial: ServiceState = { error: null };

export function AddServiceForm() {
  const [state, formAction, pending] = useActionState(addService, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a successful add.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="card p-5">
      <h3 className="mb-4 font-display text-lg font-bold text-ink">
        Add a service
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink/60">
            Service name *
          </label>
          <input
            name="name"
            required
            placeholder="e.g. Haircut"
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">
            Price (₹) *
          </label>
          <input
            name="price"
            type="number"
            min="0"
            required
            placeholder="250"
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">
            Duration (min)
          </label>
          <input
            name="duration"
            type="number"
            min="1"
            placeholder="30"
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">
            Discount (%)
          </label>
          <input
            name="discount"
            type="number"
            min="0"
            max="90"
            placeholder="optional"
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">
            Category
          </label>
          <select
            name="category"
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="hair">Hair</option>
            <option value="beard">Beard</option>
            <option value="shave">Shave</option>
            <option value="spa">Spa</option>
            <option value="combo">Combo</option>
            <option value="kids">Kids</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink/60">
            Description
          </label>
          <input
            name="description"
            placeholder="Short description (optional)"
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>
      </div>

      {state.error && (
        <p className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-gold mt-4 w-full">
        {pending ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <>
            <Plus size={16} /> Add service
          </>
        )}
      </button>
    </form>
  );
}
