import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function requireRoleAndTenant(req: NextRequest, allowedRoles: string[]) {
  const role = req.headers.get("x-user-role");
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) throw new Error("Tenant ID required");
  if (!role || !allowedRoles.includes(role)) throw new Error("Unauthorized");
  return tenantId;
}

// GET single campaign
export async function GET(req: NextRequest, context: any) {
  try {
    const tenantId = requireRoleAndTenant(req, ["ADMIN", "USER"]);
    const id = context.params.id as string;

    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId },
    });
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(campaign);
  } catch (err: any) {
    const status =
      err.message === "Unauthorized" ? 403 :
      err.message === "Tenant ID required" ? 400 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}

// PATCH update (ADMIN only)
export async function PATCH(req: NextRequest, context: any) {
  try {
    const tenantId = requireRoleAndTenant(req, ["ADMIN"]);
    const id = context.params.id as string;
    const body = await req.json();
    const { name, description, isActive } = body as {
      name?: string; description?: string; isActive?: boolean;
    };

    const updated = await prisma.campaign.updateMany({
      where: { id, tenantId },
      data: { name, description, isActive },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Not found or not in tenant" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status =
      err.message === "Unauthorized" ? 403 :
      err.message === "Tenant ID required" ? 400 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}

// DELETE (ADMIN only)
export async function DELETE(req: NextRequest, context: any) {
  try {
    const tenantId = requireRoleAndTenant(req, ["ADMIN"]);
    const id = context.params.id as string;

    const deleted = await prisma.campaign.deleteMany({
      where: { id, tenantId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not found or not in tenant" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status =
      err.message === "Unauthorized" ? 403 :
      err.message === "Tenant ID required" ? 400 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}
