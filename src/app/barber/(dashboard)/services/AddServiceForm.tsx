"use client";

import { useActionState, useEffect, useRef } from "react";
import { addService, updateService, type ServiceState } from "./actions";
import { Plus, LoaderCircle, Save } from "lucide-react";

export interface ServiceFormValues {
  id?: string;
  name?: string;
  price?: number;
  duration_minutes?: number;
  discount_percent?: number | null;
  category?: string;
  description?: string | null;
}

const QUICK = [
  { name: "Haircut", price: 200, duration: 30, category: "hair" },
  { name: "Beard trim", price: 100, duration: 15, category: "beard" },
  { name: "Shave", price: 100, duration: 20, category: "shave" },
  { name: "Hair + Beard combo", price: 280, duration: 45, category: "combo" },
  { name: "Head massage", price: 150, duration: 20, category: "spa" },
  { name: "Kids haircut", price: 150, duration: 20, category: "kids" },
];

const input =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold";

/** Used both for adding (no `initial`) and editing an existing service. */
export function ServiceForm({
  initial,
  onDone,
}: {
  initial?: ServiceFormValues;
  onDone?: () => void;
}) {
  const editing = Boolean(initial?.id);
  const [state, formAction, pending] = useActionState<ServiceState, FormData>(
    editing ? updateService : addService,
    { error: null }
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    if (!editing) formRef.current?.reset();
    onDone?.();
  }, [state, editing, onDone]);

  function quickFill(q: (typeof QUICK)[number]) {
    const f = formRef.current;
    if (!f) return;
    (f.elements.namedItem("name") as HTMLInputElement).value = q.name;
    (f.elements.namedItem("price") as HTMLInputElement).value = String(q.price);
    (f.elements.namedItem("duration") as HTMLInputElement).value = String(q.duration);
    (f.elements.namedItem("category") as HTMLSelectElement).value = q.category;
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {editing && <input type="hidden" name="id" value={initial!.id} />}

      {!editing && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink/50">Quick add</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q.name}
                type="button"
                onClick={() => quickFill(q)}
                className="rounded-full border border-black/10 px-2.5 py-1 text-xs text-ink/70 hover:border-gold hover:text-ink"
              >
                + {q.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink/60">Service name *</label>
          <input name="name" required defaultValue={initial?.name} placeholder="e.g. Haircut" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Price (₹) *</label>
          <input name="price" type="number" min="0" required defaultValue={initial?.price} placeholder="250" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Duration (min)</label>
          <input name="duration" type="number" min="1" defaultValue={initial?.duration_minutes} placeholder="30" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Discount (%)</label>
          <input
            name="discount"
            type="number"
            min="0"
            max="90"
            defaultValue={initial?.discount_percent ?? undefined}
            placeholder="optional"
            className={input}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Category</label>
          <select name="category" defaultValue={initial?.category ?? "hair"} className={input}>
            <option value="hair">Hair</option>
            <option value="beard">Beard</option>
            <option value="shave">Shave</option>
            <option value="spa">Spa / Facial</option>
            <option value="combo">Combo</option>
            <option value="kids">Kids</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink/60">Description</label>
          <input name="description" defaultValue={initial?.description ?? ""} placeholder="Short description (optional)" className={input} />
        </div>
      </div>

      {state.error && <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{state.error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-gold flex-1">
          {pending ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : editing ? (
            <>
              <Save size={16} /> Save changes
            </>
          ) : (
            <>
              <Plus size={16} /> Add service
            </>
          )}
        </button>
        {editing && (
          <button type="button" onClick={onDone} className="btn-outline">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function AddServiceForm() {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-display text-lg font-bold text-ink">Add a service</h3>
      <ServiceForm />
    </div>
  );
}
