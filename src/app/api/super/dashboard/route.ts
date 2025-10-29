import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const [
        totalTenants,
        totalUsers,
        totalCampaigns,
        totalFlyers,
        totalForms,
        totalRevenue,
        recentTenants,
        planDistribution,
      ] = await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.campaign.count(),
        prisma.flyer.count(),
        prisma.dynamicForm.count(),
        prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        prisma.tenant.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            _count: {
              select: { campaigns: true, flyers: true, forms: true },
            },
          },
        }),
        prisma.tenant.groupBy({
          by: ['plan'],
          _count: true,
        }),
      ]);

      return NextResponse.json({
        overview: {
          totalTenants,
          totalUsers,
          totalCampaigns,
          totalFlyers,
          totalForms,
          totalRevenue: totalRevenue._sum.amount || 0,
        },
        recentTenants,
        planDistribution,
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);
