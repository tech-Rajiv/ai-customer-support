import "server-only";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrdersForUser } from "@/lib/queries";
import { RETURN_REASONS, reasonLabel, validateReturn } from "@/lib/returns";
import { matchesProduct } from "@/lib/orderMatch";
import { needsConfirmation } from "@/lib/agent/humanInTheLoop";
import { createReturn } from "@/lib/orders";

const ACTION = "return_order";
const day = (d) => (d ? new Date(d).toLocaleDateString("en-CA") : null);

const schema = z.object({
  orderId: z.number().int().optional().describe("The order number, if known."),
  productQuery: z.string().optional().describe("Words from the product to return, e.g. 'power bank'. Use when no order number is known."),
  reason: z
    .enum(RETURN_REASONS.map((r) => r.value))
    .describe(
      "Why the customer is returning it: defective (not working / faulty), damaged (arrived broken), wrong_item, not_as_described, changed_mind (no longer needed), better_price. Infer it from what the customer said.",
    ),
  comment: z.string().optional().describe("Optional short detail from the customer, e.g. 'battery does not charge'."),
});

const brief = (o) => ({ order_id: o.id, status: o.status, items: o.items.map((i) => i.name) });

// Same pattern as cancel_order: rules are checked in code, and if the action is in
// HITL_ACTIONS the customer must confirm in the chat before anything changes.
export const returnOrderTool = tool(
  async ({ orderId, productQuery, reason, comment }, config) => {
    const userId = config?.configurable?.userId;
    if (!userId) {
      return [JSON.stringify({ error: "not_logged_in", note: "The customer must sign in before a return can be started." }), []];
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

    // Several matches: prefer the ones that can actually be returned.
    if (matches.length > 1) {
      const returnable = matches.filter((o) => validateReturn(o, reason).ok);
      if (returnable.length > 1) {
        return [JSON.stringify({ error: "multiple_orders", note: "More than one order could be returned. Ask which one.", orders: returnable.map(brief) }), []];
      }
      matches = returnable.length === 1 ? returnable : [matches[0]];
    }

    const order = matches[0];
    const check = validateReturn(order, reason);
    if (!check.ok) {
      return [JSON.stringify({ eligible: false, ...brief(order), reason_not_possible: check.error }), []];
    }

    const details = {
      action: ACTION,
      orderId: order.id,
      items: order.items.map((i) => i.name),
      total: order.total_amount,
      reason,
      reasonLabel: reasonLabel(reason),
      comment: comment ?? "",
      defectOnly: !!check.info.defectOnly,
      lastDay: day(check.info.deadline),
    };

    if (needsConfirmation(ACTION)) {
      return [
        JSON.stringify({
          eligible: true,
          requires_customer_confirmation: true,
          ...brief(order),
          reason: reasonLabel(reason),
          last_day_to_return: details.lastDay,
          instruction:
            "Nothing has been requested yet. Tell the customer the return is possible, mention the reason you understood, and ask them to confirm with the buttons shown below your message.",
        }),
        [{ ...details, status: "proposal" }],
      ];
    }

    try {
      await createReturn(userId, order.id, reason, comment ?? "");
    } catch (err) {
      return [JSON.stringify({ error: err.message }), []];
    }
    return [
      JSON.stringify({
        done: true,
        ...brief(order),
        instruction: "The return has been requested. Tell the customer support will confirm within 1 business day with return instructions.",
      }),
      [{ ...details, status: "done" }],
    ];
  },
  {
    name: ACTION,
    description:
      "Start a return for one of the logged-in customer's delivered orders. Checks the return window and rules first. Depending on configuration it either asks the customer to confirm with buttons in the chat or requests the return directly; the result tells you which. Use when the customer wants to return a product. Infer the reason from their message.",
    schema,
    responseFormat: "content_and_artifact",
  },
);
