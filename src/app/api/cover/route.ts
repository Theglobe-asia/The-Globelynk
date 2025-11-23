// src/app/api/cover/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_PASSWORD = "CAlex";

export async function GET() {
  const data = await prisma.cover.findFirst();
  return NextResponse.json(data || {});
}

export async function POST(req: Request) {
  const { coverUrl, password } = await req.json();

  // Validate password
  if (password !== ADMIN_PASSWORD) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Save cover image URL
  const saved = await prisma.cover.upsert({
    where: { id: 1 },
    update: { coverUrl },
    create: { id: 1, coverUrl },
  });

  return NextResponse.json(saved);
}
