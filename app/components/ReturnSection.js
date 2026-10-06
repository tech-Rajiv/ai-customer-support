import ReturnButton from "@/app/components/ReturnButton";
import { formatDate } from "@/lib/format";
import { getReturnInfo, reasonLabel } from "@/lib/returns";

// Return status line + "Return items" button for a delivered order. Shared by the
// orders list and the order detail page.
export default function ReturnSection({ order }) {
  const info = getReturnInfo(order);

  if (info.state === "requested") {
    return (
      <p className="text-sm text-purple-800">
        Return requested{order.return_requested_at && <> on {formatDate(order.return_requested_at)}</>}
        {order.return_reason && <> · {reasonLabel(order.return_reason)}</>}
      </p>
    );
  }
  if (info.state === "eligible") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-700">
          Return window closes <b>{formatDate(info.deadline)}</b>{" "}
          <span className={info.daysLeft <= 2 ? "font-bold text-red-700" : "text-gray-500"}>
            ({info.daysLeft} day{info.daysLeft === 1 ? "" : "s"} left)
          </span>
        </p>
        <ReturnButton orderId={order.id} defectOnly={info.defectOnly} deadline={formatDate(info.deadline)} />
      </div>
    );
  }
  if (info.state === "expired") {
    return <p className="text-sm text-gray-500">Return window closed on {formatDate(info.deadline)}</p>;
  }
  return null;
}
