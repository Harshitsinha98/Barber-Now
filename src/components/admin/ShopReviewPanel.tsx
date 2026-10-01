"use client";

import { useState, useTransition } from "react";
import { adminApproveShop, adminRejectShop, adminRecordPayment, adminKycLink } from "@/app/admin/actions";
import { ALL_PLANS } from "@/lib/plans";
import { CheckCircle2, XCircle, FileText, IndianRupee, LoaderCircle } from "lucide-react";

/** Expandable onboarding review + offline billing controls for one shop. */
export function ShopReviewPanel({
  shopId,
  status,
  ownerName,
  pan,
  gstin,
  pincode,
  kycPath,
}: {
  shopId: string;
  status?: string;
  ownerName?: string | null;
  pan?: string | null;
  gstin?: string | null;
  pincode?: string | null;
  kycPath?: string | null;
}) {
  const [open, setOpen] = useState(status === "submitted");
  const [docBusy, startDoc] = useTransition();

  if (status === undefined) return null; // migration 0007 not applied yet

  return (
    <div className="w-full border-t border-black/5 pt-3">
      <button onClick={() => setOpen((v) => !v)} className="text-xs font-semibold text-gold-dark">
        {open ? "Hide" : "Show"} onboarding &amp; billing ▾
      </button>
      {open && (
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <div className="space-y-1 rounded-xl bg-black/[0.03] p-3 text-xs text-ink/70">
            <p><b>Owner:</b> {ownerName || "—"}</p>
            <p><b>PAN:</b> <span className="font-mono">{pan || "—"}</span></p>
            <p><b>GSTIN:</b> <span className="font-mono">{gstin || "—"}</span></p>
            <p><b>Pincode:</b> {pincode || "—"}</p>
            {kycPath ? (
              <button
                disabled={docBusy}
                onClick={() =>
                  startDoc(async () => {
                    const url = await adminKycLink(kycPath);
                    if (url) window.open(url, "_blank", "noopener");
                  })
                }
                className="mt-1 inline-flex items-center gap-1 font-semibold text-gold-dark underline"
              >
                {docBusy ? <LoaderCircle size={12} className="animate-spin" /> : <FileText size={12} />} View document
              </button>
            ) : (
              <p className="text-ink/40">No document uploaded</p>
            )}
          </div>

          <div className="space-y-2">
            {status !== "approved" && (
              <form action={adminApproveShop}>
                <input type="hidden" name="id" value={shopId} />
                <button className="btn-gold w-full px-3 py-2 text-xs"><CheckCircle2 size={14} /> Approve &amp; verify</button>
              </form>
            )}
            <form action={adminRejectShop} className="flex gap-2">
              <input type="hidden" name="id" value={shopId} />
              <input
                name="reason"
                placeholder="Reason, e.g. PAN unclear"
                className="min-w-0 flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-xs outline-none focus:border-gold"
              />
              <button className="btn-outline px-3 py-1.5 text-xs text-rose-600"><XCircle size={13} /> {status === "approved" ? "Revoke" : "Reject"}</button>
            </form>
          </div>

          <form action={adminRecordPayment} className="space-y-2 rounded-xl border border-dashed border-black/15 p-3">
            <input type="hidden" name="id" value={shopId} />
            <p className="flex items-center gap-1 text-xs font-semibold text-ink"><IndianRupee size={12} /> Record offline payment</p>
            <select name="plan" className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs">
              {ALL_PLANS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} — ₹{p.price} / {p.days}d
                </option>
              ))}
            </select>
            <input name="note" placeholder="UPI ref / note" className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs" />
            <button className="btn-primary w-full px-3 py-1.5 text-xs">Apply payment</button>
          </form>
        </div>
      )}
    </div>
  );
}
