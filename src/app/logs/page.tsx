import { prisma } from "@/lib/prisma";
import LogsClient, { EmailLogRow } from "./logs-client";
import { getAuthSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { Tier } from "@prisma/client";

export default async function LogsPage() {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/signin");

  const logs = await prisma.emailLog.findMany({
    orderBy: { sentAt: "desc" },
    include: {
      user: true,
      member: true,
    },
  });

  const rows: EmailLogRow[] = logs.map((log) => ({
    id: String(log.id),
    to: log.to,
    subject: log.subject,

    // FIX — EmailLogRow.tier expects Tier, not string
    tier: (log.tier as Tier) ?? null,

    count: log.count,
    sentAt: log.sentAt,
    createdAt: log.sentAt,
    status: "SENT",

    userName: log.user?.name ?? "Unknown",
    memberName: log.member?.name ?? null,
    memberTier: log.member?.tier ?? null,
  }));

  return <LogsClient rows={rows} />;
}
