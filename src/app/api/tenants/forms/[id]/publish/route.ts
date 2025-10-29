import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoleAndTenant } from "@/lib/withRoleAndTenant";

/**
 * ✅ PATCH /api/tenants/forms/[id]/publish
 * Toggles the published status of a form.
 */
export const PATCH = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { id } = await req.json();
      if (!id) {
        return NextResponse.json({ error: "Form ID is required" }, { status: 400 });
      }

      const form = await prisma.dynamicForm.findUnique({
        where: { id, tenantId: user.tenantId },
      });

      if (!form) {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }

      const updated = await prisma.dynamicForm.update({
        where: { id },
        data: { published: !form.published },
        select: {
          id: true,
          name: true,
          published: true,
          updatedAt: true,
        },
      });

      console.log(`[Forms API] Toggled publish for ${id}: ${updated.published}`);

      return NextResponse.json({
        success: true,
        message: updated.published
          ? "Form published successfully."
          : "Form reverted to draft.",
        form: updated,
      });
    } catch (err: any) {
      console.error("[Forms API] PATCH Error:", err);
      return NextResponse.json(
        { error: "Internal server error", details: err.message },
        { status: 500 }
      );
    }
  },
  ["TENANT_ADMIN", "EDITOR", "SUPER_ADMIN"]
);
