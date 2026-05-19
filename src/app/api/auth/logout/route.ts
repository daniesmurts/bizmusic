import { NextResponse } from "next/server";

export async function POST() {
  // Session management is handled by Clerk — no server-side sign-out needed.
  return NextResponse.json({ success: true });
}
