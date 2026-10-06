import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import CartButton from "@/app/components/CartButton";
import UserMenu from "@/app/components/UserMenu";

export default async function Header() {
  const [user, categories] = await Promise.all([getCurrentUser(), getCategories()]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">N</span>
          <span className="hidden sm:inline">NovaCart</span>
        </Link>

        <form action="/" className="mx-2 flex-1">
          <input
            type="search"
            name="q"
            placeholder="Search products..."
            className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white"
          />
        </form>

        <CartButton />
        <UserMenu user={user ? { name: user.name, username: user.username } : null} />
      </div>
      <nav className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-2 text-sm text-slate-600">
          <Link href="/" className="whitespace-nowrap hover:text-indigo-700">All</Link>
          {categories.map((c) => (
            <Link key={c} href={`/?category=${encodeURIComponent(c)}`} className="whitespace-nowrap hover:text-indigo-700">
              {c}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
