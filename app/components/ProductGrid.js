import ProductCard from "@/app/components/ProductCard";

export default function ProductGrid({ products }) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-slate-500">No products found.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
