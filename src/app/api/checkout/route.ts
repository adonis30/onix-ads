import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { NextRequest, NextResponse } from "next/server";
 

type LemonCheckoutResponse = {
  url: string;
  [key: string]: any; // any other fields returned by LemonSqueezy
};

export async function POST(req: NextRequest) {
  try {
    const { variantId, customerEmail, metadata } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: "variantId is required" }, { status: 400 });
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const appBaseUrl = process.env.APP_BASE_URL;

    if (!storeId) {
      console.error("LEMONSQUEEZY_STORE_ID is not set");
      return NextResponse.json({ error: "LEMONSQUEEZY_STORE_ID is not set" }, { status: 500 });
    }
    if (!appBaseUrl) {
      console.error("APP_BASE_URL is not set");
      return NextResponse.json({ error: "APP_BASE_URL is not set" }, { status: 500 });
    }

    const storeIdNum = Number(storeId);
    const variantIdNum = Number(variantId);

    if (isNaN(storeIdNum)) {
      return NextResponse.json({ error: "LEMONSQUEEZY_STORE_ID must be a number" }, { status: 500 });
    }
    if (isNaN(variantIdNum)) {
      return NextResponse.json({ error: "variantId must be a number" }, { status: 400 });
    }

    // Create checkout
    const { data } = (await createCheckout(storeIdNum, variantIdNum, {
      checkoutData: {
        email: customerEmail,
        custom: {
          redirect_success: `${appBaseUrl}/billing/success`,
          redirect_cancel: `${appBaseUrl}/billing/cancel`,
          metadata,
        },
        variantQuantities: [{ variantId: variantIdNum, quantity: 1 }],
      },
      testMode: true,
    })) as unknown as { data: LemonCheckoutResponse };

    // Ensure URL exists
    if (!data?.url) {
      console.error("Checkout URL not found in response:", data);
      return NextResponse.json({ error: "Checkout URL not found" }, { status: 500 });
    }

    return NextResponse.json({ url: data.url });
  } catch (err: any) {
    console.error("Error in checkout route:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
