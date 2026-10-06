import { redirect } from "next/navigation";
import OrderCard from "@/app/components/OrderCard";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser, getTicketsForUser } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Your Account — ZeeCart" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [orders, tickets] = await Promise.all([getOrdersForUser(user.id), getTicketsForUser(user.id)]);
  const activeCount = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <section>
        <h1 className="text-3xl text-zee-navy">Welcome back, {user.name}!</h1>
        <p className="text-sm text-gray-600">Track your orders and manage your account.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zee-border bg-white p-4 sm:col-span-2">
          <h2 className="mb-2 text-lg font-bold text-zee-navy">Your Account</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="text-gray-500">Name</dt><dd>{user.name}</dd>
            <dt className="text-gray-500">Username</dt><dd className="font-mono">{user.username}</dd>
            <dt className="text-gray-500">Email</dt><dd>{user.email}</dd>
            <dt className="text-gray-500">Member since</dt><dd>{formatDate(user.created_at)}</dd>
          </dl>
        </div>
        <div className="rounded-lg border border-zee-border bg-white p-4">
          <h2 className="mb-2 text-lg font-bold text-zee-navy">Overview</h2>
          <p className="text-3xl text-zee-navy">{orders.length}</p>
          <p className="text-sm text-gray-600">orders · {activeCount} in progress</p>
          <p className="mt-2 text-sm text-gray-600">{tickets.length} support ticket{tickets.length === 1 ? "" : "s"}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl text-zee-navy">Your Orders</h2>
        {orders.length === 0 ? (
          <p className="rounded-lg border border-zee-border bg-white p-6 text-gray-600">You haven&apos;t placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => <OrderCard key={o.id} order={o} customerName={user.name} />)}
          </div>
        )}
      </section>
    </div>
  );
}
