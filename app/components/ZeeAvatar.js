// Zee, the support assistant: a friendly robot face with blinking eyes.
export default function ZeeAvatar({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="zee-avatar-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd814" />
          <stop offset="1" stopColor="#f3a847" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#zee-avatar-g)" />
      <path d="M24 9V6" stroke="#131921" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="5.2" r="2.4" fill="#131921" />
      <rect x="9" y="11" width="30" height="25" rx="9" fill="#131921" />
      <rect x="5" y="19" width="4" height="9" rx="2" fill="#131921" />
      <rect x="39" y="19" width="4" height="9" rx="2" fill="#131921" />
      <ellipse className="zee-eye" cx="18" cy="22.5" rx="3" ry="3.6" fill="#7ee8fa" />
      <ellipse className="zee-eye" cx="30" cy="22.5" rx="3" ry="3.6" fill="#7ee8fa" />
      <path d="M18.5 29.5q5.5 4 11 0" fill="none" stroke="#febd69" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
