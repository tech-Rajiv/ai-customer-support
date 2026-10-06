import { NextResponse } from "next/server";
import { verifyCredentials, createSession } from "@/lib/auth";

export async function POST(request) {
  const { username, password } = await request.json().catch(() => ({}));
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }
  const user = await verifyCredentials(String(username).trim(), String(password));
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ user });
}
