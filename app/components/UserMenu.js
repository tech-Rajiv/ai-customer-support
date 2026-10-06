"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const trigger = (
    <>
      <span className="block text-xs leading-tight">Hello, {user ? user.name.split(" ")[0] : "sign in"}</span>
      <span className="block text-sm font-bold leading-tight">Account &amp; Lists ▾</span>
    </>
  );

  if (!user) {
    return (
      <Link href="/login" className="rounded border border-transparent px-2 py-1 text-left text-white hover:border-white">
        {trigger}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="rounded border border-transparent px-2 py-1 text-left text-white hover:border-white">
        {trigger}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded border border-zee-border bg-white py-2 text-zee-navy shadow-xl">
          <div className="border-b px-4 pb-2 text-xs text-gray-600">
            Signed in as <span className="font-bold">{user.username}</span>
          </div>
          <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 hover:text-zee-link-hover">
            Your Account
          </Link>
          <Link href="/orders" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 hover:text-zee-link-hover">
            Your Orders
          </Link>
          <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 hover:text-zee-link-hover">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
