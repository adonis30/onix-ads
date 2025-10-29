import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';
import crypto from 'crypto';

export const POST = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { name } = await req.json();
      
      // Generate API key
      const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
      const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

      const created = await prisma.apiKey.create({
        data: {
          tenantId: user.tenantId,
          name,
          hash,
        },
      });

      return NextResponse.json({ apiKey, id: created.id });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);

export const DELETE = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      await prisma.apiKey.deleteMany({
        where: { id: id!, tenantId: user.tenantId },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);
