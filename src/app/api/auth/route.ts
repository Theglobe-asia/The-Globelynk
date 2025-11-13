import { NextResponse } from "next/server";

// This route exists only to prevent build errors.
// All authentication is handled in [...nextauth]/route.ts
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
