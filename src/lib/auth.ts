// src/lib/auth.ts
import { NextRequest } from "next/server";

export function requireRole(req: NextRequest, allowedRoles: string[]) {
  // Extract role from session, token, or header
  const role = req.headers.get("x-user-role");

  if (!role || !allowedRoles.includes(role)) {
    throw new Error("Unauthorized");
  }

  return true;
}
