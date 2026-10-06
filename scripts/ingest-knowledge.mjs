// Embeds knowledge/*.txt into Postgres (pgvector) so the agent can retrieve policy text.
// Usage: npm run ingest   (needs DATABASE_URL and GEMINI_API_KEY in .env / .env.local)
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { chunkDocument } from "../lib/rag/chunk.mjs";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  embedDocuments,
  toVectorLiteral,
} from "../lib/rag/embeddings.mjs";

for (const name of ["DATABASE_URL", "GEMINI_API_KEY"]) {
  if (!process.env[name]) {
    console.error(`${name} is not set. Add it to .env or .env.local`);
    process.exit(1);
  }
}

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const files = (await fs.readdir(KNOWLEDGE_DIR)).filter((f) => f.endsWith(".txt")).sort();

  const rows = [];
  for (const file of files) {
    const text = await fs.readFile(path.join(KNOWLEDGE_DIR, file), "utf8");
    chunkDocument(text).forEach((c, i) => rows.push({ source: file.replace(/\.txt$/, ""), index: i, ...c }));
  }
  console.log(`Read ${files.length} files -> ${rows.length} chunks. Embedding with ${EMBEDDING_MODEL}...`);
  const vectors = await embedDocuments(rows.map((r) => r.content));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id          SERIAL PRIMARY KEY,
        source      VARCHAR(100) NOT NULL,
        title       TEXT NOT NULL,
        section     TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content     TEXT NOT NULL,
        embedding   vector(${EMBEDDING_DIMENSIONS}) NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
       ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)`,
    );
    // Re-runnable: replace everything with the current files.
    await client.query("TRUNCATE knowledge_chunks RESTART IDENTITY");
    for (const [i, r] of rows.entries()) {
      await client.query(
        `INSERT INTO knowledge_chunks (source, title, section, chunk_index, content, embedding)
         VALUES ($1,$2,$3,$4,$5,$6::vector)`,
        [r.source, r.title, r.section, r.index, r.content, toVectorLiteral(vectors[i])],
      );
    }
    await client.query("COMMIT");
    console.log(`Stored ${rows.length} chunks in knowledge_chunks.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
