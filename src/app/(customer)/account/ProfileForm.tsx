"use client";

import { useActionState } from "react";
import { updateProfileName } from "../booking/actions";
import { LoaderCircle, Check } from "lucide-react";

export function ProfileForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState(updateProfileName, { error: null });
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-medium text-ink/70">Your name</label>
      <div className="flex gap-2">
        <input
          name="fullName"
          defaultValue={initialName}
          placeholder="e.g. Rahul Sharma"
          maxLength={60}
          className="flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <button disabled={pending} className="btn-gold px-5 text-sm">
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : "Save"}
        </button>
      </div>
      <p className="text-xs text-ink/40">Shown to the barber when you book, and on your reviews.</p>
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      {state.ok && (
        <p className="flex items-center gap-1 text-sm text-emerald-600">
          <Check size={14} /> Saved
        </p>
      )}
    </form>
  );
}
