"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { askAgent } from "@/lib/support/agentClient";
import ActionConfirmation from "@/app/components/ActionConfirmation";
import ZeeAvatar from "@/app/components/ZeeAvatar";
import { STATUS_LABELS, STATUS_STYLES, formatPrice } from "@/lib/format";

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
      } else
        setText(
          deleting
            ? full.slice(0, text.length - 1)
            : full.slice(0, text.length + 1),
        );
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
  "Where is my earphone order?",
];

// The browser speaks this. Strip markdown, emoji, and the rupee sign so the voice
// doesn't read symbols out loud.
function toSpoken(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/₹\s*/g, "rupees ")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const VOICE_KEY = "zee-voice";
const KEPT_VOICES = ["Google हिन्दी"];
const GREETINGS_EN = [
  "Hey, I'm Zee. How can I help you?",
  "Hey, I'm Zee. Need help with a product or an order?",
  "Hi, I'm Zee. What are you looking for?",
  "Hey, I'm Zee. Tell me what you need.",
];
const GREETINGS_HI = [
  "हाय, मैं Zee हूँ। मैं आपकी कैसे मदद कर सकती हूँ?",
  "हाय, मैं Zee हूँ। प्रोडक्ट चाहिए या ऑर्डर में मदद?",
  "हाय, मैं Zee हूँ। आप क्या ढूँढ रहे हैं?",
  "हाय, मैं Zee हूँ। बताइए, क्या चाहिए?",
];

function pickGreeting(inHindi) {
  const list = inHindi ? GREETINGS_HI : GREETINGS_EN;
  return list[Math.floor(Math.random() * list.length)];
}

const SUGGESTIONS_HI = [
  "₹3000 से कम के वायरलेस इयरफोन हैं?",
  "कीबोर्ड दिखाइए",
  "मेरा इयरफोन ऑर्डर कहाँ है?",
];

