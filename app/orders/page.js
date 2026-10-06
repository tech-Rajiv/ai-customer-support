import Link from "next/link";
import { redirect } from "next/navigation";
import OrderCard from "@/app/components/OrderCard";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/queries";

export const metadata = { title: "Your Orders — ZeeCart" };

const FILTERS = [
  { key: "all", label: "All orders", test: () => true },
  { key: "active", label: "In progress", test: (o) => !["delivered", "cancelled"].includes(o.status) },
  { key: "delivered", label: "Delivered", test: (o) => o.status === "delivered" },
  { key: "cancelled", label: "Cancelled", test: (o) => o.status === "cancelled" },
];

export default async function OrdersPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { filter } = await searchParams;
  const current = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const orders = await getOrdersForUser(user.id);
  const shown = orders.filter(current.test);

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <h1 className="text-3xl text-zee-navy">Your Orders</h1>

      <nav className="flex flex-wrap gap-x-6 gap-y-1 border-b border-zee-border text-sm" aria-label="Order filter">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/orders" : `/orders?filter=${f.key}`}
            className={`-mb-px border-b-2 pb-2 ${
              current.key === f.key ? "border-zee-orange-dark font-bold text-zee-navy" : "border-transparent text-gray-600 hover:text-zee-link-hover"
            }`}
          >
            {f.label} <span className="text-gray-400">({orders.filter(f.test).length})</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-zee-border bg-white p-6 text-gray-600">
          {orders.length === 0 ? "You haven't placed any orders yet." : "No orders match this filter."}
        </p>
      ) : (
        <div className="space-y-4">
          {shown.map((o) => <OrderCard key={o.id} order={o} customerName={user.name} />)}
        </div>
      )}
    </div>
  );
}
