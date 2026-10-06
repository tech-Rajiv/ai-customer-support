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

  if (!user) {
    return (
      <Link href="/login" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100">
        Log in
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {user.name.charAt(0)}
        </span>
        <span className="hidden font-medium sm:inline">{user.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          <div className="border-b px-4 py-2 text-xs text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{user.username}</span>
          </div>
          <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">
            My account &amp; orders
          </Link>
          <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50">
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
