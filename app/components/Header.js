import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import CartButton from "@/app/components/CartButton";
import UserMenu from "@/app/components/UserMenu";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";

export default async function Header() {
  const [user, categories] = await Promise.all([getCurrentUser(), getCategories()]);

  return (
    <header id="top" className="sticky top-0 z-40">
      <div className="bg-zee-navy text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2">
          <Link href="/" aria-label="ZeeCart home" className="rounded border border-transparent px-2 py-1 hover:border-white">
            <Logo dark />
          </Link>

          <Suspense fallback={<div className="order-last h-10 w-full flex-1 rounded-md bg-white md:order-none md:w-auto" />}>
            <SearchBar categories={categories} />
          </Suspense>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <UserMenu user={user ? { name: user.name, username: user.username } : null} />
            <Link href="/orders" className="hidden rounded border border-transparent px-2 py-1 hover:border-white sm:block">
              <span className="block text-xs leading-tight">Returns</span>
              <span className="block text-sm font-bold leading-tight">&amp; Orders</span>
            </Link>
            <CartButton />
          </div>
        </div>
      </div>

      <nav className="bg-zee-navy2 text-white">
        <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-3 py-1.5 text-sm">
          <Link href="/search" className="whitespace-nowrap rounded border border-transparent px-2 py-1 font-bold hover:border-white">
            ☰ All
          </Link>
          {categories.map((c) => (
            <Link key={c} href={`/search?category=${encodeURIComponent(c)}`} className="whitespace-nowrap rounded border border-transparent px-2 py-1 hover:border-white">
              {c}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
