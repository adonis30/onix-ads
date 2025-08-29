// src/app/api/tenants/short-links/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const shortLinks = await prisma.shortLink.findMany({
    include: { flyer: true },
  });
  return NextResponse.json(shortLinks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { flyerId, slug, targetPath } = body;

  const shortLink = await prisma.shortLink.create({
    data: { flyerId, slug, targetPath, tenantId: 'tenant_placeholder' },
  });

  return NextResponse.json(shortLink, { status: 201 });
}
