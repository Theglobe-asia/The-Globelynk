import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChartsWrapper from "./charts-wrapper";
import BackToDashboard from "@/components/back-to-dashboard";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/signin");

  const [basic, silver, gold, totalMembers] = await Promise.all([
    prisma.member.count({ where: { tier: "BASIC" } }),
    prisma.member.count({ where: { tier: "SILVER" } }),
    prisma.member.count({ where: { tier: "GOLD" } }),
    prisma.member.count(),
  ]);

  const since = new Date();
  since.setDate(since.getDate() - 29);

  const logs = await prisma.emailLog.findMany({
    where: { sentAt: { gte: since } },
    select: { sentAt: true, count: true },
    orderBy: { sentAt: "asc" },
  });

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const seriesMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    seriesMap.set(dayKey(d), 0);
  }
  for (const l of logs) {
    const k = dayKey(new Date(l.sentAt));
    seriesMap.set(k, (seriesMap.get(k) ?? 0) + (l.count ?? 1));
  }
  const timeSeries = Array.from(seriesMap.entries()).map(([date, value]) => ({
    date,
    value,
  }));

  return (
    <div className="space-y-6">
      <BackToDashboard />
      <h2 className="text-2xl font-semibold">Reports</h2>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Stat title="Total Members" value={totalMembers} />
        <Stat title="Basic" value={basic} />
        <Stat title="Silver" value={silver} />
        <Stat title="Gold" value={gold} />
      </div>

      {/* Client charts wrapper */}
      <ChartsWrapper pie={{ basic, silver, gold }} line={timeSeries} />
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
