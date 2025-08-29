import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

type Handler = (req: NextRequest, user: { role: string; tenantId?: string }) => Promise<NextResponse>;

export function withRoleAndTenant(
  handler: Handler,
  allowedRoles: string[],
  checkOwnership?: { resource: "flyer" | "campaign"; idParam: string }
) {
  return async function (req: NextRequest) {
    try {
      const role = req.headers.get("x-user-role");
      const tenantId = req.headers.get("x-tenant-id") ?? undefined; // ✅ normalize null → undefined

      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      if (allowedRoles.includes("TENANT_ADMIN") && !tenantId) {
        return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
      }

      // Ownership check
      if (checkOwnership && tenantId) {
        const resourceId = req.nextUrl.searchParams.get(checkOwnership.idParam);
        if (!resourceId) {
          return NextResponse.json({ error: `${checkOwnership.resource} ID missing` }, { status: 400 });
        }

        if (checkOwnership.resource === "campaign") {
          const record = await prisma.campaign.findUnique({ where: { id: resourceId } });
          if (!record || record.tenantId !== tenantId) {
            return NextResponse.json({ error: "Forbidden: Not your resource" }, { status: 403 });
          }
        } else if (checkOwnership.resource === "flyer") {
          const record = await prisma.flyer.findUnique({ where: { id: resourceId } });
          if (!record || record.tenantId !== tenantId) {
            return NextResponse.json({ error: "Forbidden: Not your resource" }, { status: 403 });
          }
        }
      }

      return await handler(req, { role, tenantId });
    } catch (err: any) {
      console.error(err);
      return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
  };
}
