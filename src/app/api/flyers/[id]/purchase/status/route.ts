// src/app/api/flyers/[id]/purchase/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { lenco } from "@/lib/lencoClient";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.json({ status: "INVALID_REFERENCE" }, { status: 400 });

  const sessionRaw = await redis.get(`payment:${reference}`);
  if (!sessionRaw) return NextResponse.json({ status: "NOT_FOUND" });

  const session = JSON.parse(sessionRaw);

  // Query Lenco if payment is still pending
  if (["PENDING", "OTP-REQUIRED", "PAY-OFFLINE"].includes(session.status)) {
    const lencoStatus = await lenco.getCollectionStatus(reference);
    const status = lencoStatus.data.status.toUpperCase();

    if (status !== session.status) {
      session.status = status;
      await redis.set(`payment:${reference}`, JSON.stringify(session), "EX", 900);
      await prisma.payment.update({ where: { reference }, data: { status } });
    }
  }

  return NextResponse.json({ status: session.status });
}
