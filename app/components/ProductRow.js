import Link from "next/link";
import AddToCartButton from "@/app/components/AddToCartButton";
import RatingSummary from "@/app/components/RatingSummary";
import { formatPrice } from "@/lib/format";

// Amazon-style list item used on the search results page.
export default function ProductRow({ product }) {
  const href = `/products/${product.id}`;
  return (
    <div className="flex gap-4 rounded bg-white p-4">
      <Link href={href} className="w-32 shrink-0 sm:w-48">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt={product.name} loading="lazy" className="aspect-square w-full object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link href={href}>
          <h2 className="text-lg leading-snug text-zee-navy hover:text-zee-link-hover">{product.name}</h2>
        </Link>
        <RatingSummary rating={product.rating} count={product.review_count} href={`${href}#reviews`} />
        <p className="line-clamp-2 text-sm text-gray-600">{product.description}</p>
        <p className="mt-1 text-2xl text-zee-navy">{formatPrice(product.price)}</p>
        <p className="text-xs text-gray-600">
          <span className="font-bold text-zee-link">FREE Delivery</span> on orders over ₹999
        </p>
        <div className="mt-auto max-w-56 pt-3">
          <AddToCartButton product={{ id: product.id, name: product.name, price: product.price }} />
        </div>
      </div>
    </div>
  );
}
