import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, formatPhone, userPhone } from "@/lib/auth";
import { logoutCustomer } from "@/app/auth-actions";
import { ProfileForm } from "./ProfileForm";
import { CalendarClock, LogOut, Phone, Store, UserCircle2 } from "lucide-react";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");

  const name = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="container-app max-w-2xl py-10">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-gold">
          <UserCircle2 size={32} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{name || "My account"}</h1>
          <p className="flex items-center gap-1 text-sm text-ink/60">
            <Phone size={13} /> {formatPhone(userPhone(user))}
          </p>
        </div>
      </div>

      {!name && (
        <p className="mt-6 rounded-xl bg-gold/10 p-4 text-sm text-gold-dark">
          👋 Add your name so the salon knows who&apos;s next in the queue.
        </p>
      )}

      <div className="card mt-6 p-6">
        <ProfileForm initialName={name} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/bookings" className="card flex items-center gap-3 p-5 transition hover:shadow-premium">
          <CalendarClock className="text-gold-dark" />
          <div>
            <p className="font-semibold text-ink">My bookings</p>
            <p className="text-xs text-ink/50">Queue, slots &amp; history</p>
          </div>
        </Link>
        <Link href="/barber/login" className="card flex items-center gap-3 p-5 transition hover:shadow-premium">
          <Store className="text-gold-dark" />
          <div>
            <p className="font-semibold text-ink">Own a barbershop?</p>
            <p className="text-xs text-ink/50">Open the partner portal</p>
          </div>
        </Link>
      </div>

      <form action={logoutCustomer} className="mt-8">
        <button className="btn-outline text-sm text-rose-600">
          <LogOut size={15} /> Log out
        </button>
      </form>
    </div>
  );
}
