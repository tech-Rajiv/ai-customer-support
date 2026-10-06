"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "@/app/components/Modal";
import { useCart } from "@/app/components/CartProvider";
import { formatPrice } from "@/lib/format";

// Demo checkout: saved address, no payment. items: [{ id, name, price, quantity }]
export default function PlaceOrderModal({ items, onClose, onPlaced }) {
  const router = useRouter();
  const { address } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  async function place() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not place your order.");
        return;
      }
      setOrderId(data.orderId);
      onPlaced?.();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (orderId) {
    return (
      <Modal title="Order placed 🎉" onClose={onClose}>
        <p className="text-sm text-gray-700">
          Thanks! Your order <b>#{orderId}</b> is confirmed and will arrive in about 6 days. Track it any time from Your Orders, or ask Zee where it is.
        </p>
        <Link href={`/orders/${orderId}`} onClick={onClose} className="mt-4 block rounded-full bg-zee-yellow py-2 text-center text-sm hover:bg-zee-yellow-dark">
          View order
        </Link>
      </Modal>
    );
  }

  return (
    <Modal title="Confirm your order" onClose={onClose}>
      <ul className="space-y-1 text-sm">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between gap-3">
            <span>{i.quantity} × {i.name}</span>
            <span className="whitespace-nowrap">{formatPrice(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
        <span>Order total</span><span>{formatPrice(total)}</span>
      </div>

      <div className="mt-4 rounded border border-zee-border bg-gray-50 p-3 text-sm">
        <p className="font-bold">Delivering to</p>
        <p className="text-gray-700">{address}</p>
        <p className="mt-1 text-xs text-gray-500">Your saved address. Standard delivery in 5–7 business days.</p>
      </div>
      <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-900">
        Demo checkout: no payment is taken and nothing is really shipped.
      </p>

      {error && <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <button onClick={place} disabled={loading} className="mt-4 w-full rounded-full bg-zee-yellow py-2 text-sm hover:bg-zee-yellow-dark disabled:opacity-60">
        {loading ? "Placing order..." : "Place order"}
      </button>
    </Modal>
  );
}
