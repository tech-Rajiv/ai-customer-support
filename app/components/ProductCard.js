import AddToCartButton from "@/app/components/AddToCartButton";
import { formatPrice } from "@/lib/format";

function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <span className="flex items-center gap-1 text-sm">
      <span className="text-zee-star" aria-hidden="true">{"★".repeat(full)}<span className="text-gray-300">{"★".repeat(5 - full)}</span></span>
      <span className="text-zee-link">{rating.toFixed(1)}</span>
      <span className="sr-only">out of 5 stars</span>
    </span>
  );
}

export default function ProductCard({ product }) {
  return (
    <div className="flex flex-col rounded bg-white p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image_url} alt={product.name} loading="lazy" className="aspect-square w-full bg-white object-cover" />
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 text-base leading-snug text-zee-navy hover:text-zee-link-hover">{product.name}</h3>
        <Stars rating={product.rating} />
        <p className="mt-1 text-2xl text-zee-navy">{formatPrice(product.price)}</p>
        <p className="text-xs text-gray-600">
          <span className="font-bold text-zee-link">FREE Delivery</span> on orders over ₹999
        </p>
        <p className="text-xs text-gray-500">{product.category}</p>
        <div className="mt-auto pt-3">
          <AddToCartButton product={{ id: product.id, name: product.name, price: product.price }} />
        </div>
      </div>
    </div>
  );
}
