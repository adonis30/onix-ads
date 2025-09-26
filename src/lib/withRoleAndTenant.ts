import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

type UserContext = { role: string; tenantId?: string };
type Handler = (req: NextRequest, user: UserContext) => Promise<NextResponse>;

export function withRoleAndTenant(
  handler: Handler,
  allowedRoles: string[],
  checkOwnership?: { resource: "flyer" | "campaign"; idParam: string }
) {
  return async function (req: NextRequest) {
    try {
      // --- Extract role and tenantId from headers or cookies ---
      let role = req.headers.get("x-user-role") || undefined;
      let tenantId = req.headers.get("x-tenant-id") || undefined;

      if (!role) role = req.cookies.get("userRole")?.value;
      if (!tenantId) tenantId = req.cookies.get("tenantId")?.value;

      // --- Basic role validation ---
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // --- Tenant required for tenant-specific roles ---
      if (allowedRoles.includes("TENANT_ADMIN") && !tenantId) {
        return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
      }

      // --- Optional ownership check ---
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

      // --- Call original handler with validated user context ---
      return await handler(req, { role, tenantId });
    } catch (err: any) {
      console.error(err);
      return NextResponse.json(
        { error: err.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
