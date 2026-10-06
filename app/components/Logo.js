// ZeeCart logo: orange cart mark with a "Z" in the basket + two-tone wordmark.
// `dark` = for dark backgrounds (white "Zee"), otherwise navy "Zee".
export default function Logo({ dark = false, size = "md" }) {
  const mark = size === "lg" ? 44 : size === "sm" ? 28 : 34;
  const text = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={mark} height={mark} viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="zee-logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd814" />
            <stop offset="1" stopColor="#f3a847" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#zee-logo-g)" />
        <path d="M6 9h4l3.2 13.2a1.6 1.6 0 0 0 1.6 1.2H28a1.6 1.6 0 0 0 1.5-1.1L32 14" fill="none" stroke="#131921" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16.5 13.5h8l-8 6h8" fill="none" stroke="#131921" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="29.5" r="2.3" fill="#131921" />
        <circle cx="27" cy="29.5" r="2.3" fill="#131921" />
      </svg>
      <span className={`${text} font-extrabold leading-none tracking-tight`}>
        <span className={dark ? "text-white" : "text-zee-navy"}>Zee</span>
        <span className="text-zee-orange">Cart</span>
      </span>
    </span>
  );
}
