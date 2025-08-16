// src/app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Utility: enforce role & tenant
function requireRoleAndTenant(req: NextRequest, allowedRoles: string[]) {
  const role = req.headers.get("x-user-role"); // adapt to session/JWT if needed
  const tenantId = req.headers.get("x-tenant-id");

  if (!tenantId) throw new Error("Tenant ID required");
  if (!role || !allowedRoles.includes(role)) throw new Error("Unauthorized");

  return tenantId;
}

// GET single user (ADMIN or USER)
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const tenantId = requireRoleAndTenant(req, ["ADMIN", "USER"]);

    const user = await prisma.user.findFirst({
      where: { id: params.userId, tenantId },
      include: { tenant: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err: any) {
    console.error(err);
    const status = err.message === "Unauthorized" ? 403 : err.message === "Tenant ID required" ? 400 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}

// PUT / PATCH user (ADMIN only)
export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const tenantId = requireRoleAndTenant(req, ["ADMIN"]);

    const body = await req.json();
    const { name, email, role } = body;

    const updated = await prisma.user.updateMany({
      where: { id: params.userId, tenantId },
      data: { name, email, role },
    });

    if (updated.count === 0)
      return NextResponse.json({ error: "User not found or not in tenant" }, { status: 404 });

    return NextResponse.json({ message: "User updated successfully" });
  } catch (err: any) {
    console.error(err);
    const status = err.message === "Unauthorized" ? 403 : err.message === "Tenant ID required" ? 400 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}

// DELETE user (ADMIN only)
export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const tenantId = requireRoleAndTenant(req, ["ADMIN"]);

    const deleted = await prisma.user.deleteMany({
      where: { id: params.userId, tenantId },
    });

    if (deleted.count === 0)
      return NextResponse.json({ error: "User not found or not in tenant" }, { status: 404 });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err: any) {
    console.error(err);
    const status = err.message === "Unauthorized" ? 403 : err.message === "Tenant ID required" ? 400 : 500;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status });
  }
}
