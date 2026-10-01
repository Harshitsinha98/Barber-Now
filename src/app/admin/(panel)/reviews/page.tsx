import { requireAdmin } from "@/lib/admin-auth";
import type { ReviewRow, ShopRow } from "@/lib/supabase/database.types";
import { PageHeader, FilterTabs, Empty } from "@/components/admin/ui";
import { adminDeleteReview } from "../../actions";
import { Star, Trash2 } from "lucide-react";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ rating?: string }>;
}) {
  const { rating = "all" } = await searchParams;
  const { db } = await requireAdmin();

  const [{ data: reviewData }, { data: shopData }] = await Promise.all([
    db.from("reviews").select("*").order("created_at", { ascending: false }).limit(300),
    db.from("shops").select("id, name"),
  ]);
  const all = (reviewData as ReviewRow[]) ?? [];
  const shops = new Map(((shopData as Pick<ShopRow, "id" | "name">[]) ?? []).map((s) => [s.id, s.name]));
  const list = all.filter((r) => (rating === "low" ? r.rating <= 2 : rating === "all" ? true : r.rating === Number(rating)));

  return (
    <div className="space-y-5 p-5 sm:p-8">
      <PageHeader title="Reviews" subtitle="Moderate abusive or fake reviews. Low ratings can flag service problems." />
      <FilterTabs
        base="/admin/reviews"
        param="rating"
        current={rating}
        options={[
          { value: "all", label: "All", count: all.length },
          { value: "low", label: "⚠️ 1–2 stars", count: all.filter((r) => r.rating <= 2).length },
          { value: "5", label: "5 stars", count: all.filter((r) => r.rating === 5).length },
        ]}
      />

      {list.length === 0 ? (
        <Empty>No reviews here.</Empty>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="card flex items-start gap-4 p-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={14} className={r.rating >= n ? "fill-gold text-gold" : "text-ink/15"} />
                    ))}
                  </span>
                  <span className="font-medium text-ink">{r.reviewer_name || "Customer"}</span>
                  <span className="text-xs text-ink/40">on</span>
                  <span className="text-sm font-medium text-ink">{shops.get(r.shop_id) ?? "—"}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-ink/70">{r.comment}</p>}
                <p className="mt-1 text-xs text-ink/40">
                  {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <form action={adminDeleteReview}>
                <input type="hidden" name="id" value={r.id} />
                <button className="rounded-lg p-2 text-ink/40 hover:bg-rose-50 hover:text-rose-600" title="Delete review">
                  <Trash2 size={16} />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
