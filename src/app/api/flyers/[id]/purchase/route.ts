// src/app/api/flyers/[id]/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lenco } from "@/lib/lencoClient";
import { redisPublisher } from "@/lib/redis";

export async function POST(
  req: NextRequest,
  context: any 
) {
  try {
    const flyerId = await context.params.id;
    const { phone, operator } = await req.json();

    const flyer = await prisma.flyer.findUnique({ where: { id: flyerId } });
    if (!flyer)
      return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    // sanitize reference: only alphanumerics, ., _, -
    const reference = `flyer_${flyerId}_${Date.now()}`.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    // ensure amount is number
    const amount = flyer.priceCents ?? 0;

    // send collection request to Lenco
    let paymentData;
    try {
      paymentData = await lenco.createTransfer({
        amount,
        phone,                  // Lenco field
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
      },
    });

    // notify frontend via Redis
    await redisPublisher.publish(
      `payment:${reference}`,
      JSON.stringify({ status: "PENDING" })
    );

    return NextResponse.json({
      reference,
      paymentData: paymentData.data,
    });
  } catch (err: any) {
    console.error("Purchase route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
