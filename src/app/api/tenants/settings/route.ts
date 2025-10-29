import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        include: {
          webhooks: true,
          apiKeys: { select: { id: true, name: true, createdAt: true, lastUsed: true } },
        },
      });

      return NextResponse.json(tenant);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);

export const PATCH = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const data = await req.json();
      const { primaryColor, accentColor, logoUrl, domain } = data;

      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { primaryColor, accentColor, logoUrl, domain },
      });

      await prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          action: 'TENANT_SETTINGS_UPDATE',
          metaJson: JSON.stringify(data),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);
