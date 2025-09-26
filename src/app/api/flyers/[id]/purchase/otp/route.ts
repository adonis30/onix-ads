// src/app/api/flyers/[id]/purchase/otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { lenco } from "@/lib/lencoClient";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { reference, otp } = await req.json();

    // Retrieve payment info from Redis
    const paymentDataRaw = await redis.get(`payment:${reference}`);
    if (!paymentDataRaw) {
      return NextResponse.json({ error: "Payment session expired" }, { status: 404 });
    }
    const paymentData = JSON.parse(paymentDataRaw);

    // Submit OTP to Lenco
    const res = await lenco.submitOtp({ reference, otp }); // You need to implement submitOtp in lencoClient

    // Update payment status
    const status = res.data.status === "successful" ? "SUCCESS" : res.data.status.toUpperCase();
    await prisma.payment.update({
      where: { reference },
      data: { status, webhookRaw: res.data },
    });

    // Update Redis
    await redis.set(`payment:${reference}`, JSON.stringify({ ...paymentData, status }), "EX", 3600);

    return NextResponse.json({ status, message: res.data.status });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
