import Link from "next/link";
import ProductGrid from "@/app/components/ProductGrid";
import { getCategories, getProducts } from "@/lib/queries";

export default async function HomePage({ searchParams }) {
  const { q, category } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const cat = typeof category === "string" ? category : "";
  const [products, categories] = await Promise.all([getProducts({ search, category: cat }), getCategories()]);
  const filtered = search || cat;

  return (
    <div className="mx-auto max-w-[1500px]">
      {!filtered && (
        <section className="relative bg-gradient-to-b from-zee-navy3 to-background px-4 pb-24 pt-10 sm:pb-32">
          <div className="mx-auto max-w-3xl text-center text-white">
            <h1 className="text-3xl font-bold sm:text-4xl">Big savings on everyday tech</h1>
            <p className="mt-2 text-gray-200">
              Headphones, keyboards, smart watches and more, delivered to your door. Chat with <b>Zee</b> for help with any order.
            </p>
            <Link href="#products" className="mt-5 inline-block rounded-full bg-zee-yellow px-6 py-2 text-sm font-medium text-zee-navy hover:bg-zee-yellow-dark">
              Shop now
            </Link>
          </div>
        </section>
      )}

      <div className={`relative px-3 pb-8 ${filtered ? "pt-4" : "-mt-20 sm:-mt-28"}`}>
        {!filtered && (
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.slice(0, 4).map((c) => (
              <Link key={c} href={`/?category=${encodeURIComponent(c)}`} className="rounded bg-white p-4 hover:shadow-lg">
                <h2 className="mb-2 text-lg font-bold text-zee-navy">{c}</h2>
                <div className="flex h-24 items-center justify-center rounded bg-gray-100 text-4xl sm:h-32">
                  {{ Audio: "🎧", "Computer Accessories": "⌨️", Wearables: "⌚", Office: "💻", "Mobile Accessories": "🔋" }[c] ?? "🛍️"}
                </div>
                <span className="mt-3 block text-sm text-zee-link hover:text-zee-link-hover hover:underline">Shop now</span>
              </Link>
            ))}
          </div>
        )}

        <section id="products" className="scroll-mt-32">
          <div className="mb-3 rounded bg-white p-4">
          <h2 className="mb-1 text-xl font-bold text-zee-navy">
            {search ? `Results for “${search}”` : cat || "Featured products"}
          </h2>
          {filtered && <p className="mb-3 text-sm text-gray-600">{products.length} result{products.length === 1 ? "" : "s"}</p>}
          </div>
          <ProductGrid products={products} />
        </section>
      </div>
    </div>
  );
}
