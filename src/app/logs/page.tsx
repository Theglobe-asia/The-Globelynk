// src/app/logs/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import LogsClient from "./logs-client";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  // Use central NextAuth config
  const session = await getAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/signin");
  }

  // Fetch logs from Prisma
  const logs = await prisma.emailLog.findMany({
    include: {
      user: { select: { name: true } },
      member: { select: { name: true, tier: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  // Shape into rows expected by logs-client
  const rows = logs.map((log) => ({
    id: log.id,
    to: log.to,
    subject: log.subject,
    tier: log.tier,
    count: log.count,
    sentAt: log.sentAt,
    userName: log.user?.name ?? "Unknown",
    memberName: log.member?.name ?? null,
    memberTier: log.member?.tier ?? null,
  }));

  return <LogsClient rows={rows} />;
}
