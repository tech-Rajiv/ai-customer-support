import "server-only";
import { query } from "@/lib/db";
import { embedQuery, toVectorLiteral } from "@/lib/rag/embeddings.mjs";

// Nearest knowledge chunks to the question by cosine similarity (1 = identical).
export async function searchKnowledge(text, limit = 4) {
  const vector = toVectorLiteral(await embedQuery(text));
  return query(
    `SELECT source, title, section, content,
            ROUND((1 - (embedding <=> $1::vector))::numeric, 3)::float AS similarity
     FROM knowledge_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vector, limit],
  );
}
