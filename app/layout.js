import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Header";
import SupportChat from "@/app/components/SupportChat";
import { CartProvider } from "@/app/components/CartProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata = {
  title: "NovaCart — Everyday tech, delivered",
  description: "NovaCart demo store with an AI support assistant.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
            NovaCart is a fictional demo store. Demo only — no real orders are placed.
          </footer>
          <SupportChat />
        </CartProvider>
      </body>
    </html>
  );
}
