import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import { createHash } from "crypto";

export async function POST(req: NextRequest, context: any) {
  const { id: flyerId } = await context.params;

  try {
    const flyer = await prisma.flyer.findUnique({
      where: { id: flyerId },
      include: { links: true },
    });
    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = createHash("sha256").update(rawIp).digest("hex");
    const userAgent = req.headers.get("user-agent") ?? "";
    const referrer = req.headers.get("referer") ?? undefined;

    await Promise.all(
      flyer.links.map(async (link) => {
        await prisma.shortLinkEvent.upsert({
          where: {
            shortLinkId_kind_ipHash_userAgent: {
              shortLinkId: link.id,
              kind: ShortLinkEventKind.VIEW,
              ipHash,
              userAgent,
            },
          },
          update: {},
          create: {
            tenantId: flyer.tenantId,
            shortLinkId: link.id,
            kind: ShortLinkEventKind.VIEW,
            ipHash,
            userAgent,
            referrer,
          },
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to track flyer view:", err);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
