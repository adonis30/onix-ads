// src/app/api/flyers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import { createHash } from "crypto";
import { getServerSession } from "next-auth/next";
import { getSignedUrlForKey } from "@/lib/s3Utils";


const deleteFromS3 = async (key: string) => {
  // Implement S3 deletion logic here if needed
  // For example, using AWS SDK's DeleteObjectCommand
}

export async function GET(req: NextRequest, context: any) {
  const { id } = await context.params;

  try {
    const flyer = await prisma.flyer.findUnique({
      where: { id },
      include: {
        campaign: { select: { isPaid: true, buyLink: true, name: true } },
        links: { include: { qr: true } },
      },
    });
    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    // Normalize keys -> signed URLs
    const flyerKey = flyer.cdnUrl?.replace(/^\//, "");
    const assetUrl = flyerKey ? await getSignedUrlForKey(flyerKey) : flyer.originalUrl;

    const links = await Promise.all(
      flyer.links.map(async (l) => {
        const qrKey = l.qr?.imageUrl?.replace(/^\//, "");
        const qrUrl = qrKey ? await getSignedUrlForKey(qrKey) : null;
        return { ...l, qr: l.qr ? { ...l.qr, imageUrl: qrUrl } : null };
      })
    );

    return NextResponse.json(
      {
        id: flyer.id,
        title: flyer.title,
        description: flyer.description,
        assetType: flyer.assetType,
        cdnUrl: assetUrl,
        links,
        campaign: {
          name: flyer.campaign?.name ?? flyer.title,
          isPaid: flyer.campaign?.isPaid ?? false,
          buyLink: flyer.campaign?.buyLink ?? null,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
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


export async function DELETE(req: NextRequest, context: any) {
  const { id } = await context.params as { id: string };

  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flyer = await prisma.flyer.findUnique({
      where: { id },
      include: { campaign: { select: { tenantId: true } } },
    });
    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    // Check if user belongs to the same tenant
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tenant: true },
    });
    if (!user || user.tenantId !== flyer.campaign?.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete related short links and events
    const linkIds = (await prisma.shortLink.findMany({
      where: { flyerId: flyer.id },
      select: { id: true },
    })).map(l => l.id);

    // Delete flyer from S3 if exists
    if (flyer.cdnUrl) {
      const flyerKey = flyer.cdnUrl.replace(/^\//, "");
      try {
        // Assuming you have a function to delete from S3
        await deleteFromS3(flyerKey);
      } catch (s3Err) {
        console.error("Failed to delete flyer from S3:", s3Err);
      }
    }
    if (linkIds.length > 0) {
      // Also delete associated QR codes from S3
      const qrs = await prisma.qRCode.findMany({
        where: { shortLinkId: { in: linkIds }, imageUrl: { not: undefined } },
        select: { imageUrl: true },
      });
      await Promise.all(qrs.map(async (qr) => {
        if (qr.imageUrl) {
          const qrKey = qr.imageUrl.replace(/^\//, "");
          try {
            await deleteFromS3(qrKey);
          } catch (s3Err) {
            console.error("Failed to delete QR code from S3:", s3Err);
          }
        }
      }));
    }

    await prisma.shortLinkEvent.deleteMany({ where: { shortLinkId: { in: linkIds } } });
    await prisma.shortLink.deleteMany({ where: { flyerId: flyer.id } });

    // Finally delete the flyer
    await prisma.flyer.delete({ where: { id: flyer.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete flyer:", err);
    return NextResponse.json({ error: "Failed to delete flyer" }, { status: 500 });
  }
}