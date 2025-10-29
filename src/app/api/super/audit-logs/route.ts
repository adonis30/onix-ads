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
      const action = searchParams.get('action');

      const where: any = {};
      if (tenantId) where.tenantId = tenantId;
      if (action) where.action = action;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            tenant: { select: { name: true } },
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return NextResponse.json({
        logs: logs.map((log) => ({
          ...log,
          metadata: log.metaJson ? JSON.parse(log.metaJson) : null,
        })),
        pagination: { total, page, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
  },
  ['SUPER_ADMIN']
);
