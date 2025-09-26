import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

/**
 * Normalize Lenco payment status to internal enum values
 */
function normalizeStatus(lencoStatus: string): "PENDING" | "SUCCESS" | "FAILED" {
  switch (lencoStatus?.toLowerCase()) {
    case "successful":
    case "success":
      return "SUCCESS";
    case "failed":
    case "cancelled":
    case "reversed":
      return "FAILED";
    default:
      return "PENDING"; // e.g. "pay-offline", "processing", etc.
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("📩 Lenco webhook received:", JSON.stringify(payload, null, 2));

    // ✅ Make sure payload structure matches Lenco's
    const data = payload?.data;
    if (!data || !data.reference) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const reference = data.reference;
    const normalizedStatus = normalizeStatus(data.status);

    // 1️⃣ Find payment by reference
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) {
      console.warn(`⚠️ Payment not found for reference: ${reference}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // 2️⃣ Update Redis cache (for frontend streaming or polling)
    await redis.set(`payment_status:${reference}`, normalizedStatus, "EX", 60 * 60);

    // 3️⃣ Update database
    if (normalizedStatus === "SUCCESS" && payment.flyerId) {
      // ✅ Payment success: mark as successful & increment flyer purchase count
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: normalizedStatus,
            webhookRaw: payload,
            completedAt: new Date(),
          },
        }),
        prisma.flyer.update({
          where: { id: payment.flyerId },
          data: { purchaseCount: { increment: 1 } },
        }),
      ]);
    } else {
      // 🟡 Payment pending or failed: just update status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: normalizedStatus,
          webhookRaw: payload,
        },
      });
    }

    console.log(`✅ Webhook processed for ${reference} with status: ${normalizedStatus}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
