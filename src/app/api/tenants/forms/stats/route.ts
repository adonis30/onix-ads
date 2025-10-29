// src/app/api/tenants/forms/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoleAndTenant } from "@/lib/withRoleAndTenant";

async function handler(_req: Request, user: { role: string; tenantId?: string }) {
  const { tenantId } = user;

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
  }

  const { _sum } = await prisma.dynamicForm.aggregate({
    where: { tenantId },
    _sum: { submissions: true, visits: true },
  });

  const visits = _sum.visits ?? 0;
  const submissions = _sum.submissions ?? 0;

  const conversionRate =
    visits > 0 ? Math.round((submissions / visits) * 100) : 0;

  const bounceRate =
    visits > 0 ? Math.round(((visits - submissions) / visits) * 100) : 0;

  return NextResponse.json({
    visits,
    submissions,
    conversionRate,
    bounceRate,
  });
}

// ✅ Only allow Tenant Admins or Super Admins to access stats
export const GET = withRoleAndTenant(handler, ["SUPER_ADMIN", "TENANT_ADMIN"]);
