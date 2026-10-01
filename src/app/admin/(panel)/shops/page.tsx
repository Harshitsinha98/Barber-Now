import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin-auth";
import type { ShopRow, ProfileRow } from "@/lib/supabase/database.types";
import { formatPhone } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { PageHeader, FilterTabs, SearchBox, Empty } from "@/components/admin/ui";
import { adminSetVerified, adminSetSuspended, adminSetPublished } from "../../actions";
import { BadgeCheck, Ban, Eye, EyeOff, ExternalLink, MapPin, Phone } from "lucide-react";
import { ShopReviewPanel } from "@/components/admin/ShopReviewPanel";
import { isShopLive } from "@/lib/shops";
import { isActive, daysLeft } from "@/lib/plans";

const ONB: Record<string, { label: string; cls: string }> = {
  draft: { label: "Onboarding", cls: "bg-black/5 text-ink/60" },
  submitted: { label: "⏳ Review", cls: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700" },
};

type Filter = "all" | "pending" | "verified" | "unpaid" | "draft" | "suspended";

export default async function AdminShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;
  const { db } = await requireAdmin();

  const [{ data: shopData }, { data: serviceData }, { data: bookingData }] = await Promise.all([
    db.from("shops").select("*").order("created_at", { ascending: false }),
    db.from("services").select("shop_id, is_active"),
    db.from("bookings").select("shop_id, status, total_amount"),
  ]);
  const all = (shopData as ShopRow[]) ?? [];
  const ownerIds = Array.from(new Set(all.map((s) => s.owner_id)));
  const { data: ownerData } = ownerIds.length
    ? await db.from("profiles").select("*").in("id", ownerIds)
    : { data: [] };
  const owners = new Map(((ownerData as ProfileRow[]) ?? []).map((p) => [p.id, p]));

  const services = (serviceData as { shop_id: string; is_active: boolean }[]) ?? [];
  const bookings = (bookingData as { shop_id: string; status: string; total_amount: number }[]) ?? [];

  const partner = all.some((s) => s.onboarding_status !== undefined);
  const is = (s: ShopRow, f: Filter) =>
    f === "all" ||
    (f === "pending" &&
      (partner ? s.onboarding_status === "submitted" : s.is_published && !s.is_verified) &&
      !s.is_suspended) ||
    (f === "verified" && s.is_verified && !s.is_suspended) ||
    (f === "unpaid" && s.onboarding_status === "approved" && !isActive(s.subscription_until)) ||
    (f === "draft" &&
      (partner ? s.onboarding_status === "draft" || s.onboarding_status === "rejected" : !s.is_published) &&
      !s.is_suspended) ||
    (f === "suspended" && s.is_suspended);

  const term = q.trim().toLowerCase();
  const list = all.filter(
    (s) =>
      is(s, status as Filter) &&
      (!term || [s.name, s.area, s.city, owners.get(s.owner_id)?.phone].some((v) => String(v ?? "").toLowerCase().includes(term)))
  );

  const tabs: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending review" },
    { value: "verified", label: "Verified" },
    { value: "unpaid", label: "Plan expired / unpaid" },
    { value: "draft", label: "Onboarding / rejected" },
    { value: "suspended", label: "Suspended" },
  ];

  return (
    <div className="space-y-5 p-5 sm:p-8">
      <PageHeader title="Shops" subtitle="Verify genuine partners, suspend bad actors, monitor performance.">
        <SearchBox action="/admin/shops" defaultValue={q} placeholder="Search name, city, phone…" hidden={{ status: status !== "all" ? status : undefined }} />
      </PageHeader>

      <FilterTabs
        base="/admin/shops"
        param="status"
        current={status}
        extra={{ q: q || undefined }}
        options={tabs.map((t) => ({ ...t, count: all.filter((s) => is(s, t.value)).length }))}
      />

      {list.length === 0 ? (
        <Empty>No shops match this filter.</Empty>
      ) : (
        <div className="space-y-3">
          {list.map((s) => {
            const owner = owners.get(s.owner_id);
            const svc = services.filter((x) => x.shop_id === s.id && x.is_active).length;
            const bk = bookings.filter((x) => x.shop_id === s.id);
            const gmv = bk.filter((x) => x.status === "done").reduce((a, x) => a + x.total_amount, 0);
            return (
              <div key={s.id} className="card flex flex-col flex-wrap gap-4 p-4 lg:flex-row lg:items-center">
                <div className="flex flex-1 items-center gap-4">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-black/5">
                    {s.cover_image && <Image src={s.cover_image} alt={s.name} fill className="object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                      {s.name}
                      {s.is_verified && <BadgeCheck size={16} className="text-gold-dark" />}
                      {s.is_suspended ? (
                        <span className="badge bg-rose-50 text-rose-700">Suspended</span>
                      ) : isShopLive(s) ? (
                        <span className="badge bg-emerald-50 text-emerald-700">Live</span>
                      ) : (
                        <span className="badge bg-black/5 text-ink/60">Not live</span>
                      )}
                      {s.onboarding_status && (
                        <span className={`badge ${ONB[s.onboarding_status].cls}`}>{ONB[s.onboarding_status].label}</span>
                      )}
                      {s.onboarding_status !== undefined && (
                        <span className={`badge ${isActive(s.subscription_until) ? "bg-gold/15 text-gold-dark" : "bg-rose-50 text-rose-700"}`}>
                          {isActive(s.subscription_until) ? `Plan · ${daysLeft(s.subscription_until)}d` : "No plan"}
                        </span>
                      )}
                      {isActive(s.boost_until) && <span className="badge bg-coral/15 text-coral">🚀 Boost · {daysLeft(s.boost_until)}d</span>}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-3 text-xs text-ink/50">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {[s.area, s.city].filter(Boolean).join(", ") || "—"}</span>
                      {owner?.phone && <span className="flex items-center gap-1"><Phone size={11} /> {formatPhone(owner.phone)}</span>}
                      <span>Joined {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </p>
                    <p className="mt-1 text-xs text-ink/60">
                      {svc} services · {bk.length} bookings · {formatINR(gmv)} GMV · {s.queue_people_ahead} in queue now
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ActionButton action={adminSetVerified} id={s.id} value={!s.is_verified} className={s.is_verified ? "btn-outline" : "btn-gold"}>
                    <BadgeCheck size={14} /> {s.is_verified ? "Unverify" : "Verify"}
                  </ActionButton>
                  <ActionButton action={adminSetPublished} id={s.id} value={!s.is_published} className="btn-outline">
                    {s.is_published ? <EyeOff size={14} /> : <Eye size={14} />} {s.is_published ? "Unpublish" : "Publish"}
                  </ActionButton>
                  <ActionButton
                    action={adminSetSuspended}
                    id={s.id}
                    value={!s.is_suspended}
                    className={s.is_suspended ? "btn-outline" : "btn-outline text-rose-600 hover:border-rose-300"}
                  >
                    <Ban size={14} /> {s.is_suspended ? "Reinstate" : "Suspend"}
                  </ActionButton>
                  {isShopLive(s) && (
                    <Link href={`/shop/${s.slug}`} target="_blank" className="btn-outline px-3 py-2 text-xs">
                      <ExternalLink size={14} />
                    </Link>
                  )}
                </div>
                <ShopReviewPanel
                  shopId={s.id}
                  status={s.onboarding_status}
                  ownerName={s.owner_name}
                  pan={s.pan_number}
                  gstin={s.gstin}
                  pincode={s.pincode}
                  kycPath={s.kyc_doc_path}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  action,
  id,
  value,
  className,
  children,
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  value: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={String(value)} />
      <button className={`${className} px-3 py-2 text-xs`}>{children}</button>
    </form>
  );
}
