import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

async function getUserLabel(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const phone = user.phone || (user.user_metadata?.phone as string | undefined);
    const name = user.user_metadata?.full_name as string | undefined;
    if (name) return name;
    if (phone) {
      const digits = phone.replace(/\D/g, "").slice(-10);
      return "+91 " + digits.replace(/(\d{5})(\d{5})/, "$1 $2");
    }
    return "Account";
  } catch {
    return null;
  }
}

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userLabel = await getUserLabel();
  return (
    <>
      <Navbar userLabel={userLabel} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
