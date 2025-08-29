// src/lib/rbac.ts
import { UserRole } from "@prisma/client";

/** simple helper for role checks */
export function hasRole(userRole: UserRole | string | undefined, required: UserRole | UserRole[]) {
  if (!userRole) return false;
  const requiredArr = Array.isArray(required) ? required : [required];
  return requiredArr.includes(userRole as UserRole);
}
