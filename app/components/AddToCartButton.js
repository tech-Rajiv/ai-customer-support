"use client";

import { useState } from "react";
import { useCart } from "@/app/components/CartProvider";

export default function AddToCartButton({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  // For guests, addItem opens the "sign in" modal (see CartProvider).
  function handleClick() {
    if (addItem(product)) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="w-full rounded-full bg-zee-yellow px-3 py-2 text-sm text-zee-navy transition hover:bg-zee-yellow-dark"
    >
      {added ? "Added to cart ✓" : "Add to Cart"}
    </button>
  );
}
