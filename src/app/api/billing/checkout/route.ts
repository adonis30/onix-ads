// src/app/api/billing/checkout/route.ts
import { lemonFetch } from "@/lib/lemon";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { variantId, tenantId, successUrl, cancelUrl } = body;

    if (!variantId || !tenantId) {
      return NextResponse.json({ error: "variantId and tenantId required" }, { status: 400 });
    }

    // payload per LemonSqueezy API for hosted checkouts
    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              tenantId,
            },
            success_url: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
            cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: process.env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    };

    const res = await lemonFetch("/checkouts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ url: res.data.attributes.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message || "Checkout failed" }, { status: 500 });
  }
}
