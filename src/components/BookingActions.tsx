"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, LoaderCircle, XCircle } from "lucide-react";
import { cancelMyBooking, submitReview } from "@/app/(customer)/booking/actions";

/** Cancel an active booking (with a confirm step). */
export function CancelBookingButton({ bookingId, compact }: { bookingId: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onCancel() {
    if (!window.confirm("Cancel this booking? Your place in the queue will be released.")) return;
    start(async () => {
      const res = await cancelMyBooking(bookingId);
      if (!res.ok) setError(res.error ?? "Could not cancel.");
      else router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-center">
      <button
        onClick={onCancel}
        disabled={pending}
        className={`btn-outline text-rose-600 hover:border-rose-300 ${compact ? "px-3 py-2 text-xs" : "text-sm"}`}
      >
        {pending ? <LoaderCircle size={14} className="animate-spin" /> : <XCircle size={14} />}
        Cancel
      </button>
      {error && <span className="mt-1 text-xs text-rose-600">{error}</span>}
    </span>
  );
}

/** Star rating + comment for a completed visit. */
export function ReviewForm({ bookingId, shopName }: { bookingId: string; shopName: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="text-sm font-medium text-emerald-700">Thanks for reviewing {shopName}! ⭐</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">How was your visit?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              size={24}
              className={(hover || rating) >= n ? "fill-gold text-gold" : "text-ink/20"}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Tell others about the cut, hygiene, wait time… (optional)"
        className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-gold"
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <button
        disabled={rating === 0 || pending}
        onClick={() =>
          start(async () => {
            const res = await submitReview(bookingId, rating, comment);
            if (!res.ok) setError(res.error ?? "Could not submit.");
            else {
              setDone(true);
              router.refresh();
            }
          })
        }
        className="btn-gold px-4 py-2 text-sm"
      >
        {pending ? <LoaderCircle size={14} className="animate-spin" /> : "Submit review"}
      </button>
    </div>
  );
}
