"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/app/components/Modal";
import { RETURN_REASONS } from "@/lib/returns";

// Opens the return dialog: choose a reason, add a comment, confirm.
export default function ReturnButton({ orderId, defectOnly = false, deadline }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not request the return.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const reasons = defectOnly ? RETURN_REASONS.filter((r) => r.defect) : RETURN_REASONS;

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-zee-border bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50">
        Return items
      </button>
      {open && (
        <Modal title={`Return order #${orderId}`} onClose={() => setOpen(false)}>
          <p className="mb-3 text-sm text-gray-600">
            Why are you returning this order?{deadline && <> You can return it until <b>{deadline}</b>.</>}
          </p>
          {defectOnly && (
            <p className="mb-3 rounded bg-amber-50 p-2 text-xs text-amber-900">
              In-ear products can only be returned if defective, damaged or the wrong item.
            </p>
          )}
          <fieldset className="space-y-2">
            <legend className="sr-only">Return reason</legend>
            {reasons.map((r) => (
              <label key={r.value} className={`flex cursor-pointer items-center gap-2 rounded border p-2 text-sm ${reason === r.value ? "border-zee-orange-dark bg-amber-50" : "border-zee-border"}`}>
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                {r.label}
              </label>
            ))}
          </fieldset>
          <label className="mt-3 block text-sm font-bold">
            Comments <span className="font-normal text-gray-500">(optional)</span>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3}
              className="mt-1 w-full rounded border border-gray-400 px-3 py-2 text-sm font-normal outline-none focus:border-zee-orange-dark focus:ring-2 focus:ring-zee-orange" />
          </label>
          {error && <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <button onClick={confirm} disabled={loading} className="mt-4 w-full rounded-full bg-zee-yellow py-2 text-sm hover:bg-zee-yellow-dark disabled:opacity-60">
            {loading ? "Submitting..." : "Confirm return"}
          </button>
        </Modal>
      )}
    </>
  );
}
