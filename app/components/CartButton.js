"use client";

import { useState } from "react";
import { useCart } from "@/app/components/CartProvider";
import { formatPrice } from "@/lib/format";

export default function CartButton() {
  const { items, count, removeItem, clear } = useCart();
  const [open, setOpen] = useState(false);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Cart, ${count} items`}
        className="relative rounded-full p-2 text-slate-700 hover:bg-slate-100"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" />
          <path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <p className="mb-2 text-sm font-semibold">Your cart</p>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">Your cart is empty.</p>
          ) : (
            <>
              <ul className="max-h-60 space-y-2 overflow-auto">
                {items.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-2 text-sm">
                    <span>{i.quantity} × {i.name}</span>
                    <span className="flex items-center gap-2">
                      {formatPrice(i.price * i.quantity)}
                      <button onClick={() => removeItem(i.id)} aria-label={`Remove ${i.name}`} className="text-slate-400 hover:text-red-600">×</button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t pt-3 text-sm font-semibold">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Checkout is disabled in this demo.</p>
              <button onClick={clear} className="mt-2 text-xs text-slate-500 underline">Clear cart</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
