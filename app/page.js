import Link from "next/link";
import { redirect } from "next/navigation";
import ProductGrid from "@/app/components/ProductGrid";
import { getCategoryCounts, getProducts } from "@/lib/queries";

const CATEGORY_STYLES = {
  Audio: { icon: "🎧", gradient: "from-sky-500 to-indigo-600" },
  "Computer Accessories": { icon: "⌨️", gradient: "from-emerald-500 to-teal-600" },
  "Mobile Accessories": { icon: "🔋", gradient: "from-amber-400 to-orange-600" },
  Office: { icon: "💻", gradient: "from-fuchsia-500 to-purple-600" },
  Wearables: { icon: "⌚", gradient: "from-rose-500 to-red-600" },
};
const FALLBACK_STYLE = { icon: "🛍️", gradient: "from-slate-500 to-slate-700" };

const PERKS = [
  { icon: "🚚", title: "Free delivery", text: "On orders over ₹999" },
  { icon: "↩️", title: "10-day returns", text: "Hassle-free approvals" },
  { icon: "🛡️", title: "12-month warranty", text: "On most electronics" },
  { icon: "💬", title: "Zee AI support", text: "Help 24/7, humans Mon–Sat" },
];

export default async function HomePage({ searchParams }) {
  // Old-style filter links now live on the search page.
  const sp = await searchParams;
  if (sp.q || sp.category) {
    const p = new URLSearchParams();
    if (typeof sp.q === "string") p.set("q", sp.q);
    if (typeof sp.category === "string") p.set("category", sp.category);
    redirect(`/search?${p}`);
  }

  const [products, categories] = await Promise.all([getProducts(), getCategoryCounts()]);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-zee-navy via-zee-navy2 to-[#0b5563] text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-zee-orange/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-[1500px] items-center gap-8 px-6 pb-28 pt-10 md:grid-cols-2 md:pb-32 md:pt-14">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zee-orange">
              New · Meet Zee, your AI shopping assistant
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              Big savings on <span className="text-zee-orange">everyday tech</span>
            </h1>
            <p className="mt-3 max-w-lg text-gray-200">
              Headphones, keyboards, smart watches and more, delivered to your door across India. Stuck with an order? Just ask Zee.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#products" className="rounded-full bg-zee-yellow px-6 py-2.5 text-sm font-medium text-zee-navy hover:bg-zee-yellow-dark">
                Shop now
              </Link>
              <Link href="/search?category=Audio" className="rounded-full border border-white/60 px-6 py-2.5 text-sm font-medium hover:bg-white/10">
                Explore Audio
              </Link>
            </div>
          </div>

          <div className="relative hidden h-64 md:block" aria-hidden="true">
            {[
              { icon: "🎧", label: "From ₹1,999", cls: "left-2 top-6 -rotate-6" },
              { icon: "⌨️", label: "From ₹3,499", cls: "left-48 top-0 rotate-3" },
              { icon: "⌚", label: "From ₹4,999", cls: "left-24 top-32 rotate-6" },
              { icon: "🔋", label: "From ₹1,799", cls: "left-72 top-28 -rotate-3" },
            ].map((c) => (
              <div key={c.icon} className={`absolute flex h-32 w-36 flex-col items-center justify-center rounded-2xl bg-white/10 shadow-xl ring-1 ring-white/20 backdrop-blur ${c.cls}`}>
                <span className="text-5xl">{c.icon}</span>
                <span className="mt-2 rounded-full bg-zee-yellow px-2.5 py-0.5 text-xs font-bold text-zee-navy">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-20 max-w-[1500px] px-3 pb-8 md:-mt-24">
        <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-zee-border shadow-lg lg:grid-cols-4">
          {PERKS.map((p) => (
            <div key={p.title} className="flex items-center gap-3 bg-white p-4">
              <span className="text-3xl">{p.icon}</span>
              <div>
                <p className="text-sm font-bold text-zee-navy">{p.title}</p>
                <p className="text-xs text-gray-600">{p.text}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mb-3 mt-6 text-2xl font-bold text-zee-navy">Shop by category</h2>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {categories.map(({ category, count }) => {
            const style = CATEGORY_STYLES[category] ?? FALLBACK_STYLE;
            return (
              <Link
                key={category}
                href={`/search?category=${encodeURIComponent(category)}`}
                className={`group relative flex h-40 flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br ${style.gradient} p-4 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl`}
              >
                <span className="absolute -bottom-3 -right-2 text-7xl opacity-90 transition group-hover:scale-110">{style.icon}</span>
                <span className="text-lg font-bold leading-tight drop-shadow">{category}</span>
                <span className="text-xs font-medium text-white/90">
                  {count} product{count === 1 ? "" : "s"} · Shop now →
                </span>
              </Link>
            );
          })}
        </div>

        <section id="products" className="scroll-mt-32">
          <div className="mb-3 rounded bg-white px-4 py-3">
            <h2 className="text-xl font-bold text-zee-navy">Featured products</h2>
          </div>
          <ProductGrid products={products} />
        </section>
      </div>
    </div>
  );
}
