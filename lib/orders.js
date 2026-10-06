import "server-only";
import { getPool } from "@/lib/db";
import { RETURN_REASONS, getReturnInfo } from "@/lib/returns";
import { getOrderForUser } from "@/lib/queries";

// Standard delivery is 5-7 business days; the demo promises 6 calendar days.
const DELIVERY_DAYS = 6;

export class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Demo checkout: no payment. items: [{ productId, quantity }]. Ships to the user's saved address.
export async function createOrder(userId, items) {
  const wanted = new Map();
  for (const item of items) {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity ?? 1);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new OrderError("Invalid items.");
    }
    wanted.set(productId, (wanted.get(productId) ?? 0) + quantity);
  }
  if (wanted.size === 0) throw new OrderError("Your order has no items.");

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows: products } = await client.query(
      "SELECT id, name, price::float AS price, stock FROM products WHERE id = ANY($1) ORDER BY id FOR UPDATE",
      [[...wanted.keys()]],
    );
    if (products.length !== wanted.size) throw new OrderError("A product in your order no longer exists.", 404);
    for (const p of products) {
      if (p.stock < wanted.get(p.id)) throw new OrderError(`${p.name} is out of stock.`, 409);
    }

    const { rows: users } = await client.query("SELECT address FROM users WHERE id = $1", [userId]);
    const total = products.reduce((sum, p) => sum + p.price * wanted.get(p.id), 0);
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, status, total_amount, expected_delivery, shipping_address)
       VALUES ($1, 'confirmed', $2, CURRENT_DATE + $3::int, $4) RETURNING id`,
      [userId, total.toFixed(2), DELIVERY_DAYS, users[0].address],
    );
    for (const p of products) {
      const qty = wanted.get(p.id);
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
        [rows[0].id, p.id, qty, p.price],
      );
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [qty, p.id]);
    }
    await client.query("COMMIT");
    return { orderId: rows[0].id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Customer requests a return for a delivered order inside its return window.
export async function createReturn(userId, orderId, reason, comment) {
  const reasonInfo = RETURN_REASONS.find((r) => r.value === reason);
  if (!reasonInfo) throw new OrderError("Please choose a reason for the return.");

  const order = await getOrderForUser(userId, orderId);
  if (!order) throw new OrderError("Order not found.", 404);

  const info = getReturnInfo(order);
  if (info.state === "requested") throw new OrderError("A return has already been requested for this order.", 409);
  if (info.state === "not_delivered") throw new OrderError("Only delivered orders can be returned.", 409);
  if (info.state === "expired") {
    throw new OrderError(`The ${info.returnDays}-day return window for this order has closed.`, 409);
  }
  if (info.defectOnly && !reasonInfo.defect) {
    throw new OrderError(
      "In-ear products can only be returned if they are defective, damaged or the wrong item.",
      422,
    );
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO returns (order_id, user_id, reason, comment) VALUES ($1,$2,$3,$4)",
      [orderId, userId, reason, comment],
    );
    await client.query("UPDATE orders SET status = 'return_requested', updated_at = now() WHERE id = $1", [orderId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
