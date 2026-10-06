import { redirect } from "next/navigation";

// Legacy URL: the dashboard was split into /account and /orders.
export default function DashboardRedirect() {
  redirect("/account");
}
