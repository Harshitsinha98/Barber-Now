import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin-auth";
import type { ShopRow } from "@/lib/supabase/database.types";

export const metadata = { title: "Admin — BarberNow", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { db } = await requireAdmin();
  // Shops waiting on admin: submitted for review (or, before migration 0007,
  // live but not yet verified).
  const { data } = await db.from("shops").select("*").eq("is_suspended", false);
  const shops = (data as ShopRow[]) ?? [];
  const pending = shops.filter((s) =>
    s.onboarding_status !== undefined ? s.onboarding_status === "submitted" : s.is_published && !s.is_verified
  ).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f2ec] md:flex-row">
      <AdminNav pendingCount={pending} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
