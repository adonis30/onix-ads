import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const tenantId = searchParams.get('tenantId');
      const status = searchParams.get('status');

      const where: any = {};
      if (tenantId) where.tenantId = tenantId;
      if (status) where.status = status;

      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            tenant: { select: { name: true, slug: true } },
            _count: { select: { flyers: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.campaign.count({ where }),
      ]);

      return NextResponse.json({
        campaigns,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);

// Delete campaign
export const DELETE = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      await prisma.campaign.delete({ where: { id: id! } });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);
