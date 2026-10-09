// Client-side helper the chat UI uses to talk to the support agent (POST /api/agent).
// Returns { reply, products, sources, orders }: products are tappable cards for the product page,
// sources are the knowledge documents the answer came from, orders are the customer's
// matching orders (tappable, open the order page).
export async function askAgent(messages, { lang } = {}) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // The server only uses the latest few messages, so don't upload the whole chat.
      messages: messages.slice(-6).map(({ role, content }) => ({ role, content })),
      lang: lang === "hi" ? "hi" : "en",
    }),
  });
  if (res.status === 429) {
    throw new Error("I'm getting a lot of questions right now. Please try again in a few seconds.");
  }
  if (!res.ok) throw new Error("Agent request failed");
  const data = await res.json();
  return { reply: data.reply, products: data.products ?? [], sources: data.sources ?? [], orders: data.orders ?? [], actions: data.actions ?? [], tickets: data.tickets ?? [] };
}
