import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OrderError, cancelOrder } from "@/lib/orders";

// POST -> cancels the order if the policy allows it. Used by the chat's confirmation buttons.
export async function POST(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const orderId = Number((await params).id);
  if (!Number.isInteger(orderId)) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  try {
    const result = await cancelOrder(user.id, orderId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("cancelOrder failed:", err);
    return NextResponse.json({ error: "Could not cancel the order." }, { status: 500 });
  }
}
