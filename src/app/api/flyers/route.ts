// src/app/api/flyers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import sizeOf from "image-size";
import QRCode from "qrcode";
import { uploadToS3, getSignedUrlForKey } from "@/lib/s3Utils";

export const config = { api: { bodyParser: false } };

// ---------------- POST: Upload flyer ----------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();

    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const assetType = formData.get("assetType")?.toString() || "";
    const campaignId = formData.get("campaignId")?.toString() || "";
    const isFree = formData.get("isFree")?.toString() === "true";
    const price = !isFree && formData.get("price") ? parseFloat(formData.get("price")!.toString()) : null;
    const currency = !isFree ? formData.get("currency")?.toString() || "ZMW" : null;

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: session.user.tenantId },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    // --- Collect uploaded files ---
    let flyerFile: File | null = null;
    let coverFile: File | null = null;
    for (const [key, value] of formData.entries()) {
      if (!(value instanceof File)) continue;
      if (key === "file") flyerFile = value;
      if (key === "cover") coverFile = value;
    }
    if (!flyerFile) return NextResponse.json({ error: "No flyer file uploaded" }, { status: 400 });

    // --- Upload main flyer to S3 ---
    const flyerBuffer = Buffer.from(await flyerFile.arrayBuffer());
    const flyerKey = `${session.user.tenantId}/flyer/${uuidv4()}-${flyerFile.name}`;
    await uploadToS3(flyerBuffer, flyerKey, flyerFile.type || "application/octet-stream", assetType as any);

    // --- Optional cover upload for paid PDFs ---
    let coverUrl: string | null = null;
    if (!isFree && assetType === "PDF" && coverFile) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverKey = `${session.user.tenantId}/flyer/covers/${uuidv4()}-${coverFile.name}`;
      await uploadToS3(coverBuffer, coverKey, coverFile.type || "image/png", "IMAGE");
      coverUrl = `/${coverKey}`;
    }

    // --- Compute image dimensions & checksum ---
    let width: number | null = null;
    let height: number | null = null;
    if (assetType === "IMAGE") {
      const dimensions = sizeOf(flyerBuffer);
      width = dimensions.width ?? null;
      height = dimensions.height ?? null;
    }
    const checksum = crypto.createHash("md5").update(flyerBuffer).digest("hex");

    // --- Create flyer record ---
    const flyer = await prisma.flyer.create({
      data: {
        tenantId: session.user.tenantId,
        campaignId,
        title,
        description,
        assetType: assetType as any,
        originalUrl: `/${flyerKey}`,
        cdnUrl: `/${flyerKey}`,
        coverUrl,
        s3Key: flyerKey,
        sizeBytes: flyerBuffer.length,
        width,
        height,
        checksum,
        isFree,
        priceCents: price,
        currency,
      },
    });

    // --- Create short link & QR code ---
    const targetPath = `/flyer/${flyer.id}`;
    const slug = uuidv4().split("-")[0];
    const shortLink = await prisma.shortLink.create({
      data: { tenantId: session.user.tenantId, flyerId: flyer.id, slug, targetPath },
    });

    const qrBuffer = await QRCode.toBuffer(`${process.env.APP_BASE_URL}${targetPath}`, {
      width: 300,
      color: { dark: "#000", light: "#fff" },
    });
    const qrKey = `${session.user.tenantId}/qrcodes/${slug}.png`;
    await uploadToS3(qrBuffer, qrKey, "image/png", "IMAGE");
    const qr = await prisma.qRCode.create({
      data: { shortLinkId: shortLink.id, format: "PNG", imageUrl: `/${qrKey}` },
    });

    return NextResponse.json({ ...flyer, shortLink, qr }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// ---------------- GET: fetch all flyers ----------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const flyers = await prisma.flyer.findMany({
      where: { tenantId: session.user.tenantId },
      include: { links: { include: { qr: true } }, campaign: true },
      orderBy: { createdAt: "desc" },
    });

    const result = await Promise.all(
      flyers.map(async (f) => {
        const cdnUrl = f.cdnUrl
          ? await getSignedUrlForKey(f.cdnUrl.replace(/^\//, ""), f.assetType)
          : null;

        const coverUrl = f.coverUrl
          ? await getSignedUrlForKey(f.coverUrl.replace(/^\//, ""), "IMAGE")
          : null;

        const qrUrl = f.links[0]?.qr?.imageUrl
          ? await getSignedUrlForKey(f.links[0].qr.imageUrl.replace(/^\//, ""))
          : null;

        const shortcode = f.links[0]?.slug
          ? `${process.env.APP_BASE_URL}/flyer/${f.id}`
          : null;

        const isPaid = !f.isFree || f.campaign?.isPaid;

        return {
          id: f.id,
          tenantId: f.tenantId,
          campaignId: f.campaignId,
          title: f.title,
          description: f.description,
          assetType: f.assetType,
          cdnUrl,
          coverUrl,
          qrCodeUrl: qrUrl,
          shortcode,
          isFree: f.isFree,
          isPaid,
          priceCents: isPaid ? f.priceCents ?? f.campaign?.priceCents : null,
          currency: isPaid ? f.currency ?? f.campaign?.currency : null,
          buyLink: f.buyLink ?? f.campaign?.buyLink,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        };
      })
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch flyers" }, { status: 500 });
  }
}