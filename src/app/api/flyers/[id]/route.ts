import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import { createHash } from "crypto";
import { getServerSession } from "next-auth/next";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Delete file from S3 */
const deleteFromS3 = async (key: string) => {
  const s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_KEY!,
      secretAccessKey: process.env.S3_SECRET!,
    },
  });
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key.replace(/^\//, ""),
  });
  await s3.send(command);
};

/** Get signed URL for preview */
const getSignedUrlForKeySafe = async (key: string, assetType?: string) => {
  const s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_KEY!,
      secretAccessKey: process.env.S3_SECRET!,
    },
  });

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ResponseContentDisposition: assetType === "PDF" ? "inline" : undefined,
    ResponseContentType:
      assetType === "PDF"
        ? "application/pdf"
        : assetType === "IMAGE"
        ? "image/jpeg"
        : assetType === "VIDEO"
        ? "video/mp4"
        : undefined,
  });

  return await getSignedUrl(s3, command, { expiresIn: 3600 });
};

// GET /api/flyers/:id
export async function GET(req: NextRequest, context: any) {
  const { id } = await context.params;

  try {
    const flyer = await prisma.flyer.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            isPaid: true,
            priceCents: true,
            currency: true,
            buyLink: true,
            name: true,
          },
        },
        links: { include: { qr: true } },
      },
    });

    if (!flyer) {
      return NextResponse.json({ error: "Flyer not found" }, { status: 404 });
    }

    // ✅ Paid if campaign isPaid OR flyer.isFree === false
    const isPaid = (flyer.campaign?.isPaid ?? false) || flyer.isFree === false;

    let assetUrl: string | null = flyer.originalUrl;

    if (!isPaid) {
      // Free → serve full content
      const flyerKey = flyer.cdnUrl?.replace(/^\//, "");
      assetUrl = flyerKey
        ? await getSignedUrlForKeySafe(flyerKey, flyer.assetType)
        : flyer.originalUrl;
    } else {
      // Paid → only show cover
      assetUrl = flyer.coverUrl || null;
    }

    const links = await Promise.all(
      flyer.links.map(async (l) => {
        const qrKey = l.qr?.imageUrl?.replace(/^\//, "");
        const qrUrl = qrKey ? await getSignedUrlForKeySafe(qrKey) : null;
        return {
          ...l,
          qr: l.qr ? { ...l.qr, imageUrl: qrUrl } : null,
        };
      })
    );

    return NextResponse.json(
      {
        id: flyer.id,
        title: flyer.title,
        description: flyer.description,
        assetType: flyer.assetType,
        cdnUrl: assetUrl,
        coverUrl: flyer.coverUrl,
        links,
        campaign: {
          name: flyer.campaign?.name ?? flyer.title,
          isPaid,
          priceCents: flyer.priceCents ?? flyer.campaign?.priceCents,
          currency: flyer.currency ?? flyer.campaign?.currency,
          buyLink: flyer.buyLink ?? flyer.campaign?.buyLink,
        },
        isPaid, // ✅ expose top-level
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch flyer" },
      { status: 500 }
    );
  }
}

// POST /api/flyers/:id/track
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

// DELETE /api/flyers/:id
export async function DELETE(req: NextRequest, context: any) {
  const { id } = await context.params as { id: string };

  try {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flyer = await prisma.flyer.findUnique({
      where: { id },
      include: { campaign: { select: { tenantId: true } } },
    });
    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user || user.tenantId !== flyer.campaign?.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const linkIds = (
      await prisma.shortLink.findMany({
        where: { flyerId: flyer.id },
        select: { id: true },
      })
    ).map((l) => l.id);

    // Delete flyer from S3
    if (flyer.cdnUrl) {
      const flyerKey = flyer.cdnUrl.replace(/^\//, "");
      await deleteFromS3(flyerKey).catch(console.error);
    }

    // Delete QR codes from S3
    if (linkIds.length > 0) {
      const qrs = await prisma.qRCode.findMany({
        where: { shortLinkId: { in: linkIds }, imageUrl: { not: undefined } },
        select: { imageUrl: true },
      });
      await Promise.all(
        qrs.map(async (qr) => {
          if (qr.imageUrl)
            await deleteFromS3(qr.imageUrl.replace(/^\//, "")).catch(console.error);
        })
      );
    }

    await prisma.shortLinkEvent.deleteMany({ where: { shortLinkId: { in: linkIds } } });
    await prisma.shortLink.deleteMany({ where: { flyerId: flyer.id } });
    await prisma.flyer.delete({ where: { id: flyer.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete flyer:", err);
    return NextResponse.json({ error: "Failed to delete flyer" }, { status: 500 });
  }
}
