import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, bad, notFound, serverError } from "@/lib/http";
import { requireRoles } from "@/lib/auth-guards";
import { upsertSubscriptionSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest, context: any) {
  const params = await context.params;
  const tenantId = params.tenantId;
  if (!tenantId) return bad("tenantId required");

  try {
    const user = await requireRoles([UserRole.SUPER_ADMIN]);

    const t = await prisma.tenant.findUnique({ where: { id: params.tenantId }});
    if (!t) return notFound("Tenant not found");

    const body = await req.json();
    const parsed = upsertSubscriptionSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.flatten().formErrors.join(", "));
    const data = parsed.data;

    const sub = await prisma.subscription.upsert({
      where: { tenantId: params.tenantId },
      update: {
        plan: data.plan,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : null,
        providerId: data.providerId,
        stripeSubId: data.stripeSubId,
      },
      create: {
        tenantId: params.tenantId,
        plan: data.plan,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        providerId: data.providerId,
        stripeSubId: data.stripeSubId,
      },
    });

    // Optional: insert into SubscriptionHistory
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: sub.id,
        tenantId: params.tenantId,
        plan: sub.plan,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate ?? undefined,
      },
    });

    await audit({ userId: user.id, tenantId: params.tenantId, action: "SUPER_SUBSCRIPTION_UPSERT", meta: data });
    return ok(sub);
  } catch (e) {
    return serverError(e);
  }
}
