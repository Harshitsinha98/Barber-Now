"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveDocuments, saveKycDocPath, submitForReview, type OnboardState } from "./actions";
import { ArrowRight, FileCheck2, LoaderCircle, Lock, Upload, Send } from "lucide-react";

const input =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm uppercase tracking-wider outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15";

/** Step 4 — PAN / GSTIN + optional registration document. */
export function DocumentsForm({
  userId,
  pan,
  gstin,
  hasDoc,
}: {
  userId: string;
  pan?: string | null;
  gstin?: string | null;
  hasDoc: boolean;
}) {
  const [state, action, pending] = useActionState<OnboardState, FormData>(saveDocuments, { error: null });

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">PAN (owner or business) *</label>
          <input name="pan" required maxLength={10} defaultValue={pan ?? ""} placeholder="ABCDE1234F" className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">GSTIN (optional)</label>
          <input name="gstin" maxLength={15} defaultValue={gstin ?? ""} placeholder="07ABCDE1234F1Z5" className={input} />
        </div>
      </div>

      <KycUpload userId={userId} hasDoc={hasDoc} />

      <label className="flex items-start gap-3 rounded-xl bg-black/[0.03] p-4 text-sm text-ink/70">
        <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 accent-gold" />
        <span>
          I confirm these details are correct and agree to the BarberNow partner terms: ₹1,499/month
          subscription, 0% commission on services, and customer payments go directly to my shop.
        </span>
      </label>

      {state.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}
      <button disabled={pending} className="btn-gold py-3.5 sm:px-10">
        {pending ? <LoaderCircle size={18} className="animate-spin" /> : (<>Save &amp; continue <ArrowRight size={16} /></>)}
      </button>
    </form>
  );
}

function KycUpload({ userId, hasDoc }: { userId: string; hasDoc: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(hasDoc);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^(image\/|application\/pdf)/.test(file.type)) return setError("Upload a photo or PDF.");
    if (file.size > 5 * 1024 * 1024) return setError("File must be under 5 MB.");
    setBusy(true);
    setError(null);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/registration-${Date.now()}.${ext}`;
    const { error: upErr } = await createClient().storage.from("kyc-docs").upload(path, file);
    if (upErr) {
      setError(upErr.message);
    } else {
      const res = await saveKycDocPath(path);
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else setError(res.error ?? "Could not save.");
    }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-black/15 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
          {done ? <FileCheck2 size={18} /> : <Lock size={18} />}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">
            Shop registration / trade licence <span className="font-normal text-ink/40">(optional, speeds up verification)</span>
          </p>
          <p className="text-xs text-ink/50">
            {done ? "✅ Document uploaded — stored privately." : "Photo or PDF. Only the BarberNow review team can see it."}
          </p>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" />
      <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="btn-outline px-4 py-2 text-xs">
        {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Upload size={14} />}
        {done ? "Replace" : "Upload"}
      </button>
      {error && <p className="w-full text-xs text-rose-600">{error}</p>}
    </div>
  );
}

/** Final step — send the shop for review. */
export function SubmitButton({ ready }: { ready: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        disabled={!ready || pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await submitForReview();
            if (!res.ok) setError(res.error ?? "Could not submit.");
            else router.refresh();
          })
        }
        className="btn-primary w-full py-3.5 text-base"
      >
        {pending ? <LoaderCircle size={18} className="animate-spin" /> : (<><Send size={16} /> Submit for verification</>)}
      </button>
      {!ready && <p className="mt-2 text-center text-xs text-ink/50">Finish the steps marked ○ first.</p>}
      {error && <p className="mt-2 text-center text-xs text-rose-600">{error}</p>}
    </div>
  );
}
