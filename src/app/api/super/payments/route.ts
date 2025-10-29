import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const status = searchParams.get('status');
      const tenantId = searchParams.get('tenantId');

      const where: any = {};
      if (status) where.status = status;
      if (tenantId) where.tenantId = tenantId;

      const [payments, total, stats] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            tenant: { select: { name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.payment.count({ where }),
        prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      return NextResponse.json({
        payments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
        stats: {
          totalRevenue: stats._sum.amount || 0,
          completedPayments: stats._count,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);
