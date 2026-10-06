import "./globals.css";
import Header from "@/app/components/Header";
import SupportChat from "@/app/components/SupportChat";
import { CartProvider } from "@/app/components/CartProvider";
import { getCurrentUser } from "@/lib/auth";
import Logo from "@/app/components/Logo";

export const metadata = {
  title: "ZeeCart — Online Shopping for Electronics & Accessories",
  description: "ZeeCart demo store with Zee, an AI support assistant.",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  const cartUser = user ? { id: user.id } : null;

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <CartProvider user={cartUser}>
          <Header />
          <main className="flex-1">{children}</main>
          <footer>
            <a href="#top" className="block bg-zee-navy3 py-3 text-center text-sm text-white hover:bg-[#485769]">
              Back to top
            </a>
            <div className="bg-zee-navy2 px-4 py-8 text-center text-xs text-gray-300">
              <div className="mb-2 flex justify-center"><Logo dark size="sm" /></div>
              ZeeCart is a fictional demo store. No real orders are placed. © 2026 ZeeCart
            </div>
          </footer>
        </CartProvider>
        <SupportChat userName={user?.name ?? null} />
      </body>
    </html>
  );
}
