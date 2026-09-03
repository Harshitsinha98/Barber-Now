import { redirect } from "next/navigation";
import { BarberNav } from "@/components/barber/BarberNav";
import { getMyShop } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Shell for the authenticated barber dashboard pages (Overview, Services,
 * Photos, Queue). The login/after-login pages sit OUTSIDE this group so they
 * render full-screen without the sidebar. Middleware already redirects
 * unauthenticated users, but we double-check here too.
 */
export default async function BarberDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/barber/login");

  const shop = await getMyShop();

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <BarberNav shopName={shop?.name} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
