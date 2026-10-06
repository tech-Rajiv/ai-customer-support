"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/app/components/Logo";

const DEMO_ACCOUNTS = [
  { username: "userA", password: "passwordA", note: "Delayed earphones order" },
  { username: "userB", password: "passwordB", note: "Out for delivery + cancelled" },
  { username: "user3", password: "passwordC", note: "Delayed headphones order" },
];

const inputClass =
  "mt-1 w-full rounded border border-gray-400 px-3 py-2 text-sm outline-none focus:border-zee-orange-dark focus:ring-2 focus:ring-zee-orange";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-4">
      <Link href="/" aria-label="ZeeCart home" className="flex justify-center">
        <Logo size="lg" />
      </Link>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zee-border bg-white p-6">
        <h1 className="text-3xl">Sign in</h1>
        <label className="block text-sm font-bold">
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required className={inputClass} />
        </label>
        <label className="block text-sm font-bold">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className={inputClass} />
        </label>
        {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-zee-yellow py-2 text-sm hover:bg-zee-yellow-dark disabled:opacity-60">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="rounded-lg border border-dashed border-zee-border bg-white p-4 text-sm">
        <p className="mb-2 font-bold">Demo accounts (click to fill)</p>
        <ul className="space-y-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.username}>
              <button type="button" onClick={() => { setUsername(a.username); setPassword(a.password); }}
                className="w-full rounded border border-zee-border px-3 py-2 text-left hover:bg-gray-50">
                <span className="font-mono">{a.username} / {a.password}</span>
                <span className="block text-xs text-gray-500">{a.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
