import "server-only";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrdersForUser } from "@/lib/queries";
import { getReturnInfo, reasonLabel } from "@/lib/returns";
import { isActiveOrder } from "@/lib/format";
import { businessDaysBetween, getCancellationInfo } from "@/lib/cancellation";
import { matchesProduct } from "@/lib/orderMatch";

const MAX_ORDERS = 6;
const day = (d) => (d ? new Date(d).toLocaleDateString("en-CA") : null); // YYYY-MM-DD

const schema = z.object({
  productQuery: z
    .string()
    .optional()
    .describe(
      "Words from the product the customer is asking about, e.g. 'earphone', 'power bank', 'keyboard'. Omit to get their most recent orders.",
    ),
});

// Plain-language "can I return this?" computed in code, so the model never does date math.
function describeReturn(order) {
  const info = getReturnInfo(order);
  switch (info.state) {
    case "eligible":
      return {
        state: "eligible",
        last_day_to_return: day(info.deadline),
        days_left: info.daysLeft,
        window_days: info.returnDays,
        ...(info.defectOnly && {
          restriction: "In-ear product: can only be returned if defective, damaged or the wrong item.",
        }),
      };
    case "expired":
      return { state: "window_closed", window_days: info.returnDays, closed_on: day(info.deadline) };
    case "requested":
      return { state: "return_already_requested", reason: reasonLabel(order.return_reason) };
    default:
      return { state: "not_delivered_yet" };
  }
}

// Whether the customer can cancel this order right now, per the cancellation policy.
function describeCancellation(order) {
  const info = getCancellationInfo(order);
  if (info.state === "allowed") {
    return { can_cancel: true, ...(info.delayed && { note: "Delayed more than 3 business days, so cancellation is allowed even though it shipped." }) };
  }
  if (info.state === "wait") {
    return { can_cancel: false, reason: info.reason, can_cancel_after: day(info.cancellableAfter) };
  }
  return { can_cancel: false, reason: info.reason };
}

function summarize(order) {
  const today = new Date();
  const overdue =
    isActiveOrder(order.status) && order.expected_delivery && new Date(order.expected_delivery) < today
      ? Math.floor((today - new Date(order.expected_delivery)) / 86_400_000)
      : 0;
  return {
    order_id: order.id,
    status: order.status,
    placed_on: day(order.created_at),
    expected_delivery: order.status === "cancelled" ? null : day(order.expected_delivery),
    delivered_on: day(order.delivered_at),
    days_past_expected_delivery: overdue || undefined,
    business_days_past_expected_delivery:
      order.status === "delayed" ? businessDaysBetween(order.expected_delivery, today) : undefined,
    total_inr: order.total_amount,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
    return: describeReturn(order),
    cancellation: describeCancellation(order),
  };
}

// Returns [text for the LLM, order cards for the UI]. Only ever reads the logged-in user's orders.
export const getMyOrdersTool = tool(
  async ({ productQuery }, config) => {
    const userId = config?.configurable?.userId;
    if (!userId) {
      return [
        JSON.stringify({ error: "not_logged_in", note: "The customer is not signed in, so their orders can't be accessed." }),
        [],
      ];
    }

    const orders = await getOrdersForUser(userId);
    const query = productQuery?.trim();
    const matched = query ? orders.filter((o) => matchesProduct(o, query)) : orders.slice(0, MAX_ORDERS);

    const payload = {
      today: day(new Date()),
      searched_for: query ?? null,
      order_count: matched.length,
      orders: matched.slice(0, MAX_ORDERS).map(summarize),
      ...(query && matched.length === 0 && {
        note: "No order contains that product.",
        all_ordered_products: [...new Set(orders.flatMap((o) => o.items.map((i) => i.name)))],
      }),
    };
    const cards = matched.slice(0, 3).map((o) => ({
      id: o.id,
      status: o.status,
      items: o.items.map((i) => i.name),
      total: o.total_amount,
    }));
    return [JSON.stringify(payload), cards];
  },
  {
    name: "get_my_orders",
    description:
      "Get the logged-in customer's own orders: status (confirmed, shipped, out_for_delivery, delayed, delivered, cancelled, return_requested), expected and actual delivery dates, items, total, whether each order can still be returned (with the last day to return) and whether it can be cancelled. Use it for 'where is my order', delivery status, 'when was it delivered', and 'can I return X'. Pass productQuery when the customer names a product.",
    schema,
    responseFormat: "content_and_artifact",
  },
);
