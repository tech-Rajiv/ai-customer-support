import "server-only";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createSupportTicket } from "@/lib/tickets";

const schema = z.object({
  issue: z
    .string()
    .min(5)
    .describe("A concise summary of the customer's problem for the support team, in one or two sentences, including relevant order details."),
  orderId: z.number().int().optional().describe("The related order number, if there is one."),
  priority: z
    .enum(["normal", "high"])
    .optional()
    .describe("'high' for orders more than 7 business days late, damaged or dangerous products, 'delivered' but not received, and payment or refund disputes. Otherwise 'normal'."),
});

// Returns [text for the LLM, ticket for the UI].
export const createSupportTicketTool = tool(
  async ({ issue, orderId, priority }, config) => {
    const userId = config?.configurable?.userId;
    if (!userId) {
      return [JSON.stringify({ error: "not_logged_in", note: "The customer must sign in before a support ticket can be created." }), []];
    }

    const ticket = await createSupportTicket(userId, { issue, orderId, priority });
    const firstResponse = ticket.priority === "high" ? "within 4 hours" : "within 24 hours";
    return [
      JSON.stringify({
        ticket_id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        already_existed: ticket.existing,
        first_response: firstResponse,
        note: ticket.existing
          ? "The customer already had an open ticket for this order, so no duplicate was created."
          : "Ticket created. Tell the customer the ticket number and when to expect a reply.",
      }),
      [{ id: ticket.id, status: ticket.status, priority: ticket.priority, orderId: ticket.orderId, issue: ticket.issue }],
    ];
  },
  {
    name: "create_support_ticket",
    description:
      "Create a support ticket so a human agent follows up. Use when the customer asks for a human or wants to report a problem you can't solve, or when policy requires human support (very late orders, damaged or dangerous products, delivered but not received, payment or refund disputes). Don't use it for simple questions you can answer.",
    schema,
    responseFormat: "content_and_artifact",
  },
);
