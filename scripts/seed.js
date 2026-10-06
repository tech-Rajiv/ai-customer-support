// Creates tables and (re)seeds demo data.
// Usage: npm run seed   (reads DATABASE_URL from .env.local)
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);
const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url   TEXT NOT NULL,
  category    VARCHAR(50) NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating      NUMERIC(2, 1) NOT NULL DEFAULT 4.0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            VARCHAR(30) NOT NULL
    CHECK (status IN ('pending','confirmed','processing','shipped',
                      'out_for_delivery','delayed','delivered','cancelled')),
  total_amount      NUMERIC(10, 2) NOT NULL,
  expected_delivery DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  price      NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id   INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  issue      TEXT NOT NULL,
  status     VARCHAR(30) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`;

const USERS = [
  { username: "userA", password: "passwordA", name: "Alex Carter", email: "alex.carter@example.com" },
  { username: "userB", password: "passwordB", name: "Bella Nguyen", email: "bella.nguyen@example.com" },
  { username: "user3", password: "passwordC", name: "Chris Patel", email: "chris.patel@example.com" },
];

const PRODUCTS = [
  { key: "earphones", name: "Wireless Earphones", category: "Audio", price: 59.99, stock: 120, rating: 4.4,
    description: "True wireless in-ear earphones with noise isolation, 24-hour battery life with the charging case, and IPX4 sweat resistance." },
  { key: "keyboard", name: "Mechanical Keyboard", category: "Computer Accessories", price: 89.0, stock: 60, rating: 4.7,
    description: "Compact 75% hot-swappable mechanical keyboard with tactile switches, PBT keycaps, and white backlighting." },
  { key: "mouse", name: "Wireless Mouse", category: "Computer Accessories", price: 24.5, stock: 200, rating: 4.3,
    description: "Ergonomic 2.4GHz wireless mouse with silent clicks, adjustable DPI, and a 12-month battery life." },
  { key: "watch", name: "Smart Watch", category: "Wearables", price: 129.0, stock: 45, rating: 4.2,
    description: "Fitness-focused smart watch with heart-rate and sleep tracking, GPS, and a 7-day battery." },
  { key: "hub", name: "USB-C Hub", category: "Computer Accessories", price: 39.99, stock: 150, rating: 4.5,
    description: "7-in-1 USB-C hub with 4K HDMI, 100W power delivery, SD card reader, and three USB-A ports." },
  { key: "stand", name: "Laptop Stand", category: "Office", price: 34.0, stock: 90, rating: 4.6,
    description: "Foldable aluminum laptop stand with six height levels, fits laptops from 10 to 17 inches." },
  { key: "speaker", name: "Bluetooth Speaker", category: "Audio", price: 49.99, stock: 80, rating: 4.5,
    description: "Portable waterproof Bluetooth speaker with 360° sound and 15 hours of playtime." },
  { key: "headphones", name: "Office Headphones", category: "Audio", price: 79.0, stock: 70, rating: 4.4,
    description: "Over-ear headphones with a detachable boom microphone, active noise cancellation, and all-day comfort." },
  { key: "webcam", name: "1080p Webcam", category: "Office", price: 44.99, stock: 110, rating: 4.1,
    description: "Full HD webcam with autofocus, dual noise-reducing microphones, and a privacy shutter." },
  { key: "powerbank", name: "Power Bank 20000mAh", category: "Mobile Accessories", price: 32.99, stock: 140, rating: 4.6,
    description: "20,000mAh power bank with 22.5W fast charging and two USB-A plus one USB-C port." },
];

// status, createdDaysAgo, expectedDeliveryDaysFromNow, items: [productKey, qty]
const ORDERS = {
  userA: [
    { status: "delivered", created: -30, expected: -23, items: [["keyboard", 1], ["mouse", 1]] },
    // Intentionally delayed: expected delivery already passed. Used for the future
    // "check my order of the earphone" agent scenario.
    { status: "delayed", created: -12, expected: -5, items: [["earphones", 1]] },
    { status: "shipped", created: -3, expected: 3, items: [["stand", 1], ["hub", 1]] },
  ],
  userB: [
    { status: "delivered", created: -20, expected: -13, items: [["speaker", 1]] },
    { status: "out_for_delivery", created: -5, expected: 0, items: [["webcam", 1]] },
    { status: "cancelled", created: -8, expected: -1, items: [["powerbank", 2]] },
  ],
  user3: [
    { status: "delayed", created: -14, expected: -6, items: [["headphones", 1]] },
    { status: "delivered", created: -25, expected: -18, items: [["hub", 1]] },
    { status: "confirmed", created: -1, expected: 6, items: [["watch", 1], ["mouse", 1]] },
  ],
};

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(SCHEMA);
    // Re-runnable: wipe existing demo data first.
    await client.query(
      "TRUNCATE support_tickets, order_items, orders, products, users RESTART IDENTITY CASCADE",
    );

    const userIds = {};
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      const { rows } = await client.query(
        "INSERT INTO users (username, password_hash, name, email) VALUES ($1,$2,$3,$4) RETURNING id",
        [u.username, hash, u.name, u.email],
      );
      userIds[u.username] = rows[0].id;
    }

    const products = {};
    for (const p of PRODUCTS) {
      const { rows } = await client.query(
        `INSERT INTO products (name, description, price, image_url, category, stock, rating)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [p.name, p.description, p.price, img(p.key), p.category, p.stock, p.rating],
      );
      products[p.key] = { id: rows[0].id, price: p.price };
    }

    let orderCount = 0;
    for (const [username, orders] of Object.entries(ORDERS)) {
      for (const o of orders) {
        const total = o.items.reduce((sum, [key, qty]) => sum + products[key].price * qty, 0);
        const createdAt = daysFromNow(o.created);
        // Delivered/cancelled orders were last updated near their end date.
        const updatedAt =
          o.status === "delivered" ? daysFromNow(o.expected)
          : o.status === "cancelled" ? daysFromNow(o.created + 1)
          : daysFromNow(Math.min(0, o.created + 2));
        const { rows } = await client.query(
          `INSERT INTO orders (user_id, status, total_amount, expected_delivery, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [userIds[username], o.status, total.toFixed(2), daysFromNow(o.expected), createdAt, updatedAt],
        );
        for (const [key, qty] of o.items) {
          await client.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
            [rows[0].id, products[key].id, qty, products[key].price],
          );
        }
        orderCount++;
      }
    }

    await client.query("COMMIT");
    console.log(
      `Seeded ${USERS.length} users, ${PRODUCTS.length} products, ${orderCount} orders.`,
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
