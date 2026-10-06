"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { username: "userA", password: "passwordA", note: "Delayed earphones order" },
  { username: "userB", password: "passwordB", note: "Out for delivery + cancelled" },
  { username: "user3", password: "passwordC", note: "Delayed headphones order" },
];

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
    <div className="mx-auto w-full max-w-md space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Log in</h1>
        <label className="block text-sm font-medium">
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-4 text-sm">
        <p className="mb-2 font-semibold text-indigo-900">Demo accounts (click to fill)</p>
        <ul className="space-y-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.username}>
              <button type="button" onClick={() => { setUsername(a.username); setPassword(a.password); }}
                className="w-full rounded-lg bg-white px-3 py-2 text-left hover:bg-indigo-100">
                <span className="font-mono">{a.username} / {a.password}</span>
                <span className="block text-xs text-slate-500">{a.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
