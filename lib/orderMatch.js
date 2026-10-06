// "earphone" matches "Wireless Earphones": every word must appear in an item's name or category.
export function matchesProduct(order, query) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t));
  if (terms.length === 0) return false;
  return order.items.some((i) => {
    const haystack = `${i.name} ${i.category}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}
