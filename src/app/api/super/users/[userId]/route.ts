
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-guards";
import { serverError } from "@/lib/http";
import { UserRole } from "@prisma/client";
import { ok } from "assert";
 
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
     
    return ok(t);
  } catch (e) {
    return serverError(e);
  }
}