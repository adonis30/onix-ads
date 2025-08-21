// src/app/api/flyers/[id]/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest, context: any) {
  const params = await context.params;
  const flyerId = params.id as string;

  try {
    const flyer = await prisma.flyer.findUnique({
      where: { id: flyerId },
      include: { links: true },
    });

    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    // Log view for each shortLink
    await Promise.all(
      flyer.links.map((link) =>
        prisma.shortLinkEvent.create({
          data: {
            tenantId: flyer.tenantId,
            shortLinkId: link.id,
            kind: "VIEW",
            ipHash: crypto
              .createHash("sha256")
              .update(
                req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
              )
              .digest("hex"),
            userAgent: req.headers.get("user-agent") ?? undefined,
            referrer: req.headers.get("referer") ?? undefined,
          },
        })
      )
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to log view" }, { status: 500 });
  }
}
