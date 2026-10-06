// Gemini embeddings over plain HTTPS (works on Vercel, no native deps).
// Plain .mjs without path aliases so scripts/ingest-knowledge.mjs can import it too.
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768; // must match vector(768) in the knowledge_chunks table

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MAX_BATCH = 100;

async function batchEmbed(texts, taskType, attempt = 0) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(`${BASE}/models/${EMBEDDING_MODEL}:batchEmbedContents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      })),
    }),
  });

  // Free tier is rate limited: back off and retry a few times.
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return batchEmbed(texts, taskType, attempt + 1);
  }
  if (!res.ok) throw new Error(`Gemini embeddings failed (${res.status}): ${(await res.text()).slice(0, 300)}`);

  const data = await res.json();
  return data.embeddings.map((e) => e.values);
}

// For documents being stored.
export async function embedDocuments(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    out.push(...(await batchEmbed(texts.slice(i, i + MAX_BATCH), "RETRIEVAL_DOCUMENT")));
  }
  return out;
}

// For a customer's question.
export async function embedQuery(text) {
  return (await batchEmbed([text], "RETRIEVAL_QUERY"))[0];
}

// pgvector accepts the text form '[0.1,0.2,...]'.
export const toVectorLiteral = (values) => `[${values.join(",")}]`;
