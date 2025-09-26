// src/app/api/lenco/balance/route.ts
import { NextResponse } from "next/server";
import { lenco } from "@/lib/lencoClient";

export async function GET() {
  try {
    const accounts = await lenco.getAccounts();
    const accountId = accounts.data[0].id; // pick first account
    const balance = await lenco.getBalance(accountId);

    return NextResponse.json(balance.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
