// src/app/logs/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import LogsClient from "./logs-client";

export const dynamic = "force-dynamic";

// Minimal shape for the log we use here
type LogWithRelations = {
  id: number;
  to: string;
  subject: string;
  tier: string;
  count: number;
  sentAt: Date;
  user: { name: string | null } | null;
  member: { name: string | null; tier: string | null } | null;
};

export default async function LogsPage() {
  const session = await getAuthSession();

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/signin");
  }

  const logs = await prisma.emailLog.findMany({
    include: {
      user: { select: { name: true } },
      member: { select: { name: true, tier: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  const rows = logs.map((log: LogWithRelations) => ({
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
