import Link from "next/link";
import { Scissors } from "lucide-react";
import { OtpLogin } from "@/components/OtpLogin";

export default function LoginPage() {
  return (
    <div className="container-app flex min-h-[75vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-gold">
              <Scissors size={26} />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold text-ink">
              Welcome to BarberNow
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Sign in with your mobile number to book &amp; track your visits.
            </p>
          </div>

          <OtpLogin redirectTo="/" />
        </div>

        <p className="mt-4 text-center text-xs text-ink/40">
          By continuing you agree to our{" "}
          <Link href="#" className="underline">
            Terms
          </Link>{" "}
          &amp;{" "}
          <Link href="#" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
