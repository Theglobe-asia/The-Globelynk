import { prisma } from "@/lib/prisma";
import LogsClient, { EmailLogRow } from "./logs-client";
import { getAuthSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";

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
    tier: log.tier,
    count: log.count,
    sentAt: log.sentAt,
    createdAt: log.sentAt,
    status: "SENT",                   // FIXED — must be uppercase to match EmailLogRow type

    userName: log.user?.name ?? "Unknown",
    memberName: log.member?.name ?? null,
    memberTier: log.member?.tier ?? null,
  }));

  return <LogsClient rows={rows} />;
}
