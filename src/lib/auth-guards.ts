// src/lib/auth-guards.ts
import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  tenantId?: string | null;
};

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  return session.user as SessionUser;
}

export async function requireRoles(roles: UserRole[]) {
  const user = await requireSession();
  if (!roles.includes(user.role)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  return user;
}

export async function requireTenantRoles(roles: UserRole[]) {
  const user = await requireRoles(roles);
  if (!user.tenantId) {
    throw new Response(JSON.stringify({ error: "Tenant context required" }), { status: 400 });
  }
  return user as SessionUser & { tenantId: string };
}

// ✅ New helper for cleaner super admin checks
export async function requireSuperAdmin() {
  return requireRoles([UserRole.SUPER_ADMIN]);
}
