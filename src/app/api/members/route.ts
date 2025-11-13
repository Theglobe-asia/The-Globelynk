import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: list members (used by Send page)
export async function GET() {
  const members = await prisma.member.findMany({
    select: { id: true, name: true, email: true, tier: true, joinedAt: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(members);
}

// POST: create a member
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "VIEWER";
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, email, tier } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    const validTiers = new Set(["BASIC", "SILVER", "GOLD"]);
    const t = validTiers.has(String(tier)) ? String(tier) : "BASIC";

    const created = await prisma.member.create({
      data: { name, email, tier: t as any },
      select: { id: true, name: true, email: true, tier: true, joinedAt: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // Unique email guard
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
