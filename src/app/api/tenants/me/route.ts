import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";
import { requireTenantRoles } from "@/lib/auth-guards";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireTenantRoles([UserRole.TENANT_ADMIN, UserRole.EDITOR, UserRole.VIEWER]);
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        subscriptions: true,
        users: { select: { id: true, email: true, role: true, name: true } },
        campaigns: { select: { id: true } },
        flyers: { select: { id: true } },
      },
    });
    return ok({
      user,
      tenant,
      counts: {
        users: tenant?.users.length ?? 0,
        campaigns: tenant?.campaigns.length ?? 0,
        flyers: tenant?.flyers.length ?? 0,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
