import { Pool } from "pg";

// Reuse one pool across hot reloads in dev.
const globalForPg = globalThis;

function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local");
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Neon requires SSL
    max: 5,
  });
}

export function getPool() {
  if (!globalForPg.__pgPool) globalForPg.__pgPool = createPool();
  return globalForPg.__pgPool;
}

export async function query(text, params) {
  const result = await getPool().query(text, params);
  return result.rows;
}
