import Link from "next/link";
import { redirect } from "next/navigation";
import StatusBadge from "@/app/components/StatusBadge";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser, getTicketsForUser } from "@/lib/queries";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Your Account — ZeeCart" };

function Card({ title, children, href, linkText }) {
  return (
    <div className="flex flex-col rounded-lg border border-zee-border bg-white p-4">
      <h2 className="mb-2 text-lg font-bold text-zee-navy">{title}</h2>
      <div className="flex-1 text-sm">{children}</div>
      {href && (
        <Link href={href} className="mt-3 text-sm text-zee-link hover:text-zee-link-hover hover:underline">
          {linkText} →
        </Link>
      )}
    </div>
  );
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [orders, tickets] = await Promise.all([getOrdersForUser(user.id), getTicketsForUser(user.id)]);
  const activeCount = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const latest = orders[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <section>
        <h1 className="text-3xl text-zee-navy">Your Account</h1>
        <p className="text-sm text-gray-600">Welcome back, {user.name}!</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Login & security">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-gray-500">Name</dt><dd>{user.name}</dd>
            <dt className="text-gray-500">Username</dt><dd className="font-mono">{user.username}</dd>
            <dt className="text-gray-500">Email</dt><dd className="break-all">{user.email}</dd>
            <dt className="text-gray-500">Member since</dt><dd>{formatDate(user.created_at)}</dd>
          </dl>
        </Card>

        <Card title="Your orders" href="/orders" linkText="View all orders">
          <p className="text-3xl text-zee-navy">{orders.length}</p>
          <p className="text-gray-600">{activeCount} in progress</p>
        </Card>

        <Card title="Support tickets">
          {tickets.length === 0 ? (
            <p className="text-gray-600">You have no support tickets. Ask Zee, our AI assistant, if you need help with an order.</p>
          ) : (
            <ul className="space-y-1">
              {tickets.slice(0, 3).map((t) => (
                <li key={t.id}>#{t.id} · <span className="capitalize">{t.status}</span> — {t.issue}</li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {latest && (
        <section className="rounded-lg border border-zee-border bg-white p-4">
          <h2 className="mb-3 text-lg font-bold text-zee-navy">Latest order</h2>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-bold">Order #{latest.id} · {formatPrice(latest.total_amount)}</p>
              <p className="text-gray-600">{latest.items.map((i) => i.name).join(", ")}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={latest.status} />
              <Link href={`/orders/${latest.id}`} className="rounded-lg border border-zee-border px-3 py-1.5 shadow-sm hover:bg-gray-50">
                View order details
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
