import MembersClient from "./members-client";
import RoleGuard from "@/components/role-guard";

export const dynamic = "force-dynamic";

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Members</h2>
      <RoleGuard ability="manageMembers">
        <MembersClient />
      </RoleGuard>
      <NoAccess />
    </div>
  );
}

function NoAccess() {
  return <RoleGuard ability="manageMembers" /> as any;
}
