import { NextResponse } from "next/server";

// Placeholder for the future LangGraph agent. The chat UI already posts here:
//   body:     { messages: [{ role: "user" | "assistant", content: string }] }
//   response: { reply: string }
// Later, read the user via getCurrentUser() and run the agent instead of this stub.
export async function POST(request) {
  const { messages } = await request.json().catch(() => ({}));
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  }
  await new Promise((r) => setTimeout(r, 900)); // simulate thinking
  return NextResponse.json({
    reply: "I'm currently in demo mode. AI support will be connected in the next step.",
  });
}
