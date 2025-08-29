// src/app/api/tenants/[tenantid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, context: any) {
  try {
    const tenantId = context.params.id as string;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscriptions: true, users: true },
    });

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: any) {
  try {
    const tenantId = context.params.id as string;
    const body = await req.json();
    const { name, slug, plan, primaryColor, accentColor, logoUrl, domain } = body;

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { name, slug, plan, primaryColor, accentColor, logoUrl, domain },
    });

    return NextResponse.json(updatedTenant);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  try {
    const tenantId = context.params.id as string;

    await prisma.tenant.delete({ where: { id: tenantId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
