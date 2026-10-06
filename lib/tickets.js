import "server-only";
import { query } from "@/lib/db";

// Creates a support ticket for the customer. If they already have an open ticket for the
// same order, that ticket is returned instead of creating a duplicate.
export async function createSupportTicket(userId, { issue, orderId, priority = "normal" }) {
  if (orderId) {
    const owned = await query("SELECT 1 FROM orders WHERE id = $1 AND user_id = $2", [orderId, userId]);
    if (owned.length === 0) orderId = null;
  }

  if (orderId) {
    const existing = await query(
      "SELECT id, issue, status, priority FROM support_tickets WHERE user_id = $1 AND order_id = $2 AND status <> 'resolved' ORDER BY id DESC LIMIT 1",
      [userId, orderId],
    );
    if (existing[0]) return { ...existing[0], orderId, existing: true };
  }

  const rows = await query(
    `INSERT INTO support_tickets (user_id, order_id, issue, priority)
     VALUES ($1, $2, $3, $4) RETURNING id, issue, status, priority`,
    [userId, orderId ?? null, issue.slice(0, 500), priority === "high" ? "high" : "normal"],
  );
  return { ...rows[0], orderId: orderId ?? null, existing: false };
}
