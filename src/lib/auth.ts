// src/lib/auth.ts
import { NextRequest } from "next/server";

export function requireRole(req: NextRequest, allowedRoles: string[]) {
  const role = req.headers.get("x-user-role");
  const tenantId = req.headers.get("x-tenant-id");

  if (!tenantId) throw new Error("Tenant ID required");
  if (!role || !allowedRoles.includes(role)) throw new Error("Unauthorized");

 // console.log(`[Auth] Role: ${role}, Tenant: ${tenantId}`);
  return { role, tenantId };
}
