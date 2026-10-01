import { requireBarberShop } from "@/lib/barber";
import type { ReviewRow } from "@/lib/supabase/database.types";
import { Star, MessageSquareQuote } from "lucide-react";

export default async function BarberReviewsPage() {
  const { supabase, shop } = await requireBarberShop();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });
  const reviews = (data as ReviewRow[]) ?? [];
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));

  return (
    <div className="p-5 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Reviews</h1>
      <p className="text-sm text-ink/60">Customers can review after you mark their visit “Done”.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="card h-fit p-5">
          <p className="font-display text-5xl font-bold text-ink">{reviews.length ? avg.toFixed(1) : "—"}</p>
          <div className="mt-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} size={18} className={avg >= n - 0.25 ? "fill-gold text-gold" : "text-ink/15"} />
            ))}
          </div>
          <p className="mt-1 text-sm text-ink/50">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
          <div className="mt-4 space-y-1.5">
            {dist.map(({ n, c }) => (
              <div key={n} className="flex items-center gap-2 text-xs text-ink/60">
                <span className="w-3">{n}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                  <div className="h-full bg-gold" style={{ width: `${reviews.length ? (c / reviews.length) * 100 : 0}%` }} />
                </div>
                <span className="w-6 text-right">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="card flex flex-col items-center justify-center p-10 text-center">
            <MessageSquareQuote size={32} className="text-ink/20" />
            <p className="mt-3 font-medium text-ink">No reviews yet</p>
            <p className="text-sm text-ink/50">Great service + marking visits “Done” brings in reviews.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">{r.reviewer_name || "Customer"}</p>
                  <span className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={14} className={r.rating >= n ? "fill-gold text-gold" : "text-ink/15"} />
                    ))}
                  </span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-ink/70">{r.comment}</p>}
                <p className="mt-1 text-xs text-ink/40">
                  {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
