// src/app/api/email/send/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { buildEmailHTML } from "@/lib/emailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

type AttachmentPayload = {
  filename: string;
  content: string;   // base64
  mimeType: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { segment, tier, to, subject, body, attachments } = await req.json() as {
      segment: "individual" | "bulk";
      tier: "all" | "basic" | "silver" | "gold";
      to?: string;
      subject: string;
      body: string;
      attachments?: AttachmentPayload[];
    };

    let recipients: string[] = [];

    if (segment === "individual") {
      if (!to)
        return NextResponse.json(
          { error: "Missing recipient" },
          { status: 400 }
        );
      recipients = [to];
    } else {
      const members = await prisma.member.findMany({
        where: tier === "all" ? {} : { tier: tier.toUpperCase() as any },
        select: { email: true },
      });

      recipients = members.map((m: { email: string }) => m.email);
    }

    const html = buildEmailHTML(body);

    const resendAttachments =
      attachments && attachments.length > 0
        ? attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.mimeType,
          }))
        : undefined;

    const results = await Promise.allSettled(
      recipients.map((email) =>
        resend.emails.send({
          from: "The Globe in Pattaya <info@mail.theglobeasia.com>",
          to: email,
          subject,
          html,
          attachments: resendAttachments,
        })
      )
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;

    await prisma.emailLog.create({
      data: {
        to: segment === "individual" ? to! : "bulk",
        subject,
        tier: tier.toUpperCase(),
        count: successCount,
        sentAt: new Date(),
        userId: session.user.id,
      },
    });

    return NextResponse.json({ ok: true, count: successCount });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Send failed" },
      { status: 500 }
    );
  }
}
