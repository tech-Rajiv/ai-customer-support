import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import StatusBadge from "@/app/components/StatusBadge";
import { getCurrentUser } from "@/lib/auth";
import { getOrderForUser } from "@/lib/queries";
import { formatDate, formatPrice } from "@/lib/format";

const STEPS = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];
const STEP_LABELS = ["Confirmed", "Processing", "Shipped", "Out for delivery", "Delivered"];
const STATUS_NOTES = {
  delayed: "This order is running late. Ask Zee, our AI support assistant, about your options.",
  cancelled: "This order was cancelled.",
  pending: "We've received your order and are waiting for payment confirmation.",
};

export default async function OrderPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const order = await getOrderForUser(user.id, orderId);
  if (!order) notFound();

  // "delayed" happens somewhere after shipping; show it as stalled at "shipped".
  const stepIndex =
    order.status === "delayed" ? 2
    : order.status === "pending" ? -1
    : STEPS.indexOf(order.status);
  const showTimeline = order.status !== "cancelled";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link href="/orders" className="text-sm text-zee-link hover:text-zee-link-hover hover:underline">← Back to my orders</Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl text-zee-navy">Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      {STATUS_NOTES[order.status] && (
        <p className={`rounded-lg p-3 text-sm ${order.status === "delayed" ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
          {STATUS_NOTES[order.status]}
        </p>
      )}

      {showTimeline && (
        <ol className="grid grid-cols-5 gap-1 rounded-lg border border-zee-border bg-white p-4 text-center text-xs ">
          {STEP_LABELS.map((label, i) => (
            <li key={label} className="space-y-1">
              <div className={`mx-auto h-2 w-full rounded-full ${
                i <= stepIndex ? (order.status === "delayed" && i === stepIndex ? "bg-amber-400" : "bg-[#007185]") : "bg-gray-200"
              }`} />
              <span className={i <= stepIndex ? "font-medium" : "text-gray-400"}>{label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-lg border border-zee-border bg-white">
        <ul className="divide-y">
          {order.items.map((item) => (
            <li key={item.product_id} className="flex items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded-lg bg-gray-100 object-cover" />
              <div className="flex-1">
                <Link href={`/products/${item.product_id}`} className="font-medium text-zee-link hover:text-zee-link-hover hover:underline">{item.name}</Link>
                <p className="text-sm text-gray-500">Qty {item.quantity} × {formatPrice(item.price)}</p>
                {order.status !== "cancelled" && (
                  <Link href={`/products/${item.product_id}#reviews`} className="text-xs text-zee-link hover:underline">Write a product review</Link>
                )}
              </div>
              <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t p-4 font-semibold">
          <span>Total</span><span>{formatPrice(order.total_amount)}</span>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 rounded-lg border border-zee-border bg-white p-4 text-sm ">
        <dt className="text-gray-500">Order placed</dt><dd>{formatDate(order.created_at)}</dd>
        {order.status !== "cancelled" && (
          <>
            <dt className="text-gray-500">{order.status === "delivered" ? "Delivered" : "Expected delivery"}</dt>
            <dd>{formatDate(order.expected_delivery)}</dd>
          </>
        )}
        <dt className="text-gray-500">Last updated</dt><dd>{formatDate(order.updated_at)}</dd>
      </dl>
    </div>
  );
}
