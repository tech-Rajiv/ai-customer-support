import ProductGrid from "@/app/components/ProductGrid";
import { getProducts } from "@/lib/queries";

export default async function HomePage({ searchParams }) {
  const { q, category } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const cat = typeof category === "string" ? category : "";
  const products = await getProducts({ search, category: cat });

  const title = search ? `Results for “${search}”` : cat || "All products";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {!search && !cat && (
        <section className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white">
          <h1 className="text-3xl font-bold">Everyday tech, delivered.</h1>
          <p className="mt-2 max-w-xl text-indigo-100">
            Browse the NovaCart demo store, log in with a demo account, and try the AI Support chat in the corner.
          </p>
        </section>
      )}
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <ProductGrid products={products} />
    </div>
  );
}
