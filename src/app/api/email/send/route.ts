import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { segment, tier, to, subject, body } = await req.json();

    let recipients: string[] = [];

    if (segment === "individual") {
      if (!to)
        return NextResponse.json({ error: "Missing recipient" }, { status: 400 });

      recipients = [to];
    } else {
      // Bulk selection
      const members = await prisma.member.findMany({
        where: tier === "all" ? {} : { tier: tier.toUpperCase() },
        select: { email: true },
      });

      // FIX: add explicit type for "m"
      recipients = members.map((m: { email: string }) => m.email);
    }

    // Send emails via Resend
    const results = await Promise.allSettled(
      recipients.map((email) =>
        resend.emails.send({
          from: "The Globe in Pattaya <info@theglobeasia.com>",
          to: email,
          subject,
          html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
        })
      )
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;

    // Log the send in Prisma
    await prisma.emailLog.create({
      data: {
        to: segment === "individual" ? to : "bulk",
        subject,
        tier: tier.toUpperCase(),
        count: successCount,
        sentAt: new Date(),
        userId: session.user.id,
        // body NOT logged because schema does not support it
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
