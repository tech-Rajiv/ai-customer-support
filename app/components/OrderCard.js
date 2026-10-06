import Link from "next/link";
import StatusBadge from "@/app/components/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrderCard({ order, customerName }) {
  const active = !["delivered", "cancelled"].includes(order.status);
  return (
    <div className="overflow-hidden rounded-lg border border-zee-border bg-white">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-zee-border bg-[#f0f2f2] px-4 py-3 text-xs text-gray-600">
        <div><p className="uppercase">Order placed</p><p className="text-sm text-zee-navy">{formatDate(order.created_at)}</p></div>
        <div><p className="uppercase">Total</p><p className="text-sm text-zee-navy">{formatPrice(order.total_amount)}</p></div>
        {customerName && <div><p className="uppercase">Ship to</p><p className="text-sm text-zee-link">{customerName}</p></div>}
        <div className="ml-auto text-right"><p className="uppercase">Order # {order.id}</p></div>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            {order.status !== "cancelled" && (
              <span className="text-sm text-gray-700">
                {active ? "Expected delivery " : "Delivery date "}
                <b>{formatDate(order.expected_delivery)}</b>
              </span>
            )}
          </div>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.product_id} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt="" className="h-16 w-16 rounded bg-gray-100 object-cover" />
                <span className="text-sm text-zee-link">{item.name} <span className="text-gray-500">× {item.quantity}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sm:w-52">
          <Link href={`/orders/${order.id}`} className="block rounded-lg border border-zee-border bg-white px-3 py-1.5 text-center text-sm shadow-sm hover:bg-gray-50">
            View order details
          </Link>
        </div>
      </div>
    </div>
  );
}
