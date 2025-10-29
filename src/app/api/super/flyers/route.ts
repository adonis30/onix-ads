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
      const campaignId = searchParams.get('campaignId');

      const where: any = {};
      if (tenantId) where.tenantId = tenantId;
      if (campaignId) where.campaignId = campaignId;

      const [flyers, total, stats] = await Promise.all([
        prisma.flyer.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            tenant: { select: { name: true, slug: true } },
            campaign: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.flyer.count({ where }),
        prisma.flyer.aggregate({
          _sum: { purchaseCount: true, priceCents: true },
          _count: true,
        }),
      ]);

      return NextResponse.json({
        flyers,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
        stats: {
          totalFlyers: stats._count,
          totalPurchases: stats._sum.purchaseCount || 0,
          totalRevenue: stats._sum.priceCents || 0,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch flyers' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);

// Delete flyer
export const DELETE = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      await prisma.flyer.delete({ where: { id: id! } });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete flyer' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);
