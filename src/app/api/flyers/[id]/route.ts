// src/app/api/flyers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import { createHash } from "crypto";
import { getServerSession } from "next-auth/next";
import { getSignedUrlForKey } from "@/lib/s3Utils";

export async function GET(req: NextRequest, context: any ) {
  const params = await context.params;
  const flyerId = params.id as string;

  try {
    const flyer = await prisma.flyer.findUnique({
      where: { id: flyerId },
      include: { links: { include: { qr: true } } },
    });

    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    // Normalize the S3 keys to remove any leading slashes
    const flyerKey = flyer.cdnUrl?.replace(/^\/+/, "");
    const cdnUrl = flyerKey ? await getSignedUrlForKey(flyerKey) : null;

    const qr = flyer.links[0]?.qr;
    const qrKey = qr?.imageUrl?.replace(/^\/+/, "");
    const qrUrl = qrKey ? await getSignedUrlForKey(qrKey) : null;

    return NextResponse.json({
      id: flyer.id,
      title: flyer.title,
      description: flyer.description,
      assetType: flyer.assetType,
      cdnUrl,
      links: flyer.links.map((link) => ({
        id: link.id,
        slug: link.slug,
        qr: link.qr ? { ...link.qr, imageUrl: qrUrl } : null,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch flyer:", err);
    return NextResponse.json({ error: "Failed to fetch flyer" }, { status: 500 });
  }
}



// Optional: track views if you want POST /api/flyers/:id/track
export async function POST(req: NextRequest, context: any) {
 const params = await context.params;
  const flyerId = params.id as string;

  try {
    const flyer = await prisma.flyer.findUnique({
      where: { id: flyerId },
      include: { links: true },
    });
    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    // Track view for all links
    await Promise.all(
      flyer.links.map(async (link) => {
        const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const ipHash = createHash("sha256").update(rawIp).digest("hex");

        await prisma.shortLinkEvent.create({
          data: {
            tenantId: flyer.tenantId,
            shortLinkId: link.id,
            kind: ShortLinkEventKind.VIEW,
            ipHash,
            userAgent: req.headers.get("user-agent") ?? undefined,
            referrer: req.headers.get("referer") ?? undefined,
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
