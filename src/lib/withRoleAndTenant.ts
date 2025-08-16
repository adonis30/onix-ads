// src/lib/withRoleAndTenant.ts
import { NextRequest, NextResponse } from "next/server";

type Handler = (req: NextRequest, tenantId: string) => Promise<NextResponse>;

export function withRoleAndTenant(handler: Handler, allowedRoles: string[]) {
  return async function (req: NextRequest) {
    try {
      const role = req.headers.get("x-user-role");
      const tenantId = req.headers.get("x-tenant-id");

      if (!tenantId) return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
      if (!role || !allowedRoles.includes(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

      return await handler(req, tenantId);
    } catch (err: any) {
      console.error(err);
      return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
  };
}
