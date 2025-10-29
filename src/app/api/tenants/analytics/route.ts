// src/app/api/tenants/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const { tenantId } = user;

      // Get counts and data
      const [
        campaignsCount,
        flyersCount,
        formsCount,
        shortLinksCount,
        totalFormSubmissions,
        totalFormVisits,
        recentPayments,
        shortLinkEvents,
        teamMembersCount,
        unreadNotificationsCount,
        recentCampaigns,
      ] = await Promise.all([
        // Campaigns
        prisma.campaign.count({ where: { tenantId } }),
        
        // Flyers
        prisma.flyer.count({ where: { tenantId } }),
        
        // Forms
        prisma.dynamicForm.count({ where: { tenantId } }),
        
        // Short Links
        prisma.shortLink.count({ where: { tenantId } }),
        
        // Form Submissions
        prisma.dynamicForm.aggregate({
          where: { tenantId },
          _sum: { submissions: true },
        }),
        
        // Form Visits
        prisma.dynamicForm.aggregate({
          where: { tenantId },
          _sum: { visits: true },
        }),
        
        // Recent Payments
        prisma.payment.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            type: true,
          },
        }),
        
        // Short Link Events (last 30 days)
        prisma.shortLinkEvent.groupBy({
          by: ['kind'],
          where: {
            tenantId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _count: true,
        }),
        
        // Team Members Count
        prisma.membership.count({ where: { tenantId } }),
        
        // Unread Notifications Count
        prisma.notification.count({
          where: { tenantId, read: false },
        }),
        
        // Recent Campaigns
        prisma.campaign.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            _count: { select: { flyers: true } },
          },
        }),
      ]);

      // Get top performing flyers with revenue calculation
      const topFlyers = await prisma.flyer.findMany({
        where: { tenantId },
        orderBy: { purchaseCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          purchaseCount: true,
          priceCents: true,
          isFree: true,
          campaign: { select: { name: true } },
        },
      });
      
      // Calculate revenue for each flyer
      const topPerformers = topFlyers.map((flyer) => ({
        id: flyer.id,
        title: flyer.title,
        purchases: flyer.purchaseCount,
        revenue: flyer.isFree ? 0 : (flyer.priceCents || 0) * flyer.purchaseCount,
      }));

      // Get recent activities (audit logs)
      const recentActivities = await prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { name: true, email: true } },
        },
      });

      // Revenue calculation
      const totalRevenue = recentPayments
        .filter((p) => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0);

      // Form conversion rate
      const conversionRate =
        totalFormVisits._sum.visits && totalFormVisits._sum.visits > 0
          ? (
              ((totalFormSubmissions._sum.submissions || 0) /
                totalFormVisits._sum.visits) *
              100
            ).toFixed(2)
          : '0';

      return NextResponse.json({
        overview: {
          campaigns: campaignsCount,
          flyers: flyersCount,
          forms: formsCount,
          shortLinks: shortLinksCount,
          formSubmissions: totalFormSubmissions._sum.submissions || 0,
          formVisits: totalFormVisits._sum.visits || 0,
          conversionRate,
          totalRevenue,
          teamMembers: teamMembersCount,
          activeNotifications: unreadNotificationsCount,
        },
        recentCampaigns: recentCampaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          budget: campaign.budget,
          _count: campaign._count,
          createdAt: campaign.createdAt,
        })),
        topPerformers,
        shortLinkEvents: shortLinkEvents.map((e) => ({
          type: e.kind,
          count: e._count,
        })),
        topFlyers,
        recentPayments,
        recentActivity: recentActivities.map((log) => ({
          id: log.id,
          action: log.action,
          timestamp: log.createdAt,
          user: {
            name: log.user?.name || null,
            email: log.user?.email || 'system@onixads.com',
          },
        })),
      });
    } catch (error: any) {
      console.error('[Analytics] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }
  },
  ['TENANT_ADMIN', 'EDITOR', 'VIEWER', 'SUPER_ADMIN']
);
