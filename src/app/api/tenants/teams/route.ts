import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const memberships = await prisma.membership.findMany({
        where: { tenantId: user.tenantId },
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ members: memberships });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'EDITOR', 'VIEWER', 'SUPER_ADMIN']
);

// Invite member
export const POST = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { email, role } = await req.json();

      // Check if user exists
      let targetUser = await prisma.user.findUnique({ where: { email } });

      if (!targetUser) {
        // Create new user
        targetUser = await prisma.user.create({
          data: {
            email,
            role: role || 'VIEWER',
            tenantId: user.tenantId,
          },
        });
      }

      // Create membership
      const membership = await prisma.membership.create({
        data: {
          userId: targetUser.id,
          tenantId: user.tenantId,
          role: role || 'VIEWER',
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          action: 'USER_INVITE',
          metaJson: JSON.stringify({ email, role }),
        },
      });

      return NextResponse.json({ success: true, membership });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);

// Update member role
export const PATCH = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { membershipId, role } = await req.json();

      await prisma.membership.update({
        where: { id: membershipId },
        data: { role },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);

// Remove member
export const DELETE = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      await prisma.membership.delete({ where: { id: id! } });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);
