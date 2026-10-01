import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Admin — BarberNow", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { db } = await requireAdmin();
  // Live shops that haven't been verified yet need admin attention.
  const { count } = await db
    .from("shops")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .eq("is_verified", false)
    .eq("is_suspended", false);

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f2ec] md:flex-row">
      <AdminNav pendingCount={count ?? 0} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
