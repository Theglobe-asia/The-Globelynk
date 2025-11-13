import { redirect } from "next/navigation";
import { auth } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import LogsClient from "./logs-client";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/signin");

  const logs = await prisma.emailLog.findMany({
    include: {
      user: { select: { name: true } },
      member: { select: { name: true, tier: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  const rows = logs.map((l) => ({
    id: l.id,
    to: l.to,
    subject: l.subject ?? "",
    status: l.status ?? "SENT",
    tier: l.member?.tier ?? "UNKNOWN",
    userName: l.user?.name ?? "",
    memberName: l.member?.name ?? "",
    createdAt: l.createdAt,
  }));

  return <LogsClient rows={rows} />;
}
