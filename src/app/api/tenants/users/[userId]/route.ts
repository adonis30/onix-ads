import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, bad, notFound, serverError } from "@/lib/http";
import { requireTenantRoles } from "@/lib/auth-guards";
import { updateUserSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, context: any) {
   const params = await context.params;
   const userId = params.userId;
  try {
    const user = await requireTenantRoles([UserRole.TENANT_ADMIN]);
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.flatten().formErrors.join(", "));
    const data = parsed.data;

    // Ensure target user is inside same tenant
    const target = await prisma.user.findFirst({
      where: { id: params.userId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!target) return notFound("User not found");

    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: { ...data },
      select: { id: true, email: true, name: true, role: true },
    });

    await audit({ userId: user.id, tenantId: user.tenantId, action: "TENANT_USER_UPDATE", meta: { targetId: params.userId, data }});
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_: NextRequest, context: any) {
    const params = await context.params;
    const userId = params.userId;
  try {
    const user = await requireTenantRoles([UserRole.TENANT_ADMIN]);
    const target = await prisma.user.findFirst({
      where: { id: params.userId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!target) return notFound("User not found");

    await prisma.user.delete({ where: { id: params.userId }});
    await audit({ userId: user.id, tenantId: user.tenantId, action: "TENANT_USER_DELETE", meta: { targetId: params.userId }});
    return ok({ success: true });
  } catch (e) {
    return serverError(e);
  }
}
