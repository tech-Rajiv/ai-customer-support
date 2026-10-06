"use client";

import { useEffect } from "react";

// Centered dialog: closes on Esc, on backdrop click and via the × button.
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-2xl"
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-2 text-2xl leading-none text-gray-400 hover:text-gray-700">×</button>
        <h2 className="mb-3 pr-6 text-xl font-bold text-zee-navy">{title}</h2>
        {children}
      </div>
    </div>
  );
}
