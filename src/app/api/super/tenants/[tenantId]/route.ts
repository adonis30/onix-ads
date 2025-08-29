import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, bad, notFound, serverError } from "@/lib/http";
import { requireRoles } from "@/lib/auth-guards";
import { updateTenantSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(_: NextRequest, context: any) {
    const params = await context.params;
    const tenantId = params.tenantId;
  try {
    await requireRoles([UserRole.SUPER_ADMIN]);
    const t = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      include: {
        subscriptions: true,
        users: { select: { id: true, email: true, role: true } },
      },
    });
    if (!t) return notFound("Tenant not found");
    return ok(t);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest, context: any) {
    const params = await context.params;
    const tenantId = params.tenantId;
  try {
    const user = await requireRoles([UserRole.SUPER_ADMIN]);
    const body = await req.json();
    const parsed = updateTenantSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.flatten().formErrors.join(", "));
    const data = parsed.data;

    const updated = await prisma.tenant.update({
      where: { id: params.tenantId },
      data: {
        ...data,
        domain: data.domain === "" ? null : data.domain ?? undefined,
      },
    });
    await audit({ userId: user.id, tenantId: updated.id, action: "SUPER_TENANT_UPDATE", meta: data });
    return ok(updated);
  } catch (e) {
    if ((e as any)?.code === "P2025") return notFound("Tenant not found");
    return serverError(e);
  }
}

export async function DELETE(_: NextRequest, context: any) {
    const params = await context.params;
    const tenantId = params.tenantId;
  try {
    const user = await requireRoles([UserRole.SUPER_ADMIN]);
    const deleted = await prisma.tenant.delete({ where: { id: params.tenantId }});
    await audit({ userId: user.id, tenantId: deleted.id, action: "SUPER_TENANT_DELETE" });
    return ok({ success: true });
  } catch (e) {
    if ((e as any)?.code === "P2025") return notFound("Tenant not found");
    return serverError(e);
  }
}
