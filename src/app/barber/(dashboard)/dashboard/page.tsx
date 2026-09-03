import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyShop } from "@/lib/supabase/queries";
import { Toggle } from "@/components/barber/Toggle";
import { setPublished, setOpenNow } from "../actions";
import {
  Scissors,
  ImageIcon,
  Users,
  MapPin,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const shop = await getMyShop();
  if (!shop) redirect("/barber/onboarding");

  const supabase = await createClient();
  const [{ count: serviceCount }, { count: activeBookings }] = await Promise.all([
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id)
      .in("status", ["booked", "in_queue", "in_service"]),
  ]);

  const photoCount = (shop.gallery?.length ?? 0) + (shop.cover_image ? 1 : 0);
  const canPublish = (serviceCount ?? 0) > 0;

  return (
    <div className="p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            {shop.name}
          </h1>
          <p className="flex items-center gap-1 text-sm text-ink/60">
            <MapPin size={14} className="text-gold-dark" />
            {shop.area}, {shop.city}
          </p>
        </div>
        {shop.is_published && (
          <Link
            href={`/shop/${shop.slug}`}
            target="_blank"
            className="btn-outline text-sm"
          >
            View live page <ExternalLink size={15} />
          </Link>
        )}
      </div>

      {/* Status card */}
      <div className="mt-6 card p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-black/5 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">Shop visibility</p>
              <p className="text-xs text-ink/50">
                {shop.is_published
                  ? "Live — customers can find & book you."
                  : "Draft — not visible to customers yet."}
              </p>
            </div>
            <form>
              <Toggle
                checked={shop.is_published}
                labelOn="Published"
                labelOff="Draft"
                onToggle={async (next) => {
                  "use server";
                  await setPublished(next);
                }}
              />
            </form>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-black/5 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">Accepting customers</p>
              <p className="text-xs text-ink/50">
                {shop.open_now ? "Open now." : "Closed."}
              </p>
            </div>
            <Toggle
              checked={shop.open_now}
              labelOn="Open"
              labelOff="Closed"
              onToggle={async (next) => {
                "use server";
                await setOpenNow(next);
              }}
            />
          </div>
        </div>

        {!canPublish && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            <AlertCircle size={16} /> Add at least one service before publishing
            your shop.
          </p>
        )}
        {canPublish && !shop.is_published && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} /> You&apos;re ready to publish! Flip
            &quot;Shop visibility&quot; to go live.
          </p>
        )}
      </div>

      {/* Quick stats + links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          href="/barber/services"
          icon={<Scissors />}
          count={serviceCount ?? 0}
          label="Services"
          hint="Manage prices & offers"
        />
        <StatCard
          href="/barber/photos"
          icon={<ImageIcon />}
          count={photoCount}
          label="Photos"
          hint="Cover & gallery"
        />
        <StatCard
          href="/barber/queue"
          icon={<Users />}
          count={activeBookings ?? 0}
          label="In queue / booked"
          hint="Manage today's queue"
        />
      </div>
    </div>
  );
}

function StatCard({
  href,
  icon,
  count,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  count: number;
  label: string;
  hint: string;
}) {
  return (
    <Link href={href} className="card group p-5 transition hover:shadow-premium">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-gold">
          {icon}
        </span>
        <ArrowRight
          size={18}
          className="text-ink/30 transition group-hover:text-gold-dark"
        />
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-ink">{count}</p>
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-ink/50">{hint}</p>
    </Link>
  );
}
