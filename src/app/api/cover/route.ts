import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ADMIN_PASSWORD = "CAlex";

// READ COVER (public)
export async function GET() {
  try {
    const data = await prisma.siteCover.findFirst();
    return NextResponse.json({ coverUrl: data?.coverUrl ?? null });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// WRITE COVER (admin only)
export async function POST(req: Request) {
  try {
    const { coverUrl, password } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saved = await prisma.siteCover.upsert({
      where: { id: 1 },
      update: { coverUrl },
      create: { id: 1, coverUrl }
    });

    return NextResponse.json({ success: true, coverUrl: saved.coverUrl });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
