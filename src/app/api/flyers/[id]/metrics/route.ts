import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";

export async function GET(_req: NextRequest, context: any) {
  const { id } = await context.params as { id: string };

  try {
    // Ensure flyer exists & get all related short link IDs
    const flyer = await prisma.flyer.findUnique({
      where: { id },
      include: { links: { select: { id: true } } },
    });
    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    const linkIds = flyer.links.map(l => l.id);
    if (linkIds.length === 0) {
      return NextResponse.json({
        totals: { views: 0, scans: 0, downloads: 0 },
        series: [],
      });
    }

    // Totals
    const [views, scans, downloads] = await Promise.all([
      prisma.shortLinkEvent.count({ where: { shortLinkId: { in: linkIds }, kind: ShortLinkEventKind.VIEW } }),
      prisma.shortLinkEvent.count({ where: { shortLinkId: { in: linkIds }, kind: ShortLinkEventKind.SCAN } }),
      prisma.shortLinkEvent.count({ where: { shortLinkId: { in: linkIds }, kind: ShortLinkEventKind.DOWNLOAD } }),
    ]);

    // Last 30 days series by day & kind
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const grouped = await prisma.shortLinkEvent.groupBy({
      by: ["kind"],
      where: { shortLinkId: { in: linkIds }, createdAt: { gte: since } },
      _count: { _all: true },
    });

    return NextResponse.json({
      totals: { views, scans, downloads },
      series: grouped.map(g => ({ kind: g.kind, count: g._count._all })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
