// src/app/api/templates/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const rows = await prisma.$queryRaw<
    { id: string; name: string; subject: string; body: string }[]
  >`select id, name, subject, body from "EmailTemplate"
    where "userId" = ${session.user.id}
    order by "createdAt" desc`;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { name, subject, body } = await req.json();

  if (!name || !subject || !body) {
    return NextResponse.json(
      { error: "Name, subject, and body are required" },
      { status: 400 }
    );
  }

  const id = randomUUID();

  const rows = await prisma.$queryRaw<
    { id: string; name: string; subject: string; body: string }[]
  >`insert into "EmailTemplate" (id, "userId", name, subject, body)
    values (${id}, ${session.user.id}, ${name}, ${subject}, ${body})
    returning id, name, subject, body`;

  return NextResponse.json(rows[0] ?? { id, name, subject, body });
}
