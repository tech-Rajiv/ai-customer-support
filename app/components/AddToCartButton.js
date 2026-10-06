"use client";

import { useState } from "react";
import { useCart } from "@/app/components/CartProvider";

export default function AddToCartButton({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      onClick={handleClick}
      className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
