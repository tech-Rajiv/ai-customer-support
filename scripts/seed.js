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

CREATE TABLE IF NOT EXISTS reviews (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(100) NOT NULL,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One review per customer per product (seeded sample reviews have no user_id).
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product
  ON reviews(product_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Older versions of this demo stored a rating column on products.
ALTER TABLE products DROP COLUMN IF EXISTS rating;
`;

const USERS = [
  { username: "userA", password: "passwordA", name: "Alex Carter", email: "alex.carter@example.com" },
  { username: "userB", password: "passwordB", name: "Bella Nguyen", email: "bella.nguyen@example.com" },
  { username: "user3", password: "passwordC", name: "Chris Patel", email: "chris.patel@example.com" },
];

const PRODUCTS = [
  { key: "earphones", name: "Wireless Earphones", category: "Audio", price: 1999, stock: 120,
    description: "True wireless in-ear earphones with noise isolation, 24-hour battery life with the charging case, and IPX4 sweat resistance." },
  { key: "keyboard", name: "Mechanical Keyboard", category: "Computer Accessories", price: 3499, stock: 60,
    description: "Compact 75% hot-swappable mechanical keyboard with tactile switches, PBT keycaps, and white backlighting." },
  { key: "mouse", name: "Wireless Mouse", category: "Computer Accessories", price: 799, stock: 200,
    description: "Ergonomic 2.4GHz wireless mouse with silent clicks, adjustable DPI, and a 12-month battery life." },
  { key: "watch", name: "Smart Watch", category: "Wearables", price: 4999, stock: 45,
    description: "Fitness-focused smart watch with heart-rate and sleep tracking, GPS, and a 7-day battery." },
  { key: "hub", name: "USB-C Hub", category: "Computer Accessories", price: 1499, stock: 150,
    description: "7-in-1 USB-C hub with 4K HDMI, 100W power delivery, SD card reader, and three USB-A ports." },
  { key: "stand", name: "Laptop Stand", category: "Office", price: 1299, stock: 90,
    description: "Foldable aluminum laptop stand with six height levels, fits laptops from 10 to 17 inches." },
  { key: "speaker", name: "Bluetooth Speaker", category: "Audio", price: 2499, stock: 80,
    description: "Portable waterproof Bluetooth speaker with 360° sound and 15 hours of playtime." },
  { key: "headphones", name: "Office Headphones", category: "Audio", price: 2999, stock: 70,
    description: "Over-ear headphones with a detachable boom microphone, active noise cancellation, and all-day comfort." },
  { key: "webcam", name: "1080p Webcam", category: "Office", price: 2199, stock: 110,
    description: "Full HD webcam with autofocus, dual noise-reducing microphones, and a privacy shutter." },
  { key: "powerbank", name: "Power Bank 20000mAh", category: "Mobile Accessories", price: 1799, stock: 140,
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

// Sample reviews: [rating, reviewer, comment, daysAgo]. Averages stay within 3.5-4.5
// and counts range from 0 to 5; the power bank intentionally has none yet.
const REVIEWS = {
  earphones: [
    [5, "Ankit S.", "Great sound for the price and the battery easily lasts a full day. Pairing was instant.", 41],
    [4, "Priya M.", "Comfortable fit and good bass. Case feels a little plasticky but works fine.", 33],
    [4, "Rohan K.", "Good for calls and the gym. Sweat resistance is real.", 22],
    [3, "Neha D.", "Sound is decent but the touch controls trigger by accident sometimes.", 15],
    [5, "Imran A.", "Best earphones I have owned under 2000 rupees. Highly recommended.", 6],
  ],
  keyboard: [
    [5, "Vikram R.", "Typing feel is excellent and the hot-swap sockets are a big plus.", 50],
    [4, "Sneha P.", "Solid build and lovely backlight. A bit loud for a shared office.", 30],
    [4, "Karan J.", "Great value for a hot-swappable board. Keycaps feel premium.", 19],
    [4, "Divya L.", "Works well with my laptop and desktop. Wish it had a wrist rest.", 8],
  ],
  mouse: [
    [4, "Arjun T.", "Silent clicks are great for late-night work. Battery lasts forever.", 37],
    [3, "Meera N.", "Does the job. A little small for larger hands.", 24],
    [4, "Sameer B.", "Smooth tracking and the receiver is tiny. Good for the price.", 11],
  ],
  watch: [
    [4, "Pooja G.", "Heart rate and sleep tracking are accurate enough for me. Battery lasts almost a week.", 45],
    [3, "Harsh V.", "Good fitness features but the companion app is a bit slow to sync.", 36],
    [5, "Ritu C.", "Looks great, screen is bright outdoors, and GPS locks quickly.", 27],
    [3, "Manish Y.", "Strap is comfortable but notifications are sometimes delayed.", 14],
    [4, "Aditi F.", "Very good for the price. Does everything I need from a fitness watch.", 5],
  ],
  hub: [
    [5, "Nitin H.", "Everything works at once with my laptop: HDMI 4K, SD card and USB. No heating issues.", 28],
    [4, "Shalini O.", "Solid hub. Gets slightly warm when charging and using HDMI together.", 9],
  ],
  stand: [
    [5, "Gaurav Z.", "Sturdy and folds flat into my bag. My neck pain has reduced a lot.", 40],
    [4, "Kavya E.", "Good aluminum build. Height adjustments are smooth.", 21],
    [4, "Deepak U.", "Great stand for the price, though rubber pads could grip better.", 12],
  ],
  speaker: [
    [4, "Rahul Q.", "Loud and clear for its size. Took it to the beach with no issues.", 35],
    [5, "Ishita W.", "Waterproofing really works. Sound is much better than I expected.", 26],
    [3, "Faisal X.", "Good speaker but bass is average at full volume.", 17],
    [4, "Tanvi I.", "Battery lasts a whole day of playing music. Happy with it.", 7],
  ],
  headphones: [
    [5, "Suresh K.", "Noise cancellation is great for open offices. The boom mic is clear on calls.", 48],
    [4, "Anita R.", "Very comfortable for long meetings. Ear cushions are soft.", 32],
    [5, "Yash M.", "Excellent for work calls. Battery lasts the entire week.", 20],
    [4, "Lakshmi S.", "Good value. Noise cancelling is not studio-grade but works well.", 10],
    [3, "Dev P.", "Sound is fine but headband gets tight after a few hours.", 3],
  ],
  webcam: [
    [4, "Sanjay D.", "Sharp picture in good light and the privacy shutter is handy.", 18],
  ],
  powerbank: [],
};

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(SCHEMA);
    // Re-runnable: wipe existing demo data first.
    await client.query(
      "TRUNCATE reviews, support_tickets, order_items, orders, products, users RESTART IDENTITY CASCADE",
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
        `INSERT INTO products (name, description, price, image_url, category, stock)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [p.name, p.description, p.price, img(p.key), p.category, p.stock],
      );
      products[p.key] = { id: rows[0].id, price: p.price };
    }

    let reviewCount = 0;
    for (const [key, list] of Object.entries(REVIEWS)) {
      for (const [rating, name, comment, daysAgo] of list) {
        await client.query(
          `INSERT INTO reviews (product_id, reviewer_name, rating, comment, created_at)
           VALUES ($1,$2,$3,$4,$5)`,
          [products[key].id, name, rating, comment, daysFromNow(-daysAgo)],
        );
        reviewCount++;
      }
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
      `Seeded ${USERS.length} users, ${PRODUCTS.length} products, ${orderCount} orders, ${reviewCount} reviews.`,
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
