import "server-only";
import { query } from "@/lib/db";

// Basic data helpers. A future agent's tools (getMyOrders, findOrderByProduct, ...)
// can build on these.

export async function getCategories() {
  const rows = await query("SELECT DISTINCT category FROM products ORDER BY category");
  return rows.map((r) => r.category);
}

export async function getProducts({ search, category } = {}) {
  const where = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  return query(
    `SELECT id, name, description, price::float AS price, image_url, category, stock, rating::float AS rating
     FROM products ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY id`,
    params,
  );
}

// Orders for one user, each with a `items` array of purchased products.
export async function getOrdersForUser(userId) {
  return query(
    `SELECT o.id, o.status, o.total_amount::float AS total_amount, o.expected_delivery,
            o.created_at, o.updated_at,
            COALESCE(json_agg(json_build_object(
              'product_id', p.id, 'name', p.name, 'image_url', p.image_url,
              'quantity', oi.quantity, 'price', oi.price::float
            ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId],
  );
}

// Scoped to the user so one customer can never read another's order.
export async function getOrderForUser(userId, orderId) {
  const orders = await getOrdersForUser(userId);
  return orders.find((o) => o.id === orderId) ?? null;
}

export async function getTicketsForUser(userId) {
  return query(
    `SELECT id, order_id, issue, status, created_at FROM support_tickets
     WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
}
