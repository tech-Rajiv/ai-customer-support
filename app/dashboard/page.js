import { redirect } from "next/navigation";
import OrderCard from "@/app/components/OrderCard";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser, getTicketsForUser } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const metadata = { title: "My account — NovaCart" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [orders, tickets] = await Promise.all([getOrdersForUser(user.id), getTicketsForUser(user.id)]);
  const activeCount = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <section>
        <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
        <p className="text-slate-500">Here&apos;s what&apos;s happening with your orders.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Account</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-slate-500">Name</dt><dd>{user.name}</dd>
            <dt className="text-slate-500">Username</dt><dd className="font-mono">{user.username}</dd>
            <dt className="text-slate-500">Email</dt><dd>{user.email}</dd>
            <dt className="text-slate-500">Member since</dt><dd>{formatDate(user.created_at)}</dd>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Orders</h2>
          <p className="text-3xl font-bold">{orders.length}</p>
          <p className="text-sm text-slate-500">{activeCount} active</p>
          <p className="mt-2 text-sm text-slate-500">{tickets.length} support ticket{tickets.length === 1 ? "" : "s"}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Recent orders</h2>
        {orders.length === 0 ? (
          <p className="text-slate-500">You haven&apos;t placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        )}
      </section>
    </div>
  );
}
