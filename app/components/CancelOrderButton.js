"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/app/components/Modal";

// Manual cancel from the Orders pages. A short confirm dialog guards against misclicks;
// the API re-checks the cancellation policy. (Zee's own cancellations use the chat's
// confirmation card instead: see lib/agent/humanInTheLoop.js.)
export default function CancelOrderButton({ orderId, refund, delayed }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState("idle"); // idle | loading | done
  const [error, setError] = useState("");

  async function confirm() {
    setState("loading");
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not cancel the order.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setState("idle");
    }
  }

  // Refresh when the dialog closes: the order is cancelled by then, so this button goes away.
  function close() {
    setOpen(false);
    if (state === "done") router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 shadow-sm hover:bg-red-50">
        Cancel order
      </button>
      {open && (
        <Modal title={state === "done" ? "Order cancelled" : `Cancel order #${orderId}?`} onClose={close}>
          {state === "done" ? (
            <>
              <p className="text-sm text-gray-700">Order #{orderId} has been cancelled. {refund}</p>
              {delayed && <p className="mt-2 text-sm text-gray-700">We&apos;ve asked the carrier to recall the package (support ticket created).</p>}
              <button onClick={close} className="mt-4 w-full rounded-full bg-zee-yellow py-2 text-sm hover:bg-zee-yellow-dark">Done</button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700">This can&apos;t be undone. {refund}</p>
              {error && <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={confirm} disabled={state === "loading"} className="flex-1 rounded-full bg-red-600 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60">
                  {state === "loading" ? "Cancelling..." : "Yes, cancel order"}
                </button>
                <button onClick={close} disabled={state === "loading"} className="flex-1 rounded-full border border-zee-border bg-white py-2 text-sm hover:bg-gray-50">
                  Keep order
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
