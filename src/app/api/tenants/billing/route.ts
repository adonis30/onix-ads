import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { tenantId } = user;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          subscriptions: {
            include: { histories: { orderBy: { createdAt: 'desc' }, take: 10 } },
          },
        },
      });

      const payments = await prisma.payment.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({
        currentPlan: tenant?.plan,
        stripeCustomerId: tenant?.stripeCustomerId,
        subscription: tenant?.subscriptions[0] || null,
        paymentHistory: payments,
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);

// Upgrade plan
export const POST = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { tenantId } = user;
      const { plan } = await req.json();

      // Update tenant plan
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { plan },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          action: 'TENANT_SUBSCRIPTION_UPDATE',
          metaJson: JSON.stringify({ newPlan: plan }),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to upgrade plan' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);
