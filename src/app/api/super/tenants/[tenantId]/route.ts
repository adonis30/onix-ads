import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, bad, notFound, serverError } from "@/lib/http";
import { requireRoles } from "@/lib/auth-guards";
import { updateTenantSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

/**
 * PATCH /api/super/tenants/:tenantId
 */
export async function PATCH(req: Request, context: any ) {
   const tenantId = context.params.tenantId as string;

  try {
    const user = await requireRoles([UserRole.SUPER_ADMIN]);
    const body = await req.json();
    const parsed = updateTenantSchema.safeParse(body);

    if (!parsed.success) {
      return bad(parsed.error.flatten().formErrors?.join(", ") || "Invalid payload");
    }

    // Normalize empty strings -> null
    const normalized = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v])
    );

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: normalized,
    });

    await audit({
      userId: user.id,
      tenantId: updated.id,
      action: "SUPER_TENANT_UPDATE",
      meta: normalized,
    });

    return ok(updated);
  } catch (e: any) {
    if (e.code === "P2025") return notFound("Tenant not found");
    return serverError(e);
  }
}

/**
 * DELETE /api/super/tenants/:tenantId
 */
export async function DELETE(_: Request, context: any) {
  const tenantId = context.params.tenantId as string;

  try {
    const user = await requireRoles([UserRole.SUPER_ADMIN]);
    const deleted = await prisma.tenant.delete({ where: { id: tenantId } });

    await audit({ userId: user.id, tenantId: deleted.id, action: "SUPER_TENANT_DELETE" });
    return ok({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") return notFound("Tenant not found");
    return serverError(e);
  }
}