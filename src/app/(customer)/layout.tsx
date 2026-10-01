import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getSessionUser, displayName } from "@/lib/auth";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <>
      <Navbar userLabel={user ? displayName(user) : null} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
