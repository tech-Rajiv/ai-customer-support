import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OrderError, createReturn } from "@/lib/orders";

// POST { reason, comment? } -> marks the order as return_requested.
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const orderId = Number((await params).id);
  if (!Number.isInteger(orderId)) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const comment = String(body.comment ?? "").trim().slice(0, 500);

  try {
    await createReturn(user.id, orderId, String(body.reason ?? ""), comment);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("createReturn failed:", err);
    return NextResponse.json({ error: "Could not request the return." }, { status: 500 });
  }
}
