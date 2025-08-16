// src/app/api/webhooks/lemonsqueezy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("Lemon-Signature")!;
  const body = await req.text();

  // TODO: verify signature using your webhook secret
  const event = JSON.parse(body);

  try {
    const { type, data } = event;

    if (type === "checkout_completed") {
      const tenantId = data.attributes.metadata.tenantId;
      const variantId = data.relationships.variant.data.id;

      // update tenant plan
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { planVariantId: Number(variantId), planActive: true },
      });
    }

    // handle other events: subscription_canceled, subscription_updated, etc.

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
