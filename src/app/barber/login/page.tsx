import Link from "next/link";
import { Scissors, Store } from "lucide-react";
import { OtpLogin } from "@/components/OtpLogin";

export default function BarberLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-md">
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
