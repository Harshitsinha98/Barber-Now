import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barber Now — Skip the wait. Book your barber.",
  description:
    "Discover top-rated barbershops near you, view real-time queue status, and book your slot online. No more waiting. Made for India.",
};

async function getUserLabel(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    // Prefer name, then phone, then a masked phone from metadata.
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const userLabel = await getUserLabel();
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Navbar userLabel={userLabel} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
