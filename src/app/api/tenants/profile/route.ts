import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, bad, serverError } from "@/lib/http";
import { requireTenantRoles } from "@/lib/auth-guards";
import { updateTenantSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireTenantRoles([UserRole.TENANT_ADMIN]);
    const body = await req.json();
    const parsed = updateTenantSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.flatten().formErrors.join(", "));
    const data = parsed.data;

    const updated = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        name: data.name,
        domain: data.domain === "" ? null : data.domain ?? undefined,
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
        logoUrl: data.logoUrl,
      },
    });

    await audit({ userId: user.id, tenantId: user.tenantId, action: "TENANT_PROFILE_UPDATE", meta: data });
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
