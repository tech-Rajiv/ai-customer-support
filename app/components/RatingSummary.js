import Link from "next/link";
import Stars from "@/app/components/Stars";

// "★★★★☆ 4.2 (5)" — links to the product's reviews when `href` is given.
export default function RatingSummary({ rating, count, href }) {
  if (!count) {
    return <span className="text-sm text-gray-500">No reviews yet</span>;
  }
  const inner = (
    <>
      <span className="text-sm text-zee-navy">{rating.toFixed(1)}</span>
      <Stars rating={rating} />
      <span className="text-sm text-zee-link">({count})</span>
    </>
  );
  return href ? (
    <Link href={href} className="inline-flex items-center gap-1.5 hover:text-zee-link-hover">{inner}</Link>
  ) : (
    <span className="inline-flex items-center gap-1.5">{inner}</span>
  );
}
