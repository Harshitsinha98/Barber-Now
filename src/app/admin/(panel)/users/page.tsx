import { requireAdmin } from "@/lib/admin-auth";
import type { ProfileRow, ShopRow } from "@/lib/supabase/database.types";
import { formatPhone } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { PageHeader, FilterTabs, SearchBox, Empty } from "@/components/admin/ui";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const { role = "all", q = "" } = await searchParams;
  const { db } = await requireAdmin();

  const [{ data: profileData }, { data: shopData }, { data: bookingData }] = await Promise.all([
    db.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
    db.from("shops").select("owner_id, name"),
    db.from("bookings").select("customer_id, status, total_amount").not("customer_id", "is", null),
  ]);
  const all = (profileData as ProfileRow[]) ?? [];
  const shopByOwner = new Map(((shopData as Pick<ShopRow, "owner_id" | "name">[]) ?? []).map((s) => [s.owner_id, s.name]));
  const bookings = (bookingData as { customer_id: string; status: string; total_amount: number }[]) ?? [];

  const term = q.trim().toLowerCase();
  const users = all.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      (!term || [u.full_name, u.phone, shopByOwner.get(u.id)].some((v) => String(v ?? "").toLowerCase().includes(term)))
  );

  return (
    <div className="space-y-5 p-5 sm:p-8">
      <PageHeader title="Users" subtitle="Everyone who has signed in with OTP.">
        <SearchBox action="/admin/users" defaultValue={q} placeholder="Name, phone, shop…" hidden={{ role: role !== "all" ? role : undefined }} />
      </PageHeader>

      <FilterTabs
        base="/admin/users"
        param="role"
        current={role}
        extra={{ q: q || undefined }}
        options={[
          { value: "all", label: "All", count: all.length },
          { value: "customer", label: "Customers", count: all.filter((u) => u.role === "customer").length },
          { value: "barber", label: "Barbers", count: all.filter((u) => u.role === "barber").length },
        ]}
      />

      {users.length === 0 ? (
        <Empty>No users found.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink/40">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Role</th>
                <th className="p-3">Activity</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map((u) => {
                const mine = bookings.filter((b) => b.customer_id === u.id);
                const spent = mine.filter((b) => b.status === "done").reduce((a, b) => a + b.total_amount, 0);
                return (
                  <tr key={u.id} className="hover:bg-black/[0.02]">
                    <td className="p-3 font-medium text-ink">{u.full_name || <span className="text-ink/40">—</span>}</td>
                    <td className="p-3 text-ink/70">{u.phone ? formatPhone(u.phone) : "—"}</td>
                    <td className="p-3">
                      <span className={`badge ${u.role === "barber" ? "bg-gold/15 text-gold-dark" : "bg-blue-50 text-blue-700"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-ink/60">
                      {u.role === "barber"
                        ? shopByOwner.get(u.id) ?? "No shop yet"
                        : `${mine.length} bookings · ${formatINR(spent)}`}
                    </td>
                    <td className="p-3 text-xs text-ink/60">
                      {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
