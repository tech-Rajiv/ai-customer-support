import AddToCartButton from "@/app/components/AddToCartButton";
import { formatPrice } from "@/lib/format";

export default function ProductCard({ product }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image_url} alt={product.name} loading="lazy" className="aspect-square w-full bg-slate-100 object-cover" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wide text-slate-400">{product.category}</span>
        <h3 className="font-semibold leading-snug">{product.name}</h3>
        <div className="flex items-center gap-1 text-sm text-amber-500">
          <span>★</span>
          <span className="text-slate-600">{product.rating.toFixed(1)}</span>
        </div>
        <p className="mt-1 text-lg font-bold">{formatPrice(product.price)}</p>
        <div className="mt-auto pt-3">
          <AddToCartButton product={{ id: product.id, name: product.name, price: product.price }} />
        </div>
      </div>
    </div>
  );
}
