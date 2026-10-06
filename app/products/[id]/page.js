import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/app/components/AddToCartButton";
import RatingSummary from "@/app/components/RatingSummary";
import ReviewForm from "@/app/components/ReviewForm";
import Stars from "@/app/components/Stars";
import { getCurrentUser } from "@/lib/auth";
import { getProduct, getReviews, hasPurchasedProduct } from "@/lib/queries";
import { formatDate, formatPrice } from "@/lib/format";

export async function generateMetadata({ params }) {
  const product = await getProduct(Number((await params).id));
  return { title: product ? `${product.name} — ZeeCart` : "Product not found — ZeeCart" };
}

export default async function ProductPage({ params }) {
  const productId = Number((await params).id);
  if (!Number.isInteger(productId)) notFound();

  const product = await getProduct(productId);
  if (!product) notFound();

  const [user, reviews] = await Promise.all([getCurrentUser(), getReviews(productId)]);
  const canReview = user ? await hasPurchasedProduct(user.id, productId) : false;
  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const n = reviews.filter((r) => r.rating === star).length;
    return { star, n, pct: reviews.length ? Math.round((n / reviews.length) * 100) : 0 };
  });
  const stockText = product.stock === 0 ? "Out of stock" : product.stock <= 10 ? `Only ${product.stock} left in stock` : "In stock";
  const stockClass = product.stock === 0 ? "text-red-700" : product.stock <= 10 ? "text-zee-link-hover" : "text-green-700";

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-3 py-4">
      <nav className="text-xs text-gray-600" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-zee-link-hover hover:underline">Home</Link>
        {" › "}
        <Link href={`/search?category=${encodeURIComponent(product.category)}`} className="hover:text-zee-link-hover hover:underline">{product.category}</Link>
        {" › "}
        <span>{product.name}</span>
      </nav>

      <section className="grid gap-6 rounded bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_280px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt={product.name} className="aspect-square w-full max-w-md rounded object-cover lg:max-w-none" />

        <div className="space-y-3">
          <h1 className="text-2xl leading-snug text-zee-navy">{product.name}</h1>
          <RatingSummary rating={product.rating} count={product.review_count} href="#reviews" />
          <hr />
          <p className="text-3xl text-zee-navy">{formatPrice(product.price)}</p>
          <p className="-mt-2 text-xs text-gray-500">Inclusive of all taxes</p>
          <div>
            <h2 className="mb-1 font-bold text-zee-navy">About this item</h2>
            <p className="text-sm leading-relaxed text-gray-800">{product.description}</p>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-800">
            <li>12-month ZeeCart warranty on most electronics</li>
            <li>30-day returns on eligible products</li>
            <li>Free standard delivery on orders over ₹999</li>
          </ul>
        </div>

        <aside className="h-fit space-y-3 rounded-lg border border-zee-border p-4">
          <p className="text-2xl text-zee-navy">{formatPrice(product.price)}</p>
          <p className="text-sm">
            <span className="font-bold text-zee-link">FREE delivery</span> on orders over ₹999. Standard delivery in 5–7 business days.
          </p>
          <p className={`text-lg font-bold ${stockClass}`}>{stockText}</p>
          {product.stock > 0 && <AddToCartButton product={{ id: product.id, name: product.name, price: product.price }} />}
          <p className="text-xs text-gray-600">🔒 Secure transaction · Sold by ZeeCart</p>
        </aside>
      </section>

      <section id="reviews" className="scroll-mt-32 grid gap-6 rounded bg-white p-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-zee-navy">Customer reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-600">No reviews yet. Be the first to review this product.</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Stars rating={product.rating} size="text-2xl" />
                <span className="text-lg">{product.rating.toFixed(1)} out of 5</span>
              </div>
              <p className="text-sm text-gray-600">{reviews.length} global rating{reviews.length === 1 ? "" : "s"}</p>
              <ul className="space-y-1.5 text-sm">
                {breakdown.map((b) => (
                  <li key={b.star} className="flex items-center gap-2">
                    <span className="w-12 text-zee-link">{b.star} star</span>
                    <span className="h-5 flex-1 overflow-hidden rounded-sm border border-zee-border bg-gray-100">
                      <span className="block h-full bg-zee-star" style={{ width: `${b.pct}%` }} />
                    </span>
                    <span className="w-9 text-right text-zee-link">{b.pct}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <hr />
          {!user ? (
            <p className="text-sm">
              <Link href="/login" className="font-bold text-zee-link hover:text-zee-link-hover hover:underline">Sign in</Link>{" "}
              to review products you have bought.
            </p>
          ) : !canReview ? (
            <p className="text-sm text-gray-600">Only customers who ordered this product can review it.</p>
          ) : (
            <ReviewForm key={myReview?.id ?? "new"} productId={product.id} existing={myReview} />
          )}
        </div>

        <div className="space-y-5">
          {reviews.map((r) => (
            <article key={r.id} className="border-b border-gray-200 pb-5 last:border-0">
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                  {r.reviewer_name.charAt(0)}
                </span>
                <span className="text-zee-navy">{user && r.user_id === user.id ? `${r.reviewer_name} (you)` : r.reviewer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Stars rating={r.rating} />
                <span className="text-xs font-bold text-[#c45500]">Verified Purchase</span>
              </div>
              <p className="mb-2 text-xs text-gray-500">Reviewed on {formatDate(r.created_at)}</p>
              {r.comment && <p className="whitespace-pre-wrap text-sm text-gray-800">{r.comment}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
