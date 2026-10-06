# ZeeCart — AI support demo (foundation)

Next.js (App Router, JavaScript) + PostgreSQL (`pg`) ecommerce demo. The AI agent (LangGraph, RAG, tools, voice) comes in a later step; the chat UI (agent name: **Zee**) currently posts to a stub at `/api/agent`.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` (or `.env`) and set `DATABASE_URL` and `SESSION_SECRET`.
3. `npm run seed` — creates tables and (re)seeds demo data (safe to re-run; it wipes and reloads).
4. `npm run dev` → http://localhost:3000

## Demo accounts
| Username | Password  | Notable data |
|----------|-----------|--------------|
| userA    | passwordA | delivered, **delayed Wireless Earphones**, shipped |
| userB    | passwordB | delivered, out for delivery, cancelled |
| user3    | passwordC | delayed Office Headphones, delivered, confirmed |

## Layout
- `app/` pages, components, `api/` (auth + `agent` stub)
- `lib/` `db.js` (pg pool), `auth.js` (signed-cookie session), `queries.js` (data helpers)
- `lib/support/agentClient.js` — what the chat UI calls; swap the backend behind `/api/agent` later
- `scripts/seed.js`, `knowledge/` (fictional ZeeCart policies for the RAG phase)
# ai-customer-support
