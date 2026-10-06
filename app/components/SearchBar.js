"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar({ categories }) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";

  function onSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const query = String(data.get("q") ?? "").trim();
    const cat = String(data.get("category") ?? "");
    if (query) next.set("q", query);
    if (cat) next.set("category", cat);
    router.push(`/search${next.size ? `?${next}` : ""}`);
  }

  // `key` resets the fields when the URL changes (e.g. clicking a category link).
  return (
    <form
      key={`${q}|${category}`}
      onSubmit={onSubmit}
      role="search"
      className="order-last flex w-full min-w-0 flex-1 overflow-hidden rounded-md focus-within:ring-2 focus-within:ring-zee-orange md:order-none md:w-auto"
    >
      <select
        name="category"
        aria-label="Search category"
        defaultValue={category}
        className="hidden max-w-36 border-r border-zee-border bg-[#e6e6e6] px-2 text-xs text-gray-700 outline-none hover:bg-[#d4d4d4] sm:block"
      >
        <option value="">All</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search ZeeCart"
        className="min-w-0 flex-1 bg-white px-3 py-2 text-sm text-zee-navy outline-none"
      />
      <button aria-label="Search" className="bg-zee-orange px-4 text-zee-navy hover:bg-zee-orange-dark">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8" />
        </svg>
      </button>
    </form>
  );
}
