import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OrderError, createOrder } from "@/lib/orders";

// Demo checkout: POST { items: [{ productId, quantity }] } -> { orderId }
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });

  const { items } = await request.json().catch(() => ({}));
  if (!Array.isArray(items)) return NextResponse.json({ error: "items must be an array" }, { status: 400 });

  try {
    return NextResponse.json(await createOrder(user.id, items));
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("createOrder failed:", err);
    return NextResponse.json({ error: "Could not place your order." }, { status: 500 });
  }
}
