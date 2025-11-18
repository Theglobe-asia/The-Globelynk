import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ---------------------------
   GET: List members
---------------------------- */
export async function GET() {
  const members = await prisma.member.findMany({
    select: { id: true, name: true, email: true, tier: true, joinedAt: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(members);
}

/* ---------------------------
   POST: Create member
---------------------------- */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "VIEWER";
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, email, tier } = await req.json();

    /* -----------------------------------
       Email required + validated format
    ------------------------------------ */
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Reject blank or empty emails
    if (trimmedEmail.length === 0) {
      return NextResponse.json(
        { error: "Email cannot be empty" },
        { status: 400 }
      );
    }

    // Full email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    /* -----------------------------------
       Validate tier
    ------------------------------------ */
    const validTiers = new Set(["BASIC", "SILVER", "GOLD"]);
    const finalTier = validTiers.has(String(tier)) ? String(tier) : "BASIC";

    /* -----------------------------------
       Create member
    ------------------------------------ */
    const created = await prisma.member.create({
      data: {
        name,
        email: trimmedEmail,
        tier: finalTier as any,
      },
      select: { id: true, name: true, email: true, tier: true, joinedAt: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // Prisma unique constraint
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
