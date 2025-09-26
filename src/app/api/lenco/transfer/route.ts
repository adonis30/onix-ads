// src/app/api/lenco/transfer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { lenco } from "@/lib/lencoClient";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const transfer = await lenco.createTransfer({
      amount: body.amount,
      phone: body.phone,
      operator: body.operator,
      reason: body.reason,
      reference: body.reference,
      currency: "ZMW",
    });

    // Record payment in DB
    await prisma.payment.create({
      data: {
        tenantId: "default-tenant", // TODO: resolve tenant
        accountId: transfer.data.account_id,
        reference: transfer.data.reference,
        amount: transfer.data.amount,
        currency: transfer.data.currency,
        type: "TRANSFER",
        status: "PENDING",
        reason: body.reason,
        recipientId: body.recipient,
      },
    });

    return NextResponse.json(transfer.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
