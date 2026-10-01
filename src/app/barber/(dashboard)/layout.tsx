import { BarberNav } from "@/components/barber/BarberNav";
import { requireBarberShop } from "@/lib/barber";

/**
 * Shell for the authenticated barber pages. Login / after-login / onboarding
 * sit outside this group so they render full-screen.
 */
export default async function BarberDashboardLayout({ children }: { children: React.ReactNode }) {
  const { shop } = await requireBarberShop();
  const isLive = shop.is_published && !shop.is_suspended;

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <BarberNav
        shopName={shop.name}
        shopSlug={shop.slug}
        isLive={isLive}
        queueCount={shop.queue_people_ahead}
      />
      <div className="flex-1 overflow-x-hidden">
        {shop.is_suspended && (
          <div className="bg-rose-600 px-5 py-2.5 text-center text-sm font-medium text-white">
            Your shop has been suspended by BarberNow and is hidden from customers.
            Contact support@barbernow.in.
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
