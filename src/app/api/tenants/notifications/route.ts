import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const unreadOnly = searchParams.get('unreadOnly') === 'true';

      const where: any = { tenantId: user.tenantId };
      if (unreadOnly) {
        where.read = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const unreadCount = await prisma.notification.count({
        where: { tenantId: user.tenantId, read: false },
      });

      return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'EDITOR', 'VIEWER', 'SUPER_ADMIN']
);

// Mark as read
export const PATCH = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { notificationId, markAllRead } = await req.json();

      if (markAllRead) {
        await prisma.notification.updateMany({
          where: { tenantId: user.tenantId, read: false },
          data: { read: true },
        });
      } else if (notificationId) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { read: true },
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'EDITOR', 'VIEWER', 'SUPER_ADMIN']
);

// Create notification (admin only)
export const POST = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { title, message, type } = await req.json();

      const notification = await prisma.notification.create({
        data: {
          tenantId: user.tenantId,
          title,
          message,
          type: type || 'INFO',
        },
      });

      return NextResponse.json(notification);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);
