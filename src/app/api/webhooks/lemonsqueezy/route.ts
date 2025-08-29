// src/app/api/webhooks/lemonsqueezy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Map LemonSqueezy variant IDs to your Plan enum
const VARIANT_PLAN_MAP: Record<number, "FREE" | "STARTUP" | "PRO" | "ENTERPRISE"> = {
  101: "STARTUP",
  102: "PRO",
  103: "ENTERPRISE",
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get("Lemon-Signature") || "";
  const body = await req.text();

  // TODO: verify signature using your webhook secret
  let event;
  try {
    event = JSON.parse(body);
  } catch (err: any) {
    console.error("Invalid JSON body:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { type, data } = event;

    if (type === "checkout_completed") {
      const tenantId: string = data.attributes.metadata.tenantId;
      const variantId: number = Number(data.relationships.variant.data.id);

      if (!tenantId || !variantId) {
        return NextResponse.json({ error: "Missing tenantId or variantId" }, { status: 400 });
      }

      const plan = VARIANT_PLAN_MAP[variantId] || "FREE";

      // Only update the existing `plan` field
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan,
        },
      });

      console.log(`Tenant ${tenantId} upgraded to plan ${plan}`);
    }

    // Handle other events here

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
