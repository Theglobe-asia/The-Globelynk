export type AppRole = "ADMIN" | "EDITOR" | "VIEWER";

export const can = {
  manageUsers: (role: AppRole) => role === "ADMIN",
  sendEmails: (role: AppRole) => role === "ADMIN" || role === "EDITOR",
  writeMembers: (role: AppRole) => role === "ADMIN" || role === "EDITOR",
  readMembers: (_role: AppRole) => true,
};
