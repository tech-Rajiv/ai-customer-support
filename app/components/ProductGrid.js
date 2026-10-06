import ProductCard from "@/app/components/ProductCard";

export default function ProductGrid({ products }) {
  if (products.length === 0) {
    return <p className="rounded bg-white py-12 text-center text-gray-600">No results found. Try a different search.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
