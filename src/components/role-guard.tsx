import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Canonical checks
const can = {
  sendEmails: (role: string) => role === "ADMIN" || role === "EDITOR",
  manageMembers: (role: string) => role === "ADMIN",
  create: (role: string) => role === "ADMIN",
  viewLogs: (role: string) => role === "ADMIN",
} as const;

type CanonicalAbility = keyof typeof can;

// Aliases so mismatched strings don't break the UI
const alias: Record<string, CanonicalAbility> = {
  send: "sendEmails",
  "send-emails": "sendEmails",
  emailing: "sendEmails",

  members: "manageMembers",
  "manage-members": "manageMembers",
  "writeMembers": "manageMembers",      // ← your current page uses this
  "write-members": "manageMembers",

  create: "create",
  "create-member": "create",
  "create-members": "create",

  logs: "viewLogs",
  "view-logs": "viewLogs",
};

function normalizeAbility(a?: string): CanonicalAbility | null {
  if (!a) return null;
  if (a in can) return a as CanonicalAbility;
  const key = a.toString();
  return (alias[key] ?? alias[key.toLowerCase()]) ?? null;
}

export default async function RoleGuard({
  ability,
  children,
}: {
  ability: string;
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "VIEWER";

  const normalized = normalizeAbility(ability);
  if (!normalized) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[RoleGuard] Unknown ability "${ability}". Known: ${Object.keys(can).join(", ")}`
      );
    }
    return null;
  }

  const ok = (can[normalized] as (r: string) => boolean)(role);
  if (!ok) return null;

  return <>{children}</>;
}
