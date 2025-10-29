"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  FileText,
  DollarSign,
  Activity,
  BarChart3,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Target,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DashboardData {
  overview: {
    campaigns: number;
    flyers: number;
    forms: number;
    totalRevenue: number;
    teamMembers: number;
    activeNotifications: number;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    budget: number;
    _count: { flyers: number };
    createdAt: string;
  }>;
  recentFlyers: Array<{
    id: string;
    title: string;
    isFree: boolean;
    priceCents: number;
    purchaseCount: number;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: { name: string | null; email: string };
  }>;
  topPerformers: Array<{
    id: string;
    title: string;
    revenue: number;
    purchases: number;
  }>;
}

export default function TenantDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/tenants/analytics');
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const result = await res.json();
      
      // Ensure data structure has all required fields
      const normalizedData: DashboardData = {
        overview: result.overview || {
          campaigns: 0,
          flyers: 0,
          forms: 0,
          totalRevenue: 0,
          teamMembers: 0,
          activeNotifications: 0,
        },
        recentCampaigns: result.recentCampaigns || [],
        recentFlyers: result.recentFlyers || [],
        recentActivity: result.recentActivity || [],
        topPerformers: result.topPerformers || [],
      };
      
      setData(normalizedData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set empty data structure to prevent errors
      setData({
        overview: {
          campaigns: 0,
          flyers: 0,
          forms: 0,
          totalRevenue: 0,
          teamMembers: 0,
          activeNotifications: 0,
        },
        recentCampaigns: [],
        recentFlyers: [],
        recentActivity: [],
        topPerformers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.overview) {
    return <div className="p-6 text-center">Failed to load dashboard data</div>;
  }

  const stats = [
    {
      title: "Active Campaigns",
      value: data.overview?.campaigns || 0,
      icon: Target,
      trend: "+12%",
      trendUp: true,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      link: "/campaigns",
    },
    {
      title: "Total Flyers",
      value: data.overview?.flyers || 0,
      icon: FileText,
      trend: "+8%",
      trendUp: true,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      link: "/flyers",
    },
    {
      title: "Dynamic Forms",
      value: data.overview?.forms || 0,
      icon: BarChart3,
      trend: "+5%",
      trendUp: true,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      link: "/forms",
    },
    {
      title: "Total Revenue",
      value: `$${((data.overview?.totalRevenue || 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      trend: "+23%",
      trendUp: true,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      link: "/billing",
    },
    {
      title: "Team Members",
      value: data.overview?.teamMembers || 0,
      icon: Users,
      trend: "+2",
      trendUp: true,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      link: "/team",
    },
    {
      title: "Notifications",
      value: data.overview?.activeNotifications || 0,
      icon: Activity,
      trend: "3 new",
      trendUp: false,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      link: "/notifications",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500';
      case 'DRAFT':
        return 'bg-gray-500/10 text-gray-500';
      case 'PAUSED':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0] || "User"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your campaigns today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/campaigns/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
          <Button variant="outline" onClick={() => router.push('/reports')} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trendUp ? ArrowUpRight : ArrowDownRight;
          return (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => router.push(stat.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendIcon
                    className={`h-4 w-4 ${
                      stat.trendUp ? 'text-green-500' : 'text-muted-foreground'
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">
                    <span className={stat.trendUp ? 'text-green-500' : 'text-muted-foreground'}>
                      {stat.trend}
                    </span>{' '}
                    from last month
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Campaigns */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Your latest marketing campaigns</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/campaigns')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!data.recentCampaigns || data.recentCampaigns?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push('/campaigns/new')}
                >
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentCampaigns?.slice(0, 5).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{campaign.name}</p>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {campaign._count.flyers} flyers
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${(campaign.budget / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Flyers */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Flyers</CardTitle>
                <CardDescription>Best sellers this month</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/flyers')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!data.topPerformers || data.topPerformers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sales data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.topPerformers?.slice(0, 5).map((flyer, index) => (
                  <div key={flyer.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{flyer.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {flyer.purchases} purchases
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">
                          ${(flyer.revenue / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">revenue</p>
                      </div>
                    </div>
                    <Progress value={(flyer.revenue / (data.topPerformers?.[0]?.revenue || 1)) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data.recentActivity || data.recentActivity?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentActivity?.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.user.name || activity.user.email}
                        </span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => router.push('/campaigns/new')}
              >
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => router.push('/flyers/new')}
              >
                <FileText className="h-4 w-4" />
                Create Flyer
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => router.push('/forms/new')}
              >
                <BarChart3 className="h-4 w-4" />
                New Form
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => router.push('/team')}
              >
                <Users className="h-4 w-4" />
                Manage Team
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => router.push('/settings')}
              >
                <Calendar className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