function voiceNameKey(name) {
  return name.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function isKeptVoice(name) {
  const key = voiceNameKey(name);
  return KEPT_VOICES.some((kept) => voiceNameKey(kept) === key);
}

function findKeptVoice(voices, name) {
  const key = voiceNameKey(name);
  return voices.find((voice) => voiceNameKey(voice.name) === key);
}

function defaultVoiceName(voices) {
  for (const name of KEPT_VOICES) {
    const voice = findKeptVoice(voices, name);
    if (voice) return voice.name;
  }
  return "";
}

function chosenVoice(voices, name) {
  return findKeptVoice(voices, name) || findKeptVoice(voices, defaultVoiceName(voices)) || null;
}

const FREQ_HEIGHTS = [8, 14, 20, 12, 18, 10, 22, 16, 11, 19, 13, 9];

function Frequency({ className }) {
  return (
    <span className="inline-flex h-6 items-center gap-[3px]" aria-hidden="true">
      {FREQ_HEIGHTS.map((height, bar) => (
        <span
          key={bar}
          className={`zee-freq-bar w-[3px] rounded-full ${className}`}
          style={{
            height: `${height}px`,
            animationDelay: `${bar * 0.07}s`,
            animationDuration: `${0.75 + (bar % 5) * 0.08}s`,
          }}
        />
      ))}
    </span>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21H8v2h8v-2h-3v-2.08A7 7 0 0 0 19 12h-2z"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
    </svg>
  );
}

// Tappable product result: opens the product detail page.
function ProductChip({ product, onNavigate }) {
  return (
    <Link
      href={`/products/${product.id}`}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg border border-zee-border bg-white p-2 hover:border-zee-orange-dark hover:shadow"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image_url}
        alt=""
        className="h-14 w-14 shrink-0 rounded object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zee-navy">
          {product.name}
        </span>
        <span className="block text-sm font-bold text-zee-navy">
          {formatPrice(product.price)}
        </span>
        <span className="block text-xs text-gray-500">
          {product.review_count ? (
            <>
              <span className="text-zee-star">★</span>{" "}
              {product.rating.toFixed(1)} ({product.review_count})
            </>
          ) : (
            "No reviews yet"
          )}
        </span>
      </span>
      <span className="text-lg text-gray-400" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

// Tappable order result: opens the order page (where returns are confirmed).
function OrderChip({ order, onNavigate }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg border border-zee-border bg-white p-2.5 hover:border-zee-orange-dark hover:shadow"
    >
      <span className="text-2xl" aria-hidden="true">
        📦
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zee-navy">
          Order #{order.id} · {order.items.join(", ")}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-gray-600">
          <span
            className={`rounded px-1.5 py-0.5 font-bold ${STATUS_STYLES[order.status] ?? "bg-gray-100"}`}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          {formatPrice(order.total)}
        </span>
      </span>
      <span className="text-lg text-gray-400" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

function TicketChip({ ticket, onNavigate }) {
  return (
    <Link
      href="/account"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg border border-zee-border bg-white p-2.5 hover:border-zee-orange-dark hover:shadow"
    >
      <span className="text-2xl" aria-hidden="true">
        🎫
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-zee-navy">
          Support ticket #{ticket.id}
        </span>
        <span className="block truncate text-xs text-gray-600">
          <span className="capitalize">{ticket.status}</span> ·{" "}
          {ticket.priority === "high" ? "High priority" : "Normal priority"}
          {ticket.orderId ? ` · Order #${ticket.orderId}` : ""}
        </span>
      </span>
      <span className="text-lg text-gray-400" aria-hidden="true">
        ›
      </span>
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
  const [canListen, setCanListen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceNote, setVoiceNote] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const [hindi, setHindi] = useState(false);
  const bottomRef = useRef(null);
  const nextId = useRef(1);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const ignoreEndRef = useRef(false);
  const liveRef = useRef("");
  const heardRef = useRef("");
  const voicesRef = useRef([]);
  const voiceNameRef = useRef("");
  const speakTimerRef = useRef(null);
  const openRef = useRef(false);
  const hindiRef = useRef(false);
  const greetedRef = useRef(false);
  const sendVoiceRef = useRef(() => {});
  const [greetingText, setGreetingText] = useState(GREETINGS_EN[0]);
  const greeting = {
    id: 0,
    role: "assistant",
    content: greetingText,
  };
  const messages = [greeting, ...turns];
  const firstName = userName ? userName.split(" ")[0] : null;
  const teaserPhrases = [
    firstName ? `Hi ${firstName}! I'm Zee 👋` : "Hi! I'm Zee 👋",
    "Where is my order? 📦",
    "Want to return or cancel something?",
    "Ask me anything, I'm here to help!",
  ];
  const [teaserHidden, setTeaserHidden] = useState(false);
  openRef.current = open;
  hindiRef.current = hindi;
  voiceNameRef.current = voiceName;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading, open]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const loadVoices = () => {
      const all = synth.getVoices();
      voicesRef.current = all;
      setVoiceName((current) => {
        const usable = (name) => isKeptVoice(name) && all.some((voice) => voice.name === name);
        if (usable(current)) return current;
        let saved = "";
        try {
          saved = localStorage.getItem(VOICE_KEY) || "";
        } catch {
          saved = "";
        }
        if (usable(saved)) return saved;
        return defaultVoiceName(all);
      });
    };
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setCanListen(true);

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += piece;
        else interim += piece;
      }
      if (finalChunk)
        heardRef.current = `${heardRef.current} ${finalChunk}`.trim();
      liveRef.current = `${heardRef.current} ${interim}`.trim();
      setInput(liveRef.current);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setVoiceNote("Allow microphone access to talk to Zee.");
      } else {
        setVoiceNote("Voice input didn't work. You can still type.");
      }
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setListening(false);
      const text = liveRef.current.trim();
      liveRef.current = "";
      heardRef.current = "";
      if (ignoreEndRef.current) {
        ignoreEndRef.current = false;
        return;
      }
      if (text) sendVoiceRef.current(text);
    };

    return () => {
      ignoreEndRef.current = true;
      listeningRef.current = false;
      try {
        recognition.abort();
      } catch {
        // Already stopped.
      }
      window.clearTimeout(speakTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  function stopSpeaking() {
    window.clearTimeout(speakTimerRef.current);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function stopVoice() {
    if (listeningRef.current) {
      ignoreEndRef.current = true;
      listeningRef.current = false;
      setListening(false);
      try {
        recognitionRef.current?.abort();
      } catch {
        // Already stopped.
      }
    }
    stopSpeaking();
  }

  function speakText(text, lang) {
    const synth = window.speechSynthesis;
    const spoken = toSpoken(text);
    if (!synth || !spoken) return;
    window.clearTimeout(speakTimerRef.current);
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(spoken);
    const voice = chosenVoice(
      voicesRef.current.length ? voicesRef.current : synth.getVoices(),
      voiceNameRef.current,
    );
    if (voice) {
      utterance.voice = voice;
      utterance.lang = lang || voice.lang;
    } else {
      utterance.lang = lang || "en-IN";
    }
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    // Chrome drops an utterance that starts in the same turn as cancel().
    speakTimerRef.current = window.setTimeout(() => {
      if (openRef.current) synth.speak(utterance);
    }, 60);
  }

  function greet(inHindi) {
    const line = pickGreeting(inHindi);
    setGreetingText(line);
    speakText(line, inHindi ? "hi-IN" : "en-IN");
  }

  function toggleChat() {
    if (open) {
      openRef.current = false;
      stopVoice();
      setOpen(false);
      return;
    }
    openRef.current = true;
    setOpen(true);
    if (!greetedRef.current) {
      greetedRef.current = true;
      greet(hindiRef.current);
    }
  }

  function toggleHindi() {
    const next = !hindiRef.current;
    hindiRef.current = next;
    setHindi(next);
    if (openRef.current) greet(next);
  }

  function toggleMic() {
    const recognition = recognitionRef.current;
    if (!recognition || loading) return;
    if (listeningRef.current) {
      recognition.stop();
      return;
    }
    stopVoice();
    setVoiceNote("");
    heardRef.current = "";
    liveRef.current = "";
    setInput("");
    recognition.lang = hindiRef.current ? "hi-IN" : "en-IN";
    // A tap unlocks speech synthesis so the reply can be spoken after the agent responds.
    // The primer is delayed because Chrome drops speech queued in the same turn as cancel().
    const synth = window.speechSynthesis;
    if (synth) {
      synth.resume();
      window.setTimeout(() => {
        const primer = new SpeechSynthesisUtterance(" ");
        primer.volume = 0;
        synth.speak(primer);
      }, 60);
    }
    try {
      recognition.start();
      listeningRef.current = true;
      setListening(true);
    } catch {
      listeningRef.current = false;
      setListening(false);
      setVoiceNote("Voice input didn't work. You can still type.");
    }
  }

  async function send(e, preset, speakReply = false) {
    e?.preventDefault();
    const fromMic = listeningRef.current;
    const text = (
      preset ?? (fromMic ? liveRef.current || input : input)
    ).trim();
    let voiceTurn = speakReply || fromMic;
    if (fromMic) {
      ignoreEndRef.current = true;
      listeningRef.current = false;
      setListening(false);
      liveRef.current = "";
      heardRef.current = "";
      try {
        recognitionRef.current?.abort();
      } catch {
        // Already stopped.
      }
    }
    if (!text || loading) return;

    window.clearTimeout(speakTimerRef.current);
    window.speechSynthesis?.cancel();
    setSpeaking(false);

    const userMsg = { id: nextId.current++, role: "user", content: text };
    const history = [...turns, userMsg];
    setTurns(history);
    setInput("");
    setLoading(true);
    try {
      const { reply, products, sources, orders, actions, tickets } =
        await askAgent(history, { lang: hindiRef.current ? "hi" : "en" });
      setTurns((t) => [
        ...t,
        {
          id: nextId.current++,
          role: "assistant",
          content: reply,
          products,
          sources,
          orders,
          actions,
          tickets,
        },
      ]);
      if (voiceTurn && openRef.current) speakText(reply);
    } catch (err) {
      const busy = err.message.startsWith("I'm getting");
      const content = busy
        ? err.message
        : "Sorry, something went wrong. Please try again.";
      setTurns((t) => [
        ...t,
        { id: nextId.current++, role: "assistant", content },
      ]);
      if (voiceTurn && openRef.current) speakText(content);
    } finally {
      setLoading(false);
    }
  }

  sendVoiceRef.current = (text) => {
    void send(null, text, true);
  };

  return (
    <>
      {/* Always mounted, just hidden when closed: unmounting would reset each card's state
          (e.g. a confirmed cancellation would show Yes/No again on reopening). */}
      <div
        className={`fixed bottom-24 left-3 right-3 z-50 h-[60vh] ${open ? "flex" : "hidden"} flex-col overflow-hidden rounded-2xl border border-zee-border bg-white shadow-2xl sm:left-auto sm:right-6 sm:h-[32rem] sm:w-96`}
      >
        <div className="bg-zee-navy text-white">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="relative">
                <ZeeAvatar size={40} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zee-navy bg-green-400" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">Zee</p>
                <p className="truncate text-xs text-gray-300" aria-live="polite">
                  {listening ? "Listening" : speaking ? "Speaking" : "Agentic AI Zee"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                role="switch"
                aria-checked={hindi}
                aria-label="हिन्दी"
                onClick={toggleHindi}
                className="flex items-center gap-1.5 rounded-full border border-white/20 px-2 py-1 hover:bg-white/10"
              >
                <span className="text-xs font-semibold">हिन्दी</span>
                <span className={`relative h-5 w-9 rounded-full ${hindi ? "bg-zee-yellow" : "bg-white/25"}`}>
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${hindi ? "left-4" : "left-0.5"}`}
                  />
                </span>
              </button>
              <button
                onClick={toggleChat}
                aria-label="Close chat"
                className="rounded p-1 text-2xl leading-none hover:bg-white/20"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-background p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user"
                    ? "rounded-br-sm bg-zee-yellow text-zee-navy"
                    : "rounded-bl-sm border border-zee-border bg-white text-zee-navy"
                }`}
              >
                {m.content}
              </div>
              {m.sources?.length > 0 && (
                <p className="max-w-[85%] text-xs text-gray-500">
                  📄 Source:{" "}
                  {m.sources
                    .map((src) => src.title.replace(/^ZeeCart /, ""))
                    .join(", ")}
                </p>
              )}
              {m.actions?.length > 0 && (
                <div className="w-full max-w-[92%]">
                  {m.actions.map((a) => (
                    <ActionConfirmation
                      key={`${a.action}-${a.orderId}`}
                      proposal={a}
                    />
                  ))}
                </div>
              )}
              {m.tickets?.length > 0 && (
                <div className="w-full max-w-[92%]">
                  {m.tickets.map((t) => (
                    <TicketChip
                      key={t.id}
                      ticket={t}
                      onNavigate={() =>
                        window.matchMedia("(max-width: 639px)").matches &&
                        setOpen(false)
                      }
                    />
                  ))}
                </div>
              )}
              {m.orders?.length > 0 && (
                <div className="w-full max-w-[92%] space-y-2">
                  {m.orders.map((o) => (
                    <OrderChip
                      key={o.id}
                      order={o}
                      onNavigate={() =>
                        window.matchMedia("(max-width: 639px)").matches &&
                        setOpen(false)
                      }
                    />
                  ))}
                </div>
              )}
              {m.products?.length > 0 && (
                <div className="w-full max-w-[92%] space-y-2">
                  {m.products.map((p) => (
                    <ProductChip
                      key={p.id}
                      product={p}
                      // Full-screen on phones: close the chat so the product page is visible.
                      onNavigate={() =>
                        window.matchMedia("(max-width: 639px)").matches &&
                        setOpen(false)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {turns.length === 0 && !loading && (
            <div className="flex flex-wrap gap-2 pt-1">
              {(hindi ? SUGGESTIONS_HI : SUGGESTIONS).map((q) => (
                <button
                  key={q}
                  onClick={() => send(null, q)}
                  className="rounded-full border border-zee-orange-dark bg-white px-3 py-1.5 text-xs text-zee-navy hover:bg-zee-orange/30"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          {loading && (
            <div className="flex justify-start" aria-label="Zee is typing">
              <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-zee-border bg-white px-4 py-3">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-zee-border bg-white">
          {voiceNote && (
            <p className="px-3 pt-2 text-xs text-red-700" role="status">
              {voiceNote}
            </p>
          )}
          {(listening || speaking) && (
            <div
              className={`mx-3 mt-3 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
                listening ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-900"
              }`}
              role="status"
            >
              <Frequency className={listening ? "bg-red-500" : "bg-amber-600"} />
              <span className="min-w-0 flex-1">{listening ? "Listening to you" : "Zee is speaking"}</span>
              {speaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  aria-label="Stop Zee speaking"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-700 text-white"
                >
                  <StopIcon />
                </button>
              )}
            </div>
          )}
          <form onSubmit={send} className="flex items-center gap-2 p-3">
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (voiceNote) setVoiceNote("");
              }}
              readOnly={listening}
              placeholder={
                listening
                  ? "Listening…"
                  : canListen
                    ? "Type, or tap the mic…"
                    : "Type your message..."
              }
              className={`flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:ring-2 ${
                listening
                  ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-400 focus:border-zee-orange-dark focus:ring-zee-orange"
              }`}
            />
            {canListen && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={loading}
                aria-pressed={listening}
                aria-label={listening ? "Stop and send" : "Talk to Zee"}
                title={listening ? "Stop and send" : "Talk to Zee"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50 ${
                  listening ? "bg-red-500 text-white" : "bg-zee-navy text-white hover:bg-zee-navy/80"
                }`}
              >
                {listening ? <StopIcon /> : <MicIcon />}
              </button>
            )}
            <button
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zee-yellow text-zee-navy hover:bg-zee-yellow-dark disabled:opacity-50"
            >
              ➤
            </button>
          </form>
        </div>
      </div>

      {!open && !teaserHidden && (
        <div className="fixed bottom-24 right-6 z-50 hidden sm:block">
          <div className="relative rounded-2xl rounded-br-sm border border-zee-border bg-white py-2.5 pl-4 pr-8 text-sm font-medium text-zee-navy shadow-xl">
            <button
              onClick={() => setTeaserHidden(true)}
              aria-label="Dismiss"
              className="absolute right-2 top-1.5 text-lg leading-none text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
            <button
              onClick={toggleChat}
              className="block min-w-60 text-left"
            >
              <TypingTeaser phrases={teaserPhrases} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={toggleChat}
        aria-label={open ? "Close Zee support chat" : "Chat with Zee"}
        className={`fixed bottom-6 right-6 z-50 flex items-center bg-zee-navy text-white shadow-2xl ring-2 ring-zee-orange transition hover:scale-105 ${
          open ? "h-16 w-16 justify-center rounded-full" : "zee-float gap-3 rounded-full py-2 pl-2 pr-5"
        }`}
      >
        <span className="relative">
          {!open && (
            <span className="absolute inset-0 animate-ping rounded-full bg-zee-orange opacity-60" />
          )}
          <span className="relative block">
            <ZeeAvatar size={open ? 52 : 48} />
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zee-navy bg-green-400" />
        </span>
        {!open && (
          <span className="text-left leading-tight">
            <span className="block text-base font-bold">Ask Zee</span>
            <span className="block text-xs text-gray-300">AI support · online</span>
          </span>
        )}
      </button>
    </>
  );
}
