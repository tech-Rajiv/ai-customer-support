// Read-only star rating with fractional fill (e.g. 4.2 fills 84%).
export default function Stars({ rating, size = "text-base" }) {
  const pct = Math.max(0, Math.min(5, rating)) * 20;
  return (
    <span className={`relative inline-block leading-none ${size}`} role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      <span className="text-gray-300">★★★★★</span>
      <span className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-zee-star" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  );
}
