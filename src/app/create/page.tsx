import RoleGuard from "@/components/role-guard";
import CreateMemberForm from "./create-member-form";
import BackToDashboard from "@/components/back-to-dashboard";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  return (
    <div className="space-y-6 p-6">
      <BackToDashboard />
      <h2 className="text-2xl font-semibold">Create Member</h2>
      <RoleGuard ability="writeMembers">
        <CreateMemberForm />
      </RoleGuard>
    </div>
  );
}
