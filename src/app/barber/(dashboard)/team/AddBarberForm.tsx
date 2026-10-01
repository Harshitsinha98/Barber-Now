"use client";

import { useActionState, useEffect, useRef } from "react";
import { addBarber, type TeamState } from "./actions";
import { UserPlus, LoaderCircle } from "lucide-react";

const input =
  "w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-gold";

export function AddBarberForm() {
  const [state, action, pending] = useActionState<TeamState, FormData>(addBarber, { error: null });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="card space-y-3 p-5">
      <h3 className="font-display text-lg font-bold text-ink">Add a team member</h3>
      <input name="name" required placeholder="Name, e.g. Raju Sharma" className={input} />
      <input name="experience" type="number" min="0" placeholder="Years of experience" className={input} />
      <input name="specialities" placeholder="Specialities (comma separated): Fades, Beard" className={input} />
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <button disabled={pending} className="btn-gold w-full">
        {pending ? <LoaderCircle size={16} className="animate-spin" /> : (<><UserPlus size={16} /> Add barber</>)}
      </button>
    </form>
  );
}
