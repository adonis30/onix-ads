// src/app/api/billing/cancel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lemonFetch } from "@/lib/lemon";

export async function POST(req: Request) {
  try {
    const { subscriptionId, tenantId } = await req.json();
    if (!subscriptionId) return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });

    // Call Lemon to cancel subscription (endpoint depends on provider; using /subscriptions/:id/cancel sample)
    // LemonSqueezy might require updating the order or subscription - check their docs.
    // Here we attempt to cancel via the subscriptions endpoint.
    await lemonFetch(`/subscriptions/${subscriptionId}/cancel`, { method: "POST" });

    // Update DB
    await prisma.subscription.updateMany({
      where: { stripeSubId: subscriptionId, tenantId: tenantId ?? undefined },
      data: { status: "CANCELED", endDate: new Date() },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        tenantId: tenantId ?? "unknown",
        plan: "FREE",
        status: "CANCELED",
        startDate: new Date(),
        endDate: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Cancel error:", err);
    return NextResponse.json({ error: err.message || "Cancel failed" }, { status: 500 });
  }
}
