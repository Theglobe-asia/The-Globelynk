// src/lib/auth-helper.ts
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";

export function getAuthSession() {
  return getServerSession(authOptions);
}

export { requireAdmin };
