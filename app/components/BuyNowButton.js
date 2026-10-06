"use client";

import { useState } from "react";
import { useCart } from "@/app/components/CartProvider";
import PlaceOrderModal from "@/app/components/PlaceOrderModal";

export default function BuyNowButton({ product }) {
  const { requireLogin } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => requireLogin() && setOpen(true)}
        className="w-full rounded-full bg-zee-orange-dark px-3 py-2 text-sm text-zee-navy transition hover:bg-[#e8962f]"
      >
        Buy Now
      </button>
      {open && <PlaceOrderModal items={[{ ...product, quantity: 1 }]} onClose={() => setOpen(false)} />}
    </>
  );
}
