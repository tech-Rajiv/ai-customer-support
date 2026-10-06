import { NextResponse } from "next/server";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { getAgent } from "@/lib/agent/graph";
import { getCurrentUser } from "@/lib/auth";

// POST { messages: [{ role: "user" | "assistant", content }] }
// -> { reply: string, products: [{ id, name, price, image_url, ... }], sources: [{ source, title, section }], orders: [{ id, status, items, total }],
//      actions: [{ action: "cancel_order" | "return_order", status: "proposal" | "done", orderId, ... }]
//        (proposals wait for the customer's click: see lib/agent/humanInTheLoop.js),
//      tickets: [{ id, status, priority, ... }] }
// `products` / `sources` are the artifacts produced by tool calls during this turn.
// Only the most recent messages are sent to the model: fewer tokens per call on the free tier.
const MAX_HISTORY = 6;

// Groq's free tier has a tokens-per-minute cap. When it says "try again in 6s" and the
// wait is short, wait and retry once instead of failing the customer's message.
async function invokeWithRateLimitRetry(history, userId) {
  // userId reaches the tools via config.configurable: they only ever see this customer's data.
  const run = () => getAgent().invoke({ messages: history }, { recursionLimit: 8, configurable: { userId } });
  try {
    return await run();
  } catch (err) {
    const wait = Number(/try again in ([\d.]+)s/i.exec(err?.message ?? "")?.[1]);
    if (err?.status === 429 && wait > 0 && wait <= 10) {
      await new Promise((r) => setTimeout(r, (wait + 0.5) * 1000));
      return run();
    }
    throw err;
  }
}

export async function POST(request) {
  const { messages } = await request.json().catch(() => ({}));
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages must be a non-empty array" }, { status: 400 });
  }
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured." }, { status: 500 });
  }

  const history = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => (m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)));
  if (history.length === 0 || !(history.at(-1) instanceof HumanMessage)) {
    return NextResponse.json({ error: "The last message must come from the user." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const result = await invokeWithRateLimitRetry(history, user?.id ?? null);

    // Cards from tool calls made after the customer's latest message.
    const turn = result.messages.slice(history.length);
    const seen = new Set();
    const products = turn
      .filter((m) => m.type === "tool" && m.name === "search_products" && Array.isArray(m.artifact))
      .flatMap((m) => m.artifact)
      .filter((p) => !seen.has(p.id) && seen.add(p.id))
      .slice(0, 5);

    const knowledge = new Set();
    const sources = turn
      .filter((m) => m.type === "tool" && m.name === "search_knowledge_base" && Array.isArray(m.artifact))
      .flatMap((m) => m.artifact)
      .filter((s) => !knowledge.has(s.source) && knowledge.add(s.source))
      .slice(0, 3);

    const orders = turn
      .filter((m) => m.type === "tool" && m.name === "get_my_orders" && Array.isArray(m.artifact))
      .flatMap((m) => m.artifact)
      .slice(0, 3);

    const artifacts = (toolName) =>
      turn.filter((m) => m.type === "tool" && m.name === toolName && Array.isArray(m.artifact)).flatMap((m) => m.artifact);
    const actions = [...artifacts("cancel_order"), ...artifacts("return_order")].slice(0, 1);
    const tickets = artifacts("create_support_ticket").slice(0, 1);

    const last = result.messages.at(-1);
    // The chat shows plain text, so drop markdown emphasis the model sometimes adds.
    const reply = (typeof last.content === "string" ? last.content : "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();
    return NextResponse.json({ reply: reply || "Sorry, I couldn't come up with an answer. Could you rephrase?", products, sources, orders, actions, tickets });
  } catch (err) {
    if (err?.status === 429) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    console.error("Agent error:", err);
    return NextResponse.json({ error: "The assistant is unavailable right now." }, { status: 500 });
  }
}
