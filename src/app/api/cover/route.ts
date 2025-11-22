// src/app/api/cover/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coverUrl: true },
  });

  return NextResponse.json({ coverUrl: user?.coverUrl ?? null });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { coverUrl } = (await req.json()) as { coverUrl?: string };
  if (!coverUrl) {
    return NextResponse.json({ error: "Missing coverUrl" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { coverUrl },
  });

  return NextResponse.json({ ok: true });
}
