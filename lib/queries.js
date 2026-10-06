import "server-only";
import { query } from "@/lib/db";

// Basic data helpers. A future agent's tools (getMyOrders, findOrderByProduct, ...)
// can build on these.

export async function getCategories() {
  const rows = await query("SELECT DISTINCT category FROM products ORDER BY category");
  return rows.map((r) => r.category);
}

export async function getCategoryCounts({ search } = {}) {
  const { where, params } = buildFilters({ search });
  return query(
    `SELECT category, COUNT(*)::int AS count FROM products p ${where} GROUP BY category ORDER BY category`,
    params,
  );
}

// Rating comes from reviews: average (0 when there are none) and review count.
const PRODUCT_COLUMNS = `p.id, p.name, p.description, p.price::float AS price, p.image_url,
  p.category, p.stock,
  COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id), 0)::float AS rating,
  (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id)::int AS review_count`;

const escapeLike = (t) => t.replace(/[\\%_]/g, "\\$&");

// Every word of the search must appear in the name, description or category.
function buildFilters({ search, category }) {
  const conds = [];
  const params = [];
  for (const term of (search || "").split(/\s+/).filter(Boolean).slice(0, 6)) {
    params.push(`%${escapeLike(term)}%`);
    const i = params.length;
    conds.push(`(p.name ILIKE $${i} OR p.description ILIKE $${i} OR p.category ILIKE $${i})`);
  }
  if (category) {
    params.push(category);
    conds.push(`p.category = $${params.length}`);
  }
  return { where: conds.length ? "WHERE " + conds.join(" AND ") : "", params };
}

const SORTS = {
  price_asc: "p.price ASC, p.id",
  price_desc: "p.price DESC, p.id",
  rating: "rating DESC, review_count DESC, p.id",
};

export async function getProducts({ search, category, sort } = {}) {
  const { where, params } = buildFilters({ search, category });
  return query(
    `SELECT ${PRODUCT_COLUMNS} FROM products p ${where} ORDER BY ${SORTS[sort] ?? "p.id"}`,
    params,
  );
}

export async function getProduct(id) {
  const rows = await query(`SELECT ${PRODUCT_COLUMNS} FROM products p WHERE p.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getReviews(productId) {
  return query(
    `SELECT id, user_id, reviewer_name, rating, comment, created_at
     FROM reviews WHERE product_id = $1 ORDER BY created_at DESC`,
    [productId],
  );
}

// Customers may review a product once they have a (non-cancelled) order containing it.
export async function hasPurchasedProduct(userId, productId) {
  const rows = await query(
    `SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status <> 'cancelled' LIMIT 1`,
    [userId, productId],
  );
  return rows.length > 0;
}

export async function upsertReview({ productId, userId, reviewerName, rating, comment }) {
  const rows = await query(
    `INSERT INTO reviews (product_id, user_id, reviewer_name, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, user_id) WHERE user_id IS NOT NULL
     DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()
     RETURNING id`,
    [productId, userId, reviewerName, rating, comment],
  );
  return rows[0];
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
