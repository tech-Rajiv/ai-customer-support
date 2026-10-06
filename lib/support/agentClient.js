// Client-side helper the chat UI uses to talk to the support agent.
// Swap the implementation behind /api/agent later; the UI stays unchanged.
export async function askAgent(messages) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  });
  if (!res.ok) throw new Error("Agent request failed");
  const data = await res.json();
  return data.reply;
}
