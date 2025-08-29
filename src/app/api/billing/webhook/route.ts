// src/app/api/billing/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLemonWebhookSignature } from "@/lib/webhook";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || req.headers.get("x-lemon-signature") || null;

    if (!verifyLemonWebhookSignature(rawBody, signature)) {
      console.warn("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    // payload structure varies; LemonSqueezy wraps data under data and attributes
    // Inspect payload.meta.event_name for event type
    const eventName = payload.meta?.event_name ?? payload.event ?? "unknown";
    console.log("Lemon webhook event:", eventName);

    // Example: subscription created/updated/canceled — adapt depending on payload fields
    const entity = payload.data?.attributes ?? payload.data;

    // Extract some useful values (guarded)
    const providerSubscriptionId = payload.data?.id || entity?.id;
    // lemonade sample stores custom data under checkout_data or meta; check actual payload in logs
    const tenantId = entity?.custom_data?.tenantId || entity?.custom?.tenantId || payload.data?.attributes?.custom?.tenantId;

    // Map status
    const statusRaw = entity?.status || entity?.subscription?.status || "unknown";
    const status = (statusRaw || "").toUpperCase();

    // Determine variant/plan name
    const plan = (entity?.variant_name || entity?.plan || entity?.subscription?.variant_name || "") .toUpperCase();

    // Upsert Subscription
    if (providerSubscriptionId && tenantId) {
      await prisma.subscription.upsert({
        where: { stripeSubId: providerSubscriptionId }, // using stripeSubId as provider id slot
        update: {
          status,
          plan: plan || undefined,
          endDate: entity?.ends_at ? new Date(entity.ends_at) : undefined,
        },
        create: {
          tenantId,
          providerId: providerSubscriptionId,
          stripeSubId: providerSubscriptionId,
          status: status || "ACTIVE",
          plan: plan || "FREE",
          startDate: entity?.starts_at ? new Date(entity.starts_at) : new Date(),
          endDate: entity?.ends_at ? new Date(entity.ends_at) : undefined,
        },
      });

      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: providerSubscriptionId,
          tenantId,
          plan: plan || "FREE",
          status: status || "ACTIVE",
          startDate: entity?.starts_at ? new Date(entity.starts_at) : new Date(),
          endDate: entity?.ends_at ? new Date(entity.ends_at) : undefined,
        },
      });
    }

    // If the event contains order/invoice info, you may create other records here (e.g., Invoice table).
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
