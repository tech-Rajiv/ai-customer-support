"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RETURN_REASONS } from "@/lib/returns";
import { formatPrice } from "@/lib/format";

// Human-in-the-loop card for sensitive actions Zee proposed (see lib/agent/humanInTheLoop.js).
// The Yes button calls the real API directly, so the model is never trusted to do the action.
// proposal.status "done" means the action ran without confirmation (it isn't in HITL_ACTIONS).
export default function ActionConfirmation({ proposal }) {
  const router = useRouter();
  const isReturn = proposal.action === "return_order";
  const [state, setState] = useState(proposal.status === "done" ? "done" : "pending"); // pending | loading | done | declined
  const [reason, setReason] = useState(proposal.reason ?? "");
  const [error, setError] = useState("");

  const reasons = proposal.defectOnly ? RETURN_REASONS.filter((r) => r.defect) : RETURN_REASONS;

  async function confirm() {
    setState("loading");
    setError("");
    try {
      const res = await fetch(`/api/orders/${proposal.orderId}/${isReturn ? "return" : "cancel"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isReturn ? { reason, comment: proposal.comment ?? "" } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setState("pending");
        return;
      }
      setState("done");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setState("pending");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900" role="status">
        {isReturn ? (
          <>
            <p className="font-bold">✓ Return requested for order #{proposal.orderId}.</p>
            <p className="mt-1 text-xs">Support will confirm within 1 business day with return instructions.</p>
          </>
        ) : (
          <>
            <p className="font-bold">✓ Order #{proposal.orderId} has been cancelled.</p>
            <p className="mt-1 text-xs">{proposal.refund}</p>
            {proposal.delayed && <p className="mt-1 text-xs">We&apos;ve asked the carrier to recall the package (support ticket created).</p>}
          </>
        )}
      </div>
    );
  }
  if (state === "declined") {
    return (
      <div className="rounded-lg border border-zee-border bg-white p-3 text-sm text-gray-700">
        {isReturn ? `Okay, no return for order #${proposal.orderId}.` : `Okay, order #${proposal.orderId} stays as it is.`}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zee-orange-dark bg-amber-50 p-3 text-sm">
      <p className="font-bold text-zee-navy">
        {isReturn ? `Return order #${proposal.orderId}?` : `Cancel order #${proposal.orderId}?`}
      </p>
      <p className="text-gray-700">{proposal.items.join(", ")} · {formatPrice(proposal.total)}</p>

      {isReturn && (
        <label className="mt-2 block text-xs font-bold text-zee-navy">
          Reason
          <select value={reason} onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded border border-gray-400 bg-white px-2 py-1.5 text-sm font-normal">
            {reasons.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {proposal.lastDay && <span className="mt-1 block font-normal text-gray-600">You can return it until {proposal.lastDay}.</span>}
        </label>
      )}

      {error && <p role="alert" className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={confirm} disabled={state === "loading"}
          className={`flex-1 rounded-full py-1.5 text-xs font-medium text-white disabled:opacity-60 ${isReturn ? "bg-zee-navy hover:bg-zee-navy2" : "bg-red-600 hover:bg-red-700"}`}>
          {state === "loading" ? "Please wait..." : isReturn ? "Yes, return it" : "Yes, cancel order"}
        </button>
        <button onClick={() => setState("declined")} disabled={state === "loading"}
          className="flex-1 rounded-full border border-zee-border bg-white py-1.5 text-xs hover:bg-gray-50">
          No, keep it
        </button>
      </div>
    </div>
  );
}
