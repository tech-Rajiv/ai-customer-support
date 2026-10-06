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
  p.category, p.stock, p.return_days,
  COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id), 0)::float AS rating,
  (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id)::int AS review_count`;

const escapeLike = (t) => t.replace(/[\\%_]/g, "\\$&");

// By default every word of the search must appear in the name, description or category.
// `matchAny` relaxes that to "at least one word". Trailing plural "s" is ignored so
// "earphones" matches "earphone" and vice versa. Price bounds are inclusive (INR).
function buildFilters({ search, category, minPrice, maxPrice, matchAny = false }) {
  const termConds = [];
  const conds = [];
  const params = [];
  for (const raw of (search || "").split(/\s+/).filter(Boolean).slice(0, 6)) {
    const term = raw.length > 3 && raw.toLowerCase().endsWith("s") ? raw.slice(0, -1) : raw;
    params.push(`%${escapeLike(term)}%`);
    const i = params.length;
    termConds.push(`(p.name ILIKE $${i} OR p.description ILIKE $${i} OR p.category ILIKE $${i})`);
  }
  if (termConds.length) conds.push(`(${termConds.join(matchAny ? " OR " : " AND ")})`);
  if (category) {
    params.push(category);
    conds.push(`p.category = $${params.length}`);
  }
  if (Number.isFinite(minPrice)) {
    params.push(minPrice);
    conds.push(`p.price >= $${params.length}`);
  }
  if (Number.isFinite(maxPrice)) {
    params.push(maxPrice);
    conds.push(`p.price <= $${params.length}`);
  }
  return { where: conds.length ? "WHERE " + conds.join(" AND ") : "", params };
}

const SORTS = {
  price_asc: "p.price ASC, p.id",
  price_desc: "p.price DESC, p.id",
  rating: "rating DESC, review_count DESC, p.id",
};

export async function getProducts({ sort, limit, ...filters } = {}) {
  const { where, params } = buildFilters(filters);
  let sql = `SELECT ${PRODUCT_COLUMNS} FROM products p ${where} ORDER BY ${SORTS[sort] ?? "p.id"}`;
  if (limit) {
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
  }
  return query(sql, params);
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

// Orders for one user, each with an `items` array of purchased products and, when a
// return was requested, its reason. Includes what the return rules need.
export async function getOrdersForUser(userId) {
  return query(
    `SELECT o.id, o.status, o.total_amount::float AS total_amount, o.expected_delivery,
            o.delivered_at, o.shipping_address, o.created_at, o.updated_at,
            r.reason AS return_reason, r.comment AS return_comment, r.created_at AS return_requested_at,
            COALESCE(json_agg(json_build_object(
              'product_id', p.id, 'name', p.name, 'image_url', p.image_url, 'category', p.category,
              'quantity', oi.quantity, 'price', oi.price::float,
              'return_days', p.return_days, 'defect_only_return', p.defect_only_return
            ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     LEFT JOIN returns r ON r.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id, r.id
     ORDER BY o.created_at DESC, o.id DESC`,
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
