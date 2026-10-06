import "server-only";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchKnowledge } from "@/lib/rag/retrieve";

const schema = z.object({
  question: z
    .string()
    .describe(
      "The customer's question rewritten as a short, self-contained search query, e.g. 'return window for opened earphones' or 'what happens if my order is delayed'.",
    ),
});

// Cosine similarity measured on this corpus: on-topic questions score >= 0.71,
// off-topic ones (pizza, weather) stay <= 0.60.
const MIN_RELEVANCE = 0.65;

// Returns [text for the LLM, sources for the UI].
export const searchKnowledgeTool = tool(
  async ({ question }) => {
    const found = await searchKnowledge(question, 4);
    const chunks = found.filter((c) => c.similarity >= MIN_RELEVANCE);

    if (chunks.length === 0) {
      return [
        JSON.stringify({
          question,
          passages: [],
          note: "No relevant information found in the ZeeCart knowledge base.",
        }),
        [],
      ];
    }

    // Cite only the documents behind the strongest matches.
    const best = chunks[0].similarity;
    const sources = [];
    for (const c of chunks.filter((c) => c.similarity >= best - 0.04)) {
      if (!sources.some((s) => s.source === c.source)) {
        sources.push({ source: c.source, title: c.title, section: c.section });
      }
    }
    const text = JSON.stringify({
      question,
      passages: chunks.map((c) => ({
        document: c.title,
        section: c.section,
        relevance: c.similarity,
        text: c.content,
      })),
    });
    return [text, sources.slice(0, 2)];
  },
  {
    name: "search_knowledge_base",
    description:
      "Look up ZeeCart company information and policies: shipping and delivery times, delayed orders, returns, refunds, cancellations, warranty, support hours and escalation, and general facts about the company (founder, headquarters, warehouses, support team). Use it for any question about how ZeeCart works. Returns the most relevant passages.",
    schema,
    responseFormat: "content_and_artifact",
  },
);
