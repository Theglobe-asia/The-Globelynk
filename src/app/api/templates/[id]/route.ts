import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/templates/:id
export async function GET(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const id = context.params.id;

  const rows = await prisma.$queryRaw<
    { id: string; name: string; subject: string; body: string }[]
  >`select id, name, subject, body 
     from "EmailTemplate"
     where id = ${id} 
       and "userId" = ${session.user.id}
     limit 1`;

  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// DELETE /api/templates/:id
export async function DELETE(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const id = context.params.id;

  await prisma.$executeRaw`
    delete from "EmailTemplate"
    where id = ${id}
      and "userId" = ${session.user.id}
  `;

  return NextResponse.json({ ok: true });
}
