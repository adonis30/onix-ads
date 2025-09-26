import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/enums";


// Define or import your enum


/**
 * Validate tenant and role from headers.
 * @param req NextRequest
 * @param allowedRoles Roles allowed for this endpoint
 * @returns tenantId string
 */
function requireRoleAndTenant(req: NextRequest, allowedRoles: UserRole[]) {
  const tenantId = req.headers.get("x-tenant-id");
  const roleHeader = req.headers.get("x-user-role");

  if (!tenantId) throw new Error("Tenant ID required");
  if (!roleHeader) throw new Error("Unauthorized");

  // Ensure the role header matches enum
  const role = Object.values(UserRole).includes(roleHeader as UserRole)
    ? (roleHeader as UserRole)
    : null;

  if (!role) throw new Error("Invalid role");
  if (!allowedRoles.includes(role)) throw new Error("Forbidden");

  return tenantId;
}

// GET: List campaigns (allowed: TENANT_ADMIN, EDITOR, VIEWER)
export async function GET(req: NextRequest) {
  try {
    const tenantId = requireRoleAndTenant(req, [
      UserRole.TENANT_ADMIN,
      UserRole.EDITOR,
      UserRole.VIEWER,
    ]);

    const campaigns = await prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (err: any) {
    const status =
      err.message === "Unauthorized" ? 403 :
      err.message === "Tenant ID required" ? 400 :
      err.message === "Forbidden" ? 403 : 500;

    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}

// POST: Create campaign (allowed: TENANT_ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const tenantId = requireRoleAndTenant(req, [UserRole.TENANT_ADMIN]);
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
      err.message === "Tenant ID required" ? 400 :
      err.message === "Forbidden" ? 403 : 500;

    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}

// PATCH: Update campaign (TENANT_ADMIN only)
export async function PATCH(req: NextRequest) {
  try {
    const tenantId = requireRoleAndTenant(req, [UserRole.TENANT_ADMIN]);
    const body = await req.json();
    const { id, name, description, isActive } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const updated = await prisma.campaign.updateMany({
      where: { id, tenantId },
      data: { name, description, isActive },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Campaign not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Campaign updated" });
  } catch (err: any) {
    const status =
      err.message === "Unauthorized" ? 403 :
      err.message === "Tenant ID required" ? 400 :
      err.message === "Forbidden" ? 403 : 500;

    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}

// DELETE: Remove campaign (TENANT_ADMIN only)
export async function DELETE(req: NextRequest) {
  try {
    const tenantId = requireRoleAndTenant(req, [UserRole.TENANT_ADMIN]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const deleted = await prisma.campaign.deleteMany({
      where: { id, tenantId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Campaign not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Campaign deleted" });
  } catch (err: any) {
    const status =
      err.message === "Unauthorized" ? 403 :
      err.message === "Tenant ID required" ? 400 :
      err.message === "Forbidden" ? 403 : 500;

    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}
