import "server-only";
import { cache } from "react";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

// Demo-grade auth: a signed cookie holding the user id. Not for production.
const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  return process.env.SESSION_SECRET || "dev-only-secret-change-me";
}

function sign(value) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function encode(userId) {
  const value = String(userId);
  return `${value}.${sign(value)}`;
}

function decode(token) {
  if (!token) return null;
  const [value, signature] = token.split(".");
  if (!value || !signature) return null;
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function verifyCredentials(username, password) {
  const rows = await query(
    "SELECT id, username, name, email, password_hash FROM users WHERE username = $1",
    [username],
  );
  const user = rows[0];
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? { id: user.id, username: user.username, name: user.name, email: user.email } : null;
}

export async function createSession(userId) {
  const store = await cookies();
  store.set(COOKIE_NAME, encode(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// Returns the logged-in user (without password hash) or null.
export const getCurrentUser = cache(async function getCurrentUser() {
  const store = await cookies();
  const id = decode(store.get(COOKIE_NAME)?.value);
  if (!id) return null;
  const rows = await query(
    "SELECT id, username, name, email, address, created_at FROM users WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
});
