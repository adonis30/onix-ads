"use client";

import React, { Suspense } from "react";
import { getServerSession } from "next-auth";
import { apiFetchJson } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import CardContent from "@mui/material/CardContent";
import { cn } from "@/lib/utils";

type StatValue = number | null;

export interface ModuleStats {
  visits: StatValue;
  submissions?: StatValue;
  conversionRate?: StatValue;
  bounceRate?: StatValue;
  downloads?: StatValue;
  views?: StatValue;
  clicks?: StatValue;
}

interface ModuleStatsWrapperProps {
  module: "forms" | "flyers" | "campaigns";
  title?: string;
  iconMap?: Record<string, React.ReactNode>;
}

/**
 * Generic reusable wrapper for module statistics (Forms, Flyers, Campaigns)
 */
export async function ModuleStatsWrapper({
  module,
  title = "Overview",
  iconMap,
}: ModuleStatsWrapperProps) {
  const session = await getServerSession();

  console.log(`[${module.toUpperCase()} Stats] Session:`, session?.user);

  if (!session?.user?.tenantId || !session?.user?.role) {
    console.error(`[${module.toUpperCase()} Stats] Missing tenantId or role`);
    return <StatsSkeleton />;
  }

  try {
    const stats = await apiFetchJson<ModuleStats>(
      `/api/tenants/${module}/stats`,
      {},
      session
    );


    // ✅ Apply fallback 0 for missing values
    const safeStats = Object.fromEntries(
      Object.entries(stats).map(([k, v]) => [k, v ?? 0])
    ) as ModuleStats;

    return (
      <>
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <Separator className="my-4" />
        <StatsCards stats={safeStats} iconMap={iconMap} />
      </>
    );
  } catch (error: any) {
    console.error(`[${module.toUpperCase()} Stats] Failed to load:`, error.message);
    return <StatsSkeleton />;
  }
}

// -----------------------------
// STAT CARDS COMPONENT
// -----------------------------
function StatsCards({
  stats,
  iconMap = {},
}: {
  stats: ModuleStats;
  iconMap?: Record<string, React.ReactNode>;
}) {
  const cards = Object.entries(stats).map(([key, value]) => ({
    title: key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase()), // prettify keys
    value: typeof value === "number" ? value.toString() : "0",
    helperText: key,
    icon: iconMap[key],
  }));

  return (
    <div className="w-full pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="p-4 shadow-md shadow-slate-100/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground pt-1">
              {card.helperText}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// -----------------------------
// FALLBACK LOADING STATE
// -----------------------------
function StatsSkeleton() {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-lg" />
      ))}
    </div>
  );
}
