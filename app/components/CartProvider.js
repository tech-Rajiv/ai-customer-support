"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";

const CartContext = createContext(null);

// Demo cart kept in localStorage, one per logged-in user: [{ id, name, price, quantity }]
// Guests have no cart: addItem refuses and callers show a "log in first" message.
export function CartProvider({ user, children }) {
  const [items, setItems] = useState([]);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const userId = user?.id ?? null;
  const storageKey = userId ? `zeecart-cart-${userId}` : null;

  useEffect(() => {
    let saved = [];
    if (storageKey) {
      try {
        saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      } catch {}
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(Array.isArray(saved) ? saved : []);
  }, [storageKey]);

  const persist = useCallback(
    (next) => {
      setItems(next);
      if (!storageKey) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
    },
    [storageKey],
  );

  const addItem = useCallback(
    (product) => {
      if (!userId) {
        setLoginPromptOpen(true);
        return false;
      }
      const existing = items.find((i) => i.id === product.id);
      persist(
        existing
          ? items.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
          : [...items, { id: product.id, name: product.name, price: product.price, quantity: 1 }],
      );
      return true;
    },
    [userId, items, persist],
  );

  const removeItem = useCallback((id) => persist(items.filter((i) => i.id !== id)), [items, persist]);
  const clear = useCallback(() => persist([]), [persist]);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <CartContext.Provider value={{ isLoggedIn: !!userId, items, count, addItem, removeItem, clear }}>
      {children}
      {loginPromptOpen && <LoginPrompt onClose={() => setLoginPromptOpen(false)} />}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

// Modal shown when a guest tries to add something to the cart.
function LoginPrompt({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-2xl"
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-2 text-2xl leading-none text-gray-400 hover:text-gray-700">×</button>
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">🛒</div>
        <h2 id="login-prompt-title" className="text-xl font-bold text-zee-navy">Sign in to add to cart</h2>
        <p className="mt-1 text-sm text-gray-600">
          Please sign in to your ZeeCart account to add items to your cart and track your orders.
        </p>
        <Link href="/login" onClick={onClose} className="mt-5 block rounded-full bg-zee-yellow py-2 text-sm font-medium text-zee-navy hover:bg-zee-yellow-dark">
          Sign in
        </Link>
        <button onClick={onClose} className="mt-3 text-sm text-zee-link hover:text-zee-link-hover hover:underline">
          Continue browsing
        </button>
      </div>
    </div>
  );
}
