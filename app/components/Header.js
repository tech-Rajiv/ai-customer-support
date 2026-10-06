import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import CartButton from "@/app/components/CartButton";
import UserMenu from "@/app/components/UserMenu";
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

          <form action="/" className="order-last flex w-full min-w-0 flex-1 overflow-hidden rounded-md focus-within:ring-2 focus-within:ring-zee-orange md:order-none md:w-auto">
            <select
              name="category"
              aria-label="Search category"
              className="hidden max-w-36 border-r border-zee-border bg-[#e6e6e6] px-2 text-xs text-gray-700 outline-none hover:bg-[#d4d4d4] sm:block"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="search"
              name="q"
              placeholder="Search ZeeCart"
              className="min-w-0 flex-1 bg-white px-3 py-2 text-sm text-zee-navy outline-none"
            />
            <button aria-label="Search" className="bg-zee-orange px-4 text-zee-navy hover:bg-zee-orange-dark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8" />
              </svg>
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <UserMenu user={user ? { name: user.name, username: user.username } : null} />
            <Link href="/dashboard" className="hidden rounded border border-transparent px-2 py-1 hover:border-white sm:block">
              <span className="block text-xs leading-tight">Returns</span>
              <span className="block text-sm font-bold leading-tight">&amp; Orders</span>
            </Link>
            <CartButton />
          </div>
        </div>
      </div>

      <nav className="bg-zee-navy2 text-white">
        <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-3 py-1.5 text-sm">
          <Link href="/" className="whitespace-nowrap rounded border border-transparent px-2 py-1 font-bold hover:border-white">
            ☰ All
          </Link>
          {categories.map((c) => (
            <Link key={c} href={`/?category=${encodeURIComponent(c)}`} className="whitespace-nowrap rounded border border-transparent px-2 py-1 hover:border-white">
              {c}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
