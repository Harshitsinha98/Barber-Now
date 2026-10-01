import Link from "next/link";
import { redirect } from "next/navigation";
import { BarberNav } from "@/components/barber/BarberNav";
import { requireBarberShop } from "@/lib/barber";
import { isShopLive } from "@/lib/shops";
import { daysLeft, isActive } from "@/lib/plans";

/**
 * Shell for the authenticated barber pages. Login / after-login / onboarding
 * sit outside this group so they render full-screen.
 */
export default async function BarberDashboardLayout({ children }: { children: React.ReactNode }) {
  const { shop } = await requireBarberShop();

  // Not yet approved → finish the onboarding wizard first.
  if (shop.onboarding_status !== undefined && shop.onboarding_status !== "approved") {
    redirect("/barber/onboarding");
  }

  const isLive = isShopLive(shop);
  const partnerReady = shop.onboarding_status !== undefined;
  const subLeft = daysLeft(shop.subscription_until);
  const subActive = isActive(shop.subscription_until);

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <BarberNav shopName={shop.name} shopSlug={shop.slug} isLive={isLive} queueCount={shop.queue_people_ahead} />
      <div className="flex-1 overflow-x-hidden">
        {shop.is_suspended && (
          <Bar tone="red">
            Your shop has been suspended by BarberNow and is hidden from customers. Contact support@barbernow.in.
          </Bar>
        )}
        {partnerReady && !shop.is_suspended && !subActive && (
          <Bar tone="red">
            Your partner plan has expired — your shop is hidden from customers.{" "}
            <Link href="/barber/billing" className="font-bold underline">
              Renew for ₹1,499 →
            </Link>
          </Bar>
        )}
        {partnerReady && subActive && subLeft <= 5 && (
          <Bar tone="amber">
            Your plan ends in {subLeft} day{subLeft === 1 ? "" : "s"}.{" "}
            <Link href="/barber/billing" className="font-bold underline">
              Renew now
            </Link>{" "}
            to stay visible.
          </Bar>
        )}
        {children}
      </div>
    </div>
  );
}

function Bar({ tone, children }: { tone: "red" | "amber"; children: React.ReactNode }) {
  return (
    <div
      className={`px-5 py-2.5 text-center text-sm font-medium ${
        tone === "red" ? "bg-rose-600 text-white" : "bg-gold text-ink"
      }`}
    >
      {children}
    </div>
  );
}
