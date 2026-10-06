import Link from "next/link";
import ProductRow from "@/app/components/ProductRow";
import { getCategoryCounts, getProducts } from "@/lib/queries";

export const metadata = { title: "Search — ZeeCart" };

const SORT_OPTIONS = [
  { key: "", label: "Featured" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "rating", label: "Avg. Customer Review" },
];

function href({ q, category, sort }) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (category) p.set("category", category);
  if (sort) p.set("sort", sort);
  return `/search${p.size ? `?${p}` : ""}`;
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "";

  const [products, categoryCounts] = await Promise.all([
    getProducts({ search: q, category, sort }),
    getCategoryCounts({ search: q }),
  ]);
  const total = categoryCounts.reduce((n, c) => n + c.count, 0);

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4">
      <div className="mb-3 rounded bg-white px-4 py-3 text-sm">
        <span className="text-gray-600">
          {products.length} result{products.length === 1 ? "" : "s"}
          {q && <> for <b className="text-zee-link-hover">“{q}”</b></>}
          {category && <> in <b>{category}</b></>}
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-gray-600">Sort by:</span>
          {SORT_OPTIONS.map((o) => (
            <Link
              key={o.key}
              href={href({ q, category, sort: o.key })}
              className={`rounded-full border px-3 py-1 text-xs ${
                sort === o.key ? "border-zee-navy bg-zee-navy text-white" : "border-zee-border hover:bg-gray-50"
              }`}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-zee-navy">Category</h2>
          <ul className="space-y-1">
            <li>
              <Link href={href({ q, sort })} className={!category ? "font-bold text-zee-link-hover" : "hover:text-zee-link-hover"}>
                All categories <span className="text-gray-400">({total})</span>
              </Link>
            </li>
            {categoryCounts.map((c) => (
              <li key={c.category}>
                <Link
                  href={href({ q, category: c.category, sort })}
                  className={category === c.category ? "font-bold text-zee-link-hover" : "hover:text-zee-link-hover"}
                >
                  {c.category} <span className="text-gray-400">({c.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-3">
          {products.length === 0 ? (
            <div className="rounded bg-white p-8 text-center">
              <p className="text-lg font-bold text-zee-navy">No results for “{q || category}”</p>
              <p className="mt-1 text-sm text-gray-600">
                Try checking your spelling or using more general words like “headphones”, “keyboard” or “watch”.
              </p>
              <Link href="/" className="mt-4 inline-block rounded-full bg-zee-yellow px-5 py-2 text-sm hover:bg-zee-yellow-dark">
                Continue shopping
              </Link>
            </div>
          ) : (
            products.map((p) => <ProductRow key={p.id} product={p} />)
          )}
        </section>
      </div>
    </div>
  );
}
