import Link from "next/link";
import StatusBadge from "@/app/components/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrderCard({ order }) {
  const active = !["delivered", "cancelled"].includes(order.status);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">Order #{order.id}</p>
          <p className="text-xs text-slate-500">Placed {formatDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="mt-3 flex flex-wrap gap-4">
        {order.items.map((item) => (
          <li key={item.product_id} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt="" className="h-12 w-12 rounded-lg bg-slate-100 object-cover" />
            <span className="text-sm">{item.name} <span className="text-slate-500">× {item.quantity}</span></span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t pt-3 text-sm">
        <div className="space-y-0.5">
          <p><span className="text-slate-500">Total:</span> <span className="font-semibold">{formatPrice(order.total_amount)}</span></p>
          {order.status !== "cancelled" && (
            <p>
              <span className="text-slate-500">{active ? "Expected delivery:" : "Delivery date:"}</span>{" "}
              {formatDate(order.expected_delivery)}
            </p>
          )}
        </div>
        <Link href={`/orders/${order.id}`} className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
          View order
        </Link>
      </div>
    </div>
  );
}
