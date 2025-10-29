// src/lib/withRoleAndTenant.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "./prisma";

export type UserContext = { role: string; tenantId: string | null };
export type Handler = (req: NextRequest, user: UserContext) => Promise<NextResponse>;

/**
 * Middleware wrapper for protecting tenant routes.
 * Supports both API routes with headers and SSR routes using NextAuth sessions.
 */
export function withRoleAndTenant(
  handler: Handler,
  allowedRoles: string[],
  checkOwnership?: { resource: "flyer" | "campaign" | "dynamicForm"; idParam: string }
) {
  return async function (req: NextRequest) {
    try {
      // --- 1️⃣ Try reading from custom headers (client API calls)
      let role =
        req.headers.get("x-user-role") || req.cookies.get("userRole")?.value || null;
      let tenantId =
        req.headers.get("x-tenant-id") || req.cookies.get("tenantId")?.value || null;

      // --- 2️⃣ Fallback to NextAuth session (SSR / direct server calls)
      if (!tenantId || !role) {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          role = session.user.role;
          tenantId = session.user.tenantId;
        }
      }

      // --- 3️⃣ Enforce access rules
      if (!role || !allowedRoles.includes(role)) {
        console.warn(`[Auth] Unauthorized role: ${role}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // SUPER_ADMIN can operate without a tenantId
      if (!tenantId && role !== 'SUPER_ADMIN') {
        console.warn(`[Auth] Missing tenantId`);
        return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
      }

      // --- 4️⃣ Optional ownership check
      if (checkOwnership) {
        const resourceId = req.nextUrl.searchParams.get(checkOwnership.idParam);
        if (!resourceId) {
          return NextResponse.json(
            { error: `${checkOwnership.resource} ID missing` },
            { status: 400 }
          );
        }

        let record: { tenantId: string } | null = null;
        if (checkOwnership.resource === "campaign") {
          record = await prisma.campaign.findUnique({
            where: { id: resourceId },
            select: { tenantId: true },
          });
        } else if (checkOwnership.resource === "flyer") {
          record = await prisma.flyer.findUnique({
            where: { id: resourceId },
            select: { tenantId: true },
          });
        } else if (checkOwnership.resource === "dynamicForm") {
          record = await prisma.dynamicForm.findUnique({
            where: { id: resourceId },
            select: { tenantId: true },
          });
        }

        if (!record || record.tenantId !== tenantId) {
          console.warn(
            `[Auth] Forbidden: Tenant ${tenantId} tried to access ${checkOwnership.resource} ${resourceId}`
          );
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      // --- 5️⃣ Run handler
      return await handler(req, { role, tenantId });
    } catch (error: any) {
      console.error("[Auth Error]", error);
      return NextResponse.json(
        { error: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
