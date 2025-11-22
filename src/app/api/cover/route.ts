// src/app/api/cover/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET current user's coverUrl
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ coverUrl: null }, { status: 200 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coverUrl: true }, // will work AFTER DB column exists
    });

    return NextResponse.json({ coverUrl: user?.coverUrl ?? null }, { status: 200 });
  } catch (e: any) {
    // If prod DB doesn't have coverUrl yet, do NOT crash the app
    if (e?.code === "P2022") {
      return NextResponse.json({ coverUrl: null }, { status: 200 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST update coverUrl
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { coverUrl } = await req.json();
    if (!coverUrl) {
      return NextResponse.json({ error: "Missing coverUrl" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { coverUrl },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2022") {
      return NextResponse.json(
        { error: "coverUrl column missing in DB. Apply DB fix." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
