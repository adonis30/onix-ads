import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import { createHash } from "crypto";
import { getServerSession } from "next-auth/next";
import { getSignedUrlForKey, deleteFromS3, getS3Metadata } from "@/lib/s3Utils";

// GET /api/flyers/:id
export async function GET(req: NextRequest, context: any) {
  const { id } = await context.params;

  try {
    const session = await getServerSession();
    const purchaseToken =
      req.cookies.get("purchaseToken")?.value ||
      req.headers.get("x-purchase-token");

    const flyer = await prisma.flyer.findUnique({
      where: { id },
      include: { campaign: true, links: { include: { qr: true } } },
    });

    if (!flyer)
      return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    const requiresPayment = !flyer.isFree || flyer.campaign?.isPaid;

    const cdnUrl = flyer.cdnUrl
      ? await getSignedUrlForKey(flyer.cdnUrl.replace(/^\//, ""), flyer.assetType)
      : null;

    const coverUrl = flyer.coverUrl
      ? await getSignedUrlForKey(flyer.coverUrl.replace(/^\//, ""), "IMAGE")
      : null;

    let unlocked = false;
    let displayUrl: string | null = null;

    if (requiresPayment) {
      // Check if user has purchased
      let hasPayment = false;

      if (session?.user?.tenantId) {
        const payment = await prisma.payment.findFirst({
          where: {
            flyerId: flyer.id,
            tenantId: session.user.tenantId,
            status: "SUCCESS",
          },
        });
        hasPayment = !!payment;
      } else if (purchaseToken) {
        const guestPayment = await prisma.payment.findFirst({
          where: {
            flyerId: flyer.id,
            purchaseToken,
            status: "SUCCESS",
          },
        });
        hasPayment = !!guestPayment;
      }

      if (hasPayment) {
        unlocked = true;
        displayUrl = cdnUrl;
      } else {
        unlocked = false;
        displayUrl = coverUrl;
      }

    } else {
      // Free flyers are unlocked by default
      unlocked = true;
      displayUrl = cdnUrl;
    }

    // ✅ Check PDF metadata (optional log only)
    if (flyer.assetType === "PDF" && flyer.cdnUrl) {
      const metadata = await getS3Metadata(flyer.cdnUrl);
      if (metadata?.contentDisposition !== "inline") {
        console.warn(
          `PDF ${flyer.cdnUrl} is not inline (disposition: ${metadata?.contentDisposition})`
        );
      }else {
        console.log(`PDF ${flyer.cdnUrl} ${metadata?.contentDisposition} has correct inline disposition`);
      }
    }

    const links = await Promise.all(
      flyer.links.map(async (l) => {
        const qrUrl = l.qr?.imageUrl
          ? await getSignedUrlForKey(l.qr.imageUrl.replace(/^\//, ""))
          : null;
        return { ...l, qr: l.qr ? { ...l.qr, imageUrl: qrUrl } : null };
      })
    );

    return NextResponse.json(
      {
        id: flyer.id,
        title: flyer.title,
        description: flyer.description,
        assetType: flyer.assetType,
        cdnUrl,
        coverUrl,
        displayUrl,
        unlocked,
        links,
        campaign: {
          name: flyer.campaign?.name ?? flyer.title,
          isPaid: requiresPayment,
          priceCents: flyer.priceCents ?? flyer.campaign?.priceCents,
          currency: flyer.currency ?? flyer.campaign?.currency,
          buyLink: flyer.buyLink ?? flyer.campaign?.buyLink,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("GET /flyers/:id error:", e);
    return NextResponse.json(
      { error: "Failed to fetch flyer", details: (e as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/flyers/:id/track
export async function POST(req: NextRequest, context: any) {
  const { id: flyerId } = context.params;

  try {
    const flyer = await prisma.flyer.findUnique({
      where: { id: flyerId },
      include: { links: true },
    });
    if (!flyer)
      return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    const rawIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}

// DELETE /api/flyers/:id
export async function DELETE(req: NextRequest, context: any) {
  const { id } = context.params as { id: string };

  try {
    const session = await getServerSession();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flyer = await prisma.flyer.findUnique({
      where: { id },
      include: { campaign: { select: { tenantId: true } } },
    });
    if (!flyer)
      return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

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

    // Delete flyer + QR assets
    if (flyer.cdnUrl) await deleteFromS3(flyer.cdnUrl);
    if (linkIds.length > 0) {
      const qrs = await prisma.qRCode.findMany({
        where: { shortLinkId: { in: linkIds } },
        select: { imageUrl: true },
      });
      await Promise.all(
        qrs.map((qr) => (qr.imageUrl ? deleteFromS3(qr.imageUrl) : null))
      );
    }

    await prisma.shortLinkEvent.deleteMany({
      where: { shortLinkId: { in: linkIds } },
    });
    await prisma.shortLink.deleteMany({ where: { flyerId: flyer.id } });
    await prisma.flyer.delete({ where: { id: flyer.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete flyer:", err);
    return NextResponse.json(
      { error: "Failed to delete flyer" },
      { status: 500 }
    );
  }
}
