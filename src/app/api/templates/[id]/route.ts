// src/app/api/templates/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = params;

  const rows = await prisma.$queryRaw<
    { id: string; name: string; subject: string; body: string }[]
  >`select id, name, subject, body from "EmailTemplate"
    where id = ${id} and "userId" = ${session.user.id}
    limit 1`;

  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(rows[0]);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = params;

  await prisma.$executeRaw`
    delete from "EmailTemplate"
    where id = ${id} and "userId" = ${session.user.id}
  `;

  return NextResponse.json({ ok: true });
}
