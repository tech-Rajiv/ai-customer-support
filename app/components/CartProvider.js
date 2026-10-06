"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "novacart-cart";

// Demo cart kept in localStorage: [{ id, name, price, quantity }]
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(Array.isArray(saved) ? saved : []);
    } catch {}
  }, []);

  const persist = useCallback((next) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const addItem = useCallback(
    (product) => {
      const existing = items.find((i) => i.id === product.id);
      persist(
        existing
          ? items.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
          : [...items, { id: product.id, name: product.name, price: product.price, quantity: 1 }],
      );
    },
    [items, persist],
  );

  const removeItem = useCallback((id) => persist(items.filter((i) => i.id !== id)), [items, persist]);
  const clear = useCallback(() => persist([]), [persist]);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, addItem, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
