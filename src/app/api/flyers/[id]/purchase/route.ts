// src/app/api/flyers/[id]/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lenco } from "@/lib/lencoClient";
import { redisPublisher } from "@/lib/redis";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, context: any) {
  try {
    const flyerId = context.params.id;
    const { phone, operator } = await req.json();

    const flyer = await prisma.flyer.findUnique({ where: { id: flyerId } });
    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    // sanitize reference
    const reference = `flyer_${flyerId}_${Date.now()}`.replace(/[^a-zA-Z0-9._-]/g, "_");

    const amount = flyer.priceCents ?? 0;

    // send collection request to Lenco
    let paymentData;
    try {
      paymentData = await lenco.createTransfer({
        amount,
        phone,
        operator: operator.toLowerCase(),
        reason: flyer.title,
        reference,
        currency: flyer.currency ?? "ZMW",
        bearer: "merchant",
      });
    } catch (err: any) {
      console.error("Lenco request failed:", err.response?.data || err.message);
      return NextResponse.json(
        { error: "Payment initiation failed", details: err.response?.data },
        { status: 400 }
      );
    }

    // ✅ Generate guest purchaseToken
    const purchaseToken = randomUUID();

    // store payment in DB
    await prisma.payment.create({
      data: {
        flyerId,
        tenantId: flyer.tenantId,
        accountId: paymentData.data.id,
        reference,
        amount,
        currency: flyer.currency ?? "ZMW",
        type: "COLLECTION",
        status: "PENDING",
        reason: flyer.title,
        recipientId: phone,
        provider: operator,
        webhookRaw: paymentData,
        purchaseToken, // ✅ save token for guest
      },
    });

    // notify frontend via Redis
    await redisPublisher.publish(
      `payment:${reference}`,
      JSON.stringify({ status: "PENDING" })
    );

    // ✅ Set purchaseToken as httpOnly cookie for 7 days
    const response = NextResponse.json({
      reference,
      paymentData: paymentData.data,
    });

    response.cookies.set({
      name: "purchaseToken",
      value: purchaseToken,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err: any) {
    console.error("Purchase route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
