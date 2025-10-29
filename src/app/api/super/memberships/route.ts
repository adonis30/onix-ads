import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const tenantId = searchParams.get('tenantId');
      const role = searchParams.get('role');

      const where: any = {};
      if (tenantId) where.tenantId = tenantId;
      if (role) where.role = role;

      const [memberships, total] = await Promise.all([
        prisma.membership.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
            tenant: { select: { name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.membership.count({ where }),
      ]);

      return NextResponse.json({
        memberships,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);

// Delete membership
export const DELETE = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      await prisma.membership.delete({ where: { id: id! } });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete membership' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);
