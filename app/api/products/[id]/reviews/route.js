import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProduct, hasPurchasedProduct, upsertReview } from "@/lib/queries";

// Create or update the logged-in customer's review of a product they bought.
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to write a review." }, { status: 401 });
  }

  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || !(await getProduct(productId))) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const rating = Number(body.rating);
  const comment = String(body.comment ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Please choose a rating from 1 to 5 stars." }, { status: 400 });
  }
  if (comment.length > 1000) {
    return NextResponse.json({ error: "Review must be 1000 characters or fewer." }, { status: 400 });
  }

  if (!(await hasPurchasedProduct(user.id, productId))) {
    return NextResponse.json(
      { error: "Only customers who ordered this product can review it." },
      { status: 403 },
    );
  }

  await upsertReview({ productId, userId: user.id, reviewerName: user.name, rating, comment });
  return NextResponse.json({ ok: true });
}
