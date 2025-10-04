// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redisPublisher } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { reference, event, data } = payload;

    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) {
      console.warn("Payment not found for reference:", reference);
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    let statusUpdate: "SUCCESS" | "FAILED" | "PENDING" =
      (["SUCCESS", "FAILED", "PENDING"] as const).includes(payment.status as any)
        ? (payment.status as "SUCCESS" | "FAILED" | "PENDING")
        : "PENDING";

    switch (event) {
      case "collection.settled":
        statusUpdate = "SUCCESS";
        break;
      case "collection.failed":
      case "collection.reversed":
        statusUpdate = "FAILED";
        break;
      default:
        statusUpdate = (["SUCCESS", "FAILED", "PENDING"] as const).includes(payment.status as any)
          ? (payment.status as "SUCCESS" | "FAILED" | "PENDING")
          : "PENDING"; // fallback to PENDING if status is invalid
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: statusUpdate,
        completedAt: data.completedAt ? new Date(data.completedAt) : payment.completedAt,
        amount: data.amount ? parseFloat(data.amount) : payment.amount, // ZMW as-is
        currency: data.currency || payment.currency,
        provider: data.type || payment.provider,
        recipientId: data.mobileMoneyDetails?.phone || payment.recipientId,
        webhookRaw: data,
      },
    });

    // Notify frontend via Redis
    await redisPublisher.publish(`payment:${reference}`, JSON.stringify({ status: statusUpdate }));

    return NextResponse.json({ success: true, updatedPayment });
  } catch (err: any) {
    console.error("Webhook processing failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
