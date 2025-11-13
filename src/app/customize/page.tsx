import { prisma } from "@/lib/prisma";
import ClientCustomize from "./ClientCustomize";
import BackToDashboard from "@/components/back-to-dashboard";

export const dynamic = "force-dynamic";

export default async function CustomizePage() {
  const members = await prisma.member.findMany({
    orderBy: { joinedAt: "desc" }, // use joinedAt (not createdAt)
  });

  return (
    <div className="space-y-6 p-6">
      <BackToDashboard />
      <ClientCustomize members={members} />
    </div>
  );
}
