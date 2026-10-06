import "server-only";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrdersForUser } from "@/lib/queries";
import { getCancellationInfo } from "@/lib/cancellation";
import { matchesProduct } from "@/lib/orderMatch";
import { needsConfirmation } from "@/lib/agent/humanInTheLoop";
import { cancelOrder } from "@/lib/orders";

const ACTION = "cancel_order";
const day = (d) => (d ? new Date(d).toLocaleDateString("en-CA") : null);

const schema = z.object({
  orderId: z.number().int().optional().describe("The order number, if the customer or an earlier lookup gave one."),
  productQuery: z
    .string()
    .optional()
    .describe("Words from the product in the order the customer wants to cancel, e.g. 'earphone'. Use when no order number is known."),
});

const brief = (o) => ({ order_id: o.id, status: o.status, items: o.items.map((i) => i.name) });

// Checks the cancellation policy in code. If the action is in HITL_ACTIONS it returns a
// proposal (nothing changes until the customer confirms in the chat); otherwise it cancels.
export const cancelOrderTool = tool(
  async ({ orderId, productQuery }, config) => {
    const userId = config?.configurable?.userId;
    if (!userId) {
      return [JSON.stringify({ error: "not_logged_in", note: "The customer must sign in before an order can be cancelled." }), []];
    }

    const orders = await getOrdersForUser(userId);
    const q = productQuery?.trim();
    let matches = orderId ? orders.filter((o) => o.id === orderId) : q ? orders.filter((o) => matchesProduct(o, q)) : [];

    if (matches.length === 0) {
      return [
        JSON.stringify({ error: "no_matching_order", note: "No order matched. Ask the customer which order they mean.", recent_orders: orders.slice(0, 5).map(brief) }),
        [],
      ];
    }

    // Several matches: prefer the ones that can actually be cancelled.
    if (matches.length > 1) {
      const cancellable = matches.filter((o) => getCancellationInfo(o).state === "allowed");
      if (cancellable.length > 1) {
        return [JSON.stringify({ error: "multiple_orders", note: "More than one order could be cancelled. Ask which one.", orders: cancellable.map(brief) }), []];
      }
      matches = cancellable.length === 1 ? cancellable : [matches[0]];
    }

    const order = matches[0];
    const info = getCancellationInfo(order);

    if (info.state !== "allowed") {
      return [
        JSON.stringify({
          eligible: false,
          ...brief(order),
          state: info.state,
          reason: info.reason,
          can_cancel_after: info.cancellableAfter ? day(info.cancellableAfter) : undefined,
          business_days_past_expected_delivery: info.businessDaysLate,
        }),
        [],
      ];
    }

    const details = {
      action: ACTION,
      orderId: order.id,
      items: order.items.map((i) => i.name),
      total: order.total_amount,
      delayed: !!info.delayed,
      refund: info.refund,
    };

    if (needsConfirmation(ACTION)) {
      return [
        JSON.stringify({
          eligible: true,
          requires_customer_confirmation: true,
          ...brief(order),
          total_inr: order.total_amount,
          refund: info.refund,
          instruction:
            "Nothing has been cancelled yet. Tell the customer you can cancel this order and ask them to confirm with the buttons shown below your message.",
        }),
        [{ ...details, status: "proposal" }],
      ];
    }

    try {
      await cancelOrder(userId, order.id);
    } catch (err) {
      return [JSON.stringify({ error: err.message }), []];
    }
    return [
      JSON.stringify({
        done: true,
        ...brief(order),
        refund: info.refund,
        instruction: "The order has been cancelled. Confirm this to the customer and explain the refund timeline.",
      }),
      [{ ...details, status: "done" }],
    ];
  },
  {
    name: ACTION,
    description:
      "Cancel one of the logged-in customer's orders. Checks the cancellation policy first. Depending on configuration it either asks the customer to confirm with buttons in the chat or cancels directly; the result tells you which. Use when the customer wants to cancel an order. Pass orderId, or productQuery if they named a product.",
    schema,
    responseFormat: "content_and_artifact",
  },
);
