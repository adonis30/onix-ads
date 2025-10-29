// src/app/api/tenants/forms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoleAndTenant } from "@/lib/withRoleAndTenant";
import { z } from "zod";

const CreateFormSchema = z.object({
  name: z.string().min(2, "Form name must be at least 2 characters").max(50, "Form name too long"),
  description: z.string().max(200, "Description too long").optional(),
  published: z.boolean().optional(), // ✅ allow optional published field
});

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      console.log("[Forms API] GET | Tenant:", user.tenantId, "| Role:", user.role);

      const forms = await prisma.dynamicForm.findMany({
        where: { tenantId: user.tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          visits: true,
          submissions: true,
          createdAt: true,
          updatedAt: true,
          published: true, // ✅ include published status
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(forms);
    } catch (err: any) {
      console.error("[Forms API] GET Error:", err);
      return NextResponse.json(
        { error: "Failed to fetch forms", details: err.message },
        { status: 500 }
      );
    }
  },
  ["TENANT_ADMIN", "EDITOR", "SUPER_ADMIN"]
);

export const POST = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      console.log("[Forms API] POST body:", body);

      const parsed = CreateFormSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", issues: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { name, description, published } = parsed.data;

      const newForm = await prisma.dynamicForm.create({
        data: {
          tenantId: user.tenantId,
          name,
          slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          description: description ?? "",
          fields: [],
          visits: 0,
          submissions: 0,
          published: published ?? false, // ✅ default false
        },
      });

      console.log("[Forms API] Created form:", newForm.id);
      return NextResponse.json({ success: true, form: newForm });
    } catch (err: any) {
      console.error("[Forms API] POST Error:", err);
      return NextResponse.json(
        { error: "Internal server error", details: err.message },
        { status: 500 }
      );
    }
  },
  ["TENANT_ADMIN", "SUPER_ADMIN"]
);
