"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/app/components/CartProvider";
import PlaceOrderModal from "@/app/components/PlaceOrderModal";
import { formatPrice } from "@/lib/format";

export default function CartButton() {
  const { isLoggedIn, items, count, removeItem, clear } = useCart();
  const [open, setOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Cart, ${count} items`}
        className="flex items-end rounded border border-transparent px-2 py-1 text-white hover:border-white"
      >
        <span className="relative">
          <svg width="34" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
            <path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
          </svg>
          <span className="absolute left-1/2 top-0 -translate-x-1/2 text-sm font-bold leading-none text-zee-orange">
            {count}
          </span>
        </span>
        <span className="hidden pb-0.5 text-sm font-bold sm:inline">Cart</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-72 rounded border border-zee-border bg-white p-4 text-zee-navy shadow-xl">
          <p className="mb-2 text-base font-bold">Shopping Cart</p>
          {!isLoggedIn ? (
            <p className="text-sm">
              <Link href="/login" onClick={() => setOpen(false)} className="text-zee-link hover:text-zee-link-hover hover:underline">
                Log in
              </Link>{" "}
              to add items and see your cart.
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-600">Your ZeeCart is empty.</p>
          ) : (
            <>
              <ul className="max-h-60 space-y-2 overflow-auto">
                {items.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-2 text-sm">
                    <span>{i.quantity} × {i.name}</span>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      {formatPrice(i.price * i.quantity)}
                      <button onClick={() => removeItem(i.id)} aria-label={`Remove ${i.name}`} className="text-gray-400 hover:text-red-600">×</button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t pt-3 text-sm font-bold">
                <span>Subtotal</span><span>{formatPrice(total)}</span>
              </div>
              <button
                onClick={() => { setCheckout(true); setOpen(false); }}
                className="mt-3 w-full rounded-full bg-zee-yellow py-2 text-sm hover:bg-zee-yellow-dark"
              >
                Place order (demo)
              </button>
              <button onClick={clear} className="mt-2 text-xs text-zee-link hover:underline">Clear cart</button>
            </>
          )}
        </div>
      )}
          {checkout && <PlaceOrderModal items={items} onClose={() => setCheckout(false)} onPlaced={clear} />}
    </div>
  );
}
