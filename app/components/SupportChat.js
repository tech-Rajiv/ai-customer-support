"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { askAgent } from "@/lib/support/agentClient";
import ZeeAvatar from "@/app/components/ZeeAvatar";
import { formatPrice } from "@/lib/format";

// Cycles through short prompts with a typewriter effect, e.g. "Where is my order?".
function TypingTeaser({ phrases }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = phrases[index % phrases.length];
    let delay = deleting ? 25 : 55;
    if (!deleting && text === full) delay = 2000; // hold the finished phrase
    const t = setTimeout(() => {
      if (!deleting && text === full) setDeleting(true);
      else if (deleting && text === "") {
        setDeleting(false);
        setIndex((i) => i + 1);
      } else setText(deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1));
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, index, phrases]);

  return (
    <span aria-live="off">
      {text}
      <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-zee-navy" />
    </span>
  );
}

const SUGGESTIONS = [
  "Any wireless earphones under ₹3000?",
  "Show me keyboards",
  "Best rated smart watch?",
];

// Tappable product result: opens the product detail page.
function ProductChip({ product, onNavigate }) {
  return (
    <Link
      href={`/products/${product.id}`}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg border border-zee-border bg-white p-2 hover:border-zee-orange-dark hover:shadow"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image_url} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zee-navy">{product.name}</span>
        <span className="block text-sm font-bold text-zee-navy">{formatPrice(product.price)}</span>
        <span className="block text-xs text-gray-500">
          {product.review_count ? (
            <><span className="text-zee-star">★</span> {product.rating.toFixed(1)} ({product.review_count})</>
          ) : (
            "No reviews yet"
          )}
        </span>
      </span>
      <span className="text-lg text-gray-400" aria-hidden="true">›</span>
    </Link>
  );
}

export default function SupportChat({ userName }) {
  const [open, setOpen] = useState(false);
  // Only real conversation turns live in state; the greeting is derived from the
  // current user so it stays correct after login/logout.
  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const nextId = useRef(1);

  const firstName = userName ? userName.split(" ")[0] : null;
  const greeting = {
    id: 0,
    role: "assistant",
    content: `Hi${firstName ? ` ${firstName}` : ""}! 👋 I'm Zee, your ZeeCart assistant. How can I help you today?${
      firstName ? "" : " (Log in so I can look up your orders.)"
    }`,
  };
  const messages = [greeting, ...turns];
  const teaserPhrases = [
    firstName ? `Hi ${firstName}! I'm Zee 👋` : "Hi! I'm Zee 👋",
    "Where is my order? 📦",
    "Want to return or cancel something?",
    "Ask me anything, I'm here to help!",
  ];
  const [teaserHidden, setTeaserHidden] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading, open]);

  async function send(e, preset) {
    e?.preventDefault();
    const text = (preset ?? input).trim();
    if (!text || loading) return;

    const userMsg = { id: nextId.current++, role: "user", content: text };
    const history = [...turns, userMsg];
    setTurns(history);
    setInput("");
    setLoading(true);
    try {
      const { reply, products, sources } = await askAgent(history);
      setTurns((t) => [...t, { id: nextId.current++, role: "assistant", content: reply, products, sources }]);
    } catch (err) {
      const busy = err.message.startsWith("I'm getting");
      setTurns((t) => [
        ...t,
        { id: nextId.current++, role: "assistant", content: busy ? err.message : "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[32rem] sm:w-96 sm:rounded-lg sm:border sm:border-zee-border">
          <div className="flex items-center justify-between bg-zee-navy px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="relative">
                <ZeeAvatar size={40} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zee-navy bg-green-400" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">Zee</p>
                <p className="text-xs text-gray-300">ZeeCart AI Support · Online · demo mode</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded p-1 text-2xl leading-none hover:bg-white/20">×</button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-background p-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user" ? "rounded-br-sm bg-zee-yellow text-zee-navy" : "rounded-bl-sm border border-zee-border bg-white text-zee-navy"
                }`}>
                  {m.content}
                </div>
                {m.sources?.length > 0 && (
                  <p className="max-w-[85%] text-xs text-gray-500">
                    📄 Source: {m.sources.map((src) => src.title.replace(/^ZeeCart /, "")).join(", ")}
                  </p>
                )}
                {m.products?.length > 0 && (
                  <div className="w-full max-w-[92%] space-y-2">
                    {m.products.map((p) => (
                      <ProductChip
                        key={p.id}
                        product={p}
                        // Full-screen on phones: close the chat so the product page is visible.
                        onNavigate={() => window.matchMedia("(max-width: 639px)").matches && setOpen(false)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {turns.length === 0 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((q) => (
                  <button key={q} onClick={() => send(null, q)} className="rounded-full border border-zee-orange-dark bg-white px-3 py-1.5 text-xs text-zee-navy hover:bg-zee-orange/30">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex justify-start" aria-label="Zee is typing">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-zee-border bg-white px-4 py-3">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-zee-border bg-white p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full border border-gray-400 px-4 py-2 text-sm outline-none focus:border-zee-orange-dark focus:ring-2 focus:ring-zee-orange"
            />
            <button disabled={!input.trim() || loading} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-full bg-zee-yellow text-zee-navy hover:bg-zee-yellow-dark disabled:opacity-50">
              ➤
            </button>
          </form>
        </div>
      )}

      {!open && !teaserHidden && (
        <div className="fixed bottom-24 right-6 z-50 hidden sm:block">
          <div className="relative rounded-2xl rounded-br-sm border border-zee-border bg-white py-2.5 pl-4 pr-8 text-sm font-medium text-zee-navy shadow-xl">
            <button onClick={() => setTeaserHidden(true)} aria-label="Dismiss" className="absolute right-2 top-1.5 text-lg leading-none text-gray-400 hover:text-gray-700">×</button>
            <button onClick={() => setOpen(true)} className="block min-w-60 text-left">
              <TypingTeaser phrases={teaserPhrases} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Zee support chat" : "Chat with Zee"}
        className={`fixed bottom-6 right-6 z-50 items-center gap-3 rounded-full bg-zee-navy py-2 pl-2 pr-5 text-white shadow-2xl ring-2 ring-zee-orange transition hover:scale-105 ${open ? "hidden sm:flex" : "zee-float flex"}`}
      >
        <span className="relative">
          {!open && <span className="absolute inset-0 animate-ping rounded-full bg-zee-orange opacity-60" />}
          <span className="relative block"><ZeeAvatar size={48} /></span>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zee-navy bg-green-400" />
        </span>
        <span className="text-left leading-tight">
          <span className="block text-base font-bold">{open ? "Close" : "Ask Zee"}</span>
          {!open && <span className="block text-xs text-gray-300">AI support · online</span>}
        </span>
      </button>
    </>
  );
}
