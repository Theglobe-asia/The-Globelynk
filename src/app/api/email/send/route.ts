// src/app/api/email/send/route.ts

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { buildCampaignEmail, type CampaignTemplateKey } from "@/lib/campaign-email";

const resend = new Resend(process.env.RESEND_API_KEY);

type AttachmentPayload = {
  filename: string;
  content: string; // base64
  mimeType: string;
};

// --------------------------------------------------------
//   SAFE DELAY FUNCTION - prevents Resend rate-limit drop
// --------------------------------------------------------
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const payload = (await req.json()) as {
      segment: "individual" | "bulk";
      tier: "all" | "basic" | "silver" | "gold";
      to?: string; // may contain MULTIPLE emails
      subject: string;
      body: string;

      templateKey?: CampaignTemplateKey;
      bannerUrl?: string;
      ctaText?: string;
      ctaUrl?: string;
      leftImageUrl?: string;
      leftImageLabel?: string;
      rightImageUrl?: string;
      rightImageLabel?: string;

      attachments?: AttachmentPayload[];
    };

    const {
      segment,
      tier,
      to,
      subject,
      body,
      attachments,

      templateKey,
      bannerUrl,
      ctaText,
      ctaUrl,
      leftImageUrl,
      leftImageLabel,
      rightImageUrl,
      rightImageLabel,
    } = payload;

    let recipients: string[] = [];

    // -----------------------------------------------------------
    // INDIVIDUAL MODE — supports MULTI-SELECT (comma separated)
    // -----------------------------------------------------------
    if (segment === "individual") {
      if (!to)
        return NextResponse.json(
          { error: "Missing recipient" },
          { status: 400 }
        );

      recipients = to
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
    }

    // -----------------------------------------------------------
    // BULK MODE — unchanged
    // -----------------------------------------------------------
    else {
      const members = await prisma.member.findMany({
        where: tier === "all" ? {} : { tier: tier.toUpperCase() as any },
        select: { email: true },
      });

      recipients = members.map((m) => m.email);
    }

    // -----------------------------------------------------------
    // Build Campaign Email HTML
    // -----------------------------------------------------------
    const html = buildCampaignEmail({
      templateKey: templateKey || "classic",
      subject,
      body,
      bannerUrl,
      ctaText,
      ctaUrl,
      leftImageUrl,
      leftImageLabel,
      rightImageUrl,
      rightImageLabel,
    });

    // -----------------------------------------------------------
    // Prepare attachments
    // -----------------------------------------------------------
    const resendAttachments =
      attachments && attachments.length > 0
        ? attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.mimeType,
          }))
        : undefined;

    // -----------------------------------------------------------
    // SEQUENTIAL SENDING ENGINE — FIXES DROPPED EMAILS
    // -----------------------------------------------------------
    let successCount = 0;

    for (const email of recipients) {
      try {
        await resend.emails.send({
          from: "The Globe in Pattaya <info@mail.theglobeasia.com>",
          to: email,
          subject,
          html,
          attachments: resendAttachments,
        });

        successCount++;
      } catch (err) {
        console.error("Failed:", email, err);
      }

      // prevent rate limit silent-drop
      await wait(350);
    }

    // -----------------------------------------------------------
    // Log into database
    // -----------------------------------------------------------
    await prisma.emailLog.create({
      data: {
        to: segment === "individual" ? to || "" : "bulk",
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
