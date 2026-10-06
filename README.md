# ZeeCart — AI support demo (foundation)

Next.js (App Router, JavaScript) + PostgreSQL (`pg`) ecommerce demo with **Zee**, a LangGraph + Groq support agent. Zee's tools: `search_products` (catalog, price filters), `search_knowledge_base` (RAG over `knowledge/` using pgvector + Gemini embeddings), `get_my_orders` (status, delivery, return window, cancellability), `cancel_order` and `return_order` (policy check in code, then Yes/No confirmation in the chat; the click calls the real API. Which actions need confirmation is the `HITL_ACTIONS` array in `lib/agent/humanInTheLoop.js`) and `create_support_ticket`. Voice comes next.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` (or `.env`) and set `DATABASE_URL`, `SESSION_SECRET`, `GROQ_API_KEY` and `GEMINI_API_KEY`.
3. `npm run seed` — creates tables and (re)seeds demo data (safe to re-run; it wipes and reloads).
4. `npm run ingest` — embeds `knowledge/*.txt` into Postgres (pgvector). Re-run after editing those files.
5. `npm run dev` → http://localhost:3000

## Demo accounts
| Username | Password  | Notable data |
|----------|-----------|--------------|
| userA    | passwordA | delivered, **delayed Wireless Earphones**, shipped |
| userB    | passwordB | delivered, out for delivery, cancelled |
| user3    | passwordC | delayed Office Headphones, delivered, confirmed |

## Layout
- `app/` pages, components, `api/` (auth + `agent` stub)
- `lib/` `db.js` (pg pool), `auth.js` (signed-cookie session), `queries.js` (data helpers)
- `lib/rag/` chunking, Gemini embeddings and pgvector retrieval; `lib/agent/` LangGraph agent: `graph.js` (agent ⇄ tools loop), `prompt.js`, `tools/searchProducts.js`, `tools/searchKnowledge.js`; served by `app/api/agent/route.js`
- `lib/support/agentClient.js` — what the chat UI calls; swap the backend behind `/api/agent` later
- `scripts/seed.js`, `knowledge/` (fictional ZeeCart policies for the RAG phase)
# ai-customer-support
