import Link from "next/link";
import { redirect } from "next/navigation";
import { Scissors, Store } from "lucide-react";
import { OtpLogin } from "@/components/OtpLogin";
import { getSessionUser } from "@/lib/auth";

export default async function BarberLoginPage() {
  if (await getSessionUser()) redirect("/barber/after-login");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4 py-12">
      <div className="bg-grid absolute inset-0" />
      <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-gold/25 via-coral/20 to-transparent blur-3xl" />
      <div className="relative w-full max-w-md">
        <h2 className="mb-6 text-center font-display text-4xl font-extrabold text-cream">
          Your shop, <span className="text-gradient">fully booked.</span>
        </h2>
        <div className="rounded-2xl bg-cream p-8 shadow-premium">
          <div className="mb-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-gold">
              <Store size={26} />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold text-ink">
              Barber Partner Login
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Manage your shop, services &amp; live queue. Sign in with your
              mobile number.
            </p>
          </div>

          <OtpLogin redirectTo="/barber/after-login" />
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-cream/80">
          {[
            "✂️ Free listing",
            "📲 Online bookings",
            "⏱️ Live queue, no crowding",
            "⭐ Reviews that bring customers",
          ].map((t) => (
            <li key={t} className="rounded-xl bg-white/5 px-3 py-2.5">
              {t}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-center text-sm text-cream/70">
          Looking to book a haircut instead?{" "}
          <Link href="/login" className="font-semibold text-gold">
            Customer sign in
          </Link>
        </p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-cream/40">
          <Scissors size={12} /> BarberNow Partner Portal
        </p>
      </div>
    </div>
  );
}
