import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const rows = await prisma.emailTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const data = await req.json();

  const {
    name,
    subject,
    body,
    templateKey = "classic",
    bannerUrl,
    ctaText,
    ctaUrl,
    leftImageUrl,
    leftImageLabel,
    rightImageUrl,
    rightImageLabel,
  } = data;

  if (!name || !subject || !body) {
    return NextResponse.json(
      { error: "Name, subject, and body are required" },
      { status: 400 }
    );
  }

  const created = await prisma.emailTemplate.create({
    data: {
      name,
      subject,
      body,
      templateKey,
      bannerUrl,
      ctaText,
      ctaUrl,
      leftImageUrl,
      leftImageLabel,
      rightImageUrl,
      rightImageLabel,
      userId: session.user.id,
    },
  });

  return NextResponse.json(created);
}
