import { redirect } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { OtpLogin } from "@/components/OtpLogin";
import { getSessionUser, isAdminUser } from "@/lib/auth";
import { adminLogout } from "../actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;
  const user = await getSessionUser();
  if (user && isAdminUser(user)) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink via-ink-soft to-ink px-4">
      <div className="w-full max-w-md rounded-2xl bg-cream p-8 shadow-premium">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-gold">
            <ShieldCheck size={26} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">BarberNow Admin</h1>
          <p className="mt-1 text-sm text-ink/60">Restricted. Sign in with an authorised admin number.</p>
        </div>

        {user && (denied || !isAdminUser(user)) ? (
          <div className="space-y-4 text-center">
            <p className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <ShieldAlert size={16} /> This number is not an admin.
            </p>
            <form action={adminLogout}>
              <button className="btn-outline w-full text-sm">Sign in with another number</button>
            </form>
          </div>
        ) : (
          <OtpLogin redirectTo="/admin" />
        )}
      </div>
    </div>
  );
}
