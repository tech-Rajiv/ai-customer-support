"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ productId, existing }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!rating) {
      setError("Please choose a star rating.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save your review.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const shown = hover || rating;
  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-zee-border bg-white p-4">
      <h3 className="text-lg font-bold text-zee-navy">{existing ? "Edit your review" : "Write a review"}</h3>
      <div>
        <p className="mb-1 text-sm font-bold">Your rating</p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className={`text-3xl leading-none transition ${n <= shown ? "text-zee-star" : "text-gray-300"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <label className="block text-sm font-bold">
        Your review <span className="font-normal text-gray-500">(optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="What did you like or dislike? How did you use this product?"
          className="mt-1 w-full rounded border border-gray-400 px-3 py-2 text-sm font-normal outline-none focus:border-zee-orange-dark focus:ring-2 focus:ring-zee-orange"
        />
      </label>
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="rounded border border-green-300 bg-green-50 p-2 text-sm text-green-800">Thanks! Your review has been saved.</p>}
      <button disabled={loading} className="rounded-full bg-zee-yellow px-5 py-2 text-sm hover:bg-zee-yellow-dark disabled:opacity-60">
        {loading ? "Saving..." : existing ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
