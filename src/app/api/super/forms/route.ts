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

      const where: any = {};
      if (tenantId) where.tenantId = tenantId;

      const [forms, total, stats] = await Promise.all([
        prisma.dynamicForm.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            tenant: { select: { name: true, slug: true } },
            _count: { select: { responses: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.dynamicForm.count({ where }),
        prisma.dynamicForm.aggregate({
          _sum: { submissions: true, visits: true },
          _count: true,
        }),
      ]);

      return NextResponse.json({
        forms,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
        stats: {
          totalForms: stats._count,
          totalSubmissions: stats._sum.submissions || 0,
          totalVisits: stats._sum.visits || 0,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);

// Delete form
export const DELETE = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      await prisma.dynamicForm.delete({ where: { id: id! } });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);
