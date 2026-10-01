import Link from "next/link";
import { redirect } from "next/navigation";
import { Scissors } from "lucide-react";
import { OtpLogin } from "@/components/OtpLogin";
import { getSessionUser } from "@/lib/auth";

/** Only allow same-site relative redirects (prevents open-redirects). */
function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await getSessionUser()) redirect(target);

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

          <OtpLogin redirectTo={target} />
        </div>

        <p className="mt-4 text-center text-sm text-ink/50">
          Own a barbershop?{" "}
          <Link href="/barber/login" className="font-semibold text-gold-dark">
            Partner login
          </Link>
        </p>
      </div>
    </div>
  );
}
