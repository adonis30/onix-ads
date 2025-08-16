// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Reusable wrapper for role & tenant validation
function withRoleAndTenant(
  handler: (req: NextRequest, tenantId: string) => Promise<NextResponse>,
  allowedRoles: string[]
) {
  return async (req: NextRequest) => {
    try {
      const tenantId = req.headers.get("x-tenant-id");
      const role = req.headers.get("x-user-role");

      if (!tenantId) throw new Error("Tenant ID required");
      if (!role || !allowedRoles.includes(role)) throw new Error("Unauthorized");

      return await handler(req, tenantId);
    } catch (err: any) {
      console.error(err);
      const status = err.message === "Unauthorized" ? 403 : err.message === "Tenant ID required" ? 400 : 500;
      return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
    }
  };
}

// GET users (ADMIN or USER)
export const GET = withRoleAndTenant(async (_req, tenantId) => {
  console.log("GET /api/tenants/users hit");
  const users = await prisma.user.findMany({
    where: { tenantId },
    include: { tenant: true },
  });
  return NextResponse.json(users);
}, ["ADMIN", "USER"]);

// POST new user (ADMIN only)
export const POST = withRoleAndTenant(async (req, tenantId) => {
  const body = await req.json();
  const { name, email, role } = body;

  const user = await prisma.user.create({
    data: { name, email, role, tenantId },
  });

  return NextResponse.json(user, { status: 201 });
}, ["ADMIN"]);
