import CancelOrderButton from "@/app/components/CancelOrderButton";
import { getCancellationInfo } from "@/lib/cancellation";
import { formatDate } from "@/lib/format";

// "Cancel order" button when the cancellation policy allows it, or a hint for delayed orders
// that must wait a little longer. Shared by the orders list and the order detail page.
export default function CancelSection({ order }) {
  const info = getCancellationInfo(order);

  if (info.state === "allowed") {
    return (
      <div className="space-y-1">
        {info.delayed && (
          <p className="text-sm text-amber-800">
            This order is {info.businessDaysLate} business days late, so you can cancel it even though it has shipped.
          </p>
        )}
        <CancelOrderButton orderId={order.id} refund={info.refund} delayed={!!info.delayed} />
      </div>
    );
  }
  if (info.state === "wait") {
    return (
      <p className="text-sm text-gray-600">
        Delayed orders can be cancelled if they still haven&apos;t arrived after <b>{formatDate(info.cancellableAfter)}</b>.
      </p>
    );
  }
  return null;
}
