"use client";

import { useEffect, useRef, useState } from "react";
import { askAgent } from "@/lib/support/agentClient";

const GREETING = { id: 0, role: "assistant", content: "Hi! How can I help?" };

function BotIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 8V4.5M9.5 4.5h5" />
      <circle cx="9" cy="13.5" r="1" fill="currentColor" />
      <circle cx="15" cy="13.5" r="1" fill="currentColor" />
      <path d="M9.5 16.5h5" />
    </svg>
  );
}

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const nextId = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: nextId.current++, role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const reply = await askAgent(history);
      setMessages((m) => [...m, { id: nextId.current++, role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: nextId.current++, role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[32rem] sm:w-96 sm:rounded-2xl sm:border sm:border-slate-200">
          <div className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20"><BotIcon /></span>
              <div>
                <p className="text-sm font-semibold leading-tight">AI Support</p>
                <p className="text-xs text-indigo-100">NovaCart assistant · demo mode</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded p-1 text-2xl leading-none hover:bg-white/20">×</button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user" ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start" aria-label="Assistant is typing">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <button disabled={!input.trim() || loading} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI support" : "Open AI support"}
        className={`fixed bottom-5 right-5 z-50 h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:scale-105 hover:bg-indigo-700 ${open ? "hidden sm:flex" : "flex"}`}
      >
        {open ? <span className="text-2xl leading-none">×</span> : <BotIcon size={28} />}
      </button>
    </>
  );
}
