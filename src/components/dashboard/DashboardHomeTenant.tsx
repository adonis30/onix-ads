"use client";

import { useSession } from "next-auth/react";
import {
  Users,
  Briefcase,
  DollarSign,
  UserPlus,
  Activity,
} from "lucide-react";
import clsx from "clsx";
import { UserRole } from "@prisma/client";

interface DashboardHomeTenantProps {
  tenantId: string;
}

export default function DashboardHome() {
  const { data: session } = useSession();

  // Define stats for each role
  const superAdminStats = [
    { title: "Total Users", value: "1,254", change: "+8%", icon: Users, iconColor: "text-blue-400" },
    { title: "Active Projects", value: "42", change: "+2%", icon: Briefcase, iconColor: "text-purple-400" },
    { title: "Revenue", value: "$12,480", change: "+5%", icon: DollarSign, iconColor: "text-green-400" },
    { title: "New Signups", value: "128", change: "+12%", icon: UserPlus, iconColor: "text-yellow-400" },
  ];

  const tenantStats = [
    { title: "Active Campaigns", value: "12", change: "+3%", icon: Briefcase, iconColor: "text-purple-400" },
    { title: "Total Flyers", value: "56", change: "+7%", icon: UserPlus, iconColor: "text-yellow-400" },
    { title: "Revenue", value: "$4,320", change: "+5%", icon: DollarSign, iconColor: "text-green-400" },
  ];

  const activities = session?.user?.role === UserRole.SUPER_ADMIN
    ? [
        "User John Doe signed up",
        "Project Alpha updated",
        "New payment received from ClientX",
        "Tenant Beta added 3 new members",
      ]
    : [
        "Campaign Summer Sale created",
        "Flyer Flyer123 updated",
        "Team member added: Alice",
      ];

  const stats = session?.user?.role === UserRole.SUPER_ADMIN ? superAdminStats : tenantStats;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {session?.user?.name || "Admin"} 👋
        </h1>
        <p className="text-gray-400">
          Here’s a quick overview of your platform today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg hover:shadow-gray-700 transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-400">{stat.title}</h2>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <span className={clsx("text-sm", stat.change.startsWith("+") ? "text-green-400" : "text-red-400")}>
                    {stat.change}
                  </span>
                </div>
                <div className={`p-3 rounded-full bg-gray-700 ${stat.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        </div>
        <ul className="divide-y divide-gray-700">
          {activities.map((activity, idx) => (
            <li key={idx} className="py-3 text-gray-300">
              {activity}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
