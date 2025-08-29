import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import crypto from "node:crypto";
import { getSignedUrlForKey } from "@/lib/s3Utils";


export async function GET(req: NextRequest, context: any) {
  const params = context.params;
  const slugArray = params.slug as string[];
  const slug = slugArray.join("/");

  try {
    // Fetch the short link and related flyer
    const shortLink = await prisma.shortLink.findUnique({
      where: { slug },
      include: { flyer: { include: { links: { include: { qr: true } } } } },
    });

    if (!shortLink || !shortLink.flyer) {
      return NextResponse.json({ error: "Short link or flyer not found" }, { status: 404 });
    }

    const flyer = shortLink.flyer;

    // Log the SCAN event
    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");

    await prisma.shortLinkEvent.create({
      data: {
        tenantId: flyer.tenantId,
        shortLinkId: shortLink.id,
        kind: ShortLinkEventKind.SCAN,
        ipHash,
        userAgent: req.headers.get("user-agent") ?? undefined,
        referrer: req.headers.get("referer") ?? undefined,
      },
    });

    // Generate signed URLs
    const flyerKey = flyer.cdnUrl?.replace(/^\//, "");
    const cdnUrl = flyerKey ? await getSignedUrlForKey(flyerKey) : null;

    const qr = flyer.links[0]?.qr;
    const qrKey = qr?.imageUrl?.replace(/^\//, "");
    const qrUrl = qrKey ? await getSignedUrlForKey(qrKey) : null;

    // Return flyer data directly instead of redirecting
    return NextResponse.json({
      id: flyer.id,
      title: flyer.title,
      description: flyer.description,
      assetType: flyer.assetType,
      cdnUrl,
      qrCodeUrl: qrUrl,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to resolve short link" }, { status: 500 });
  }
}