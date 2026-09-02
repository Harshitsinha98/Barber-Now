import Link from "next/link";
import { Scissors } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-gold">
        <Scissors size={28} />
      </span>
      <h1 className="mt-6 font-display text-4xl font-bold text-ink">
        Page not found
      </h1>
      <p className="mt-2 text-ink/60">
        Looks like this page took a trim it shouldn&apos;t have.
      </p>
      <Link href="/" className="btn-gold mt-6">
        Back to home
      </Link>
    </div>
  );
}
