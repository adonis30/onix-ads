import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Reuse the same pattern you used for users
function requireRoleAndTenant(req: NextRequest, allowedRoles: string[]) {
  const role = req.headers.get("x-user-role");
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) throw new Error("Tenant ID required");
  if (!role || !allowedRoles.includes(role)) throw new Error("Unauthorized");
  return tenantId;
}

// GET: list campaigns (ADMIN or USER)
export async function GET(req: NextRequest) {
  try {
    const tenantId = requireRoleAndTenant(req, ["ADMIN", "USER"]);
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch (err: any) {
    const status =
      err.message === "Unauthorized" ? 403 :
      err.message === "Tenant ID required" ? 400 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}

// POST: create campaign (ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const tenantId = requireRoleAndTenant(req, ["ADMIN"]);
    const body = await req.json();
    const { name, description, isActive = true } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const created = await prisma.campaign.create({
      data: { name, description, isActive, tenantId },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const status =
      err.message === "Unauthorized" ? 403 :
      err.message === "Tenant ID required" ? 400 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}
