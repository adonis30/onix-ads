// src/app/api/tenants/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const tenants = await prisma.tenant.findMany({
    include: { subscriptions: true, users: true },
  });
  return NextResponse.json(tenants);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, slug, plan, primaryColor, accentColor, logoUrl, domain } = body;

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      plan,
      primaryColor,
      accentColor,
      logoUrl,
      domain,
      subscriptions: {
        create: [{
          providerId: uuidv4(),
          stripeSubId: uuidv4(),
          plan,
          status: 'ACTIVE',
          startDate: new Date(),
        }],
      },
    },
  });

  return NextResponse.json(tenant, { status: 201 });
}
