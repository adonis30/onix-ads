// src/app/api/flyers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import sizeOf from "image-size";
import QRCode from "qrcode";

export const config = { api: { bodyParser: false } };

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY!,
    secretAccessKey: process.env.S3_SECRET!,
  },
});

// ---------- Helpers ----------
async function uploadToS3(buffer: Buffer, key: string, mimeType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return key;
}

async function getSignedUrlForKey(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

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

    // Payment-related fields
    const isFree = formData.get("isFree")?.toString() === "true"; // ✅ correct
    const priceCents = !isFree && formData.get("priceCents")
      ? parseInt(formData.get("priceCents")!.toString(), 10)
      : null;
    const currency = !isFree ? formData.get("currency")?.toString() || "USD" : null;
    const buyLink = formData.get("buyLink")?.toString() || null;

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: session.user.tenantId },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    // Separate files
    const flyerFiles: File[] = [];
    let coverFile: File | null = null;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === "file") flyerFiles.push(value);
        if (key === "cover") coverFile = value;
      }
    }

    if (!flyerFiles.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

    const baseUrl = process.env.APP_BASE_URL;
    if (!baseUrl) throw new Error("APP_BASE_URL is not defined");

    const createdFlyers = await Promise.all(
      flyerFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || "application/octet-stream";
        const s3Key = `${session.user.tenantId}/flyer/${uuidv4()}-${file.name}`;

        // Upload main flyer
        await uploadToS3(buffer, s3Key, mimeType);

        let width: number | null = null;
        let height: number | null = null;
        if (assetType === "IMAGE") {
          const dimensions = sizeOf(buffer);
          width = dimensions.width ?? null;
          height = dimensions.height ?? null;
        }

        const checksum = crypto.createHash("md5").update(buffer).digest("hex");

        // Upload cover if exists
        let coverUrl: string | null = null;
        if (coverFile) {
          const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
          const coverMime = coverFile.type || "application/octet-stream";
          const coverS3Key = `${session.user.tenantId}/flyer/covers/${uuidv4()}-${coverFile.name}`;
          await uploadToS3(coverBuffer, coverS3Key, coverMime);
          coverUrl = `/${coverS3Key}`;
        }

        // Create flyer in DB
        const flyer = await prisma.flyer.create({
          data: {
            tenantId: session.user.tenantId,
            campaignId,
            title,
            description,
            assetType: assetType as any,
            originalUrl: `/${s3Key}`,
            cdnUrl: `/${s3Key}`,
            coverUrl,
            s3Key,
            sizeBytes: buffer.length,
            width,
            height,
            checksum,
            isFree,
            priceCents,
            currency,
            buyLink,
          },
        });

        // Generate ShortLink pointing to flyer page
        const targetPath = `/flyer/${flyer.id}`;
        const slug = uuidv4().split("-")[0];

        const shortLink = await prisma.shortLink.create({
          data: {
            tenantId: session.user.tenantId,
            flyerId: flyer.id,
            slug,
            targetPath,
          },
        });

        // Generate QR code
        const qrBuffer = await QRCode.toBuffer(`${baseUrl}${targetPath}`, {
          width: 300,
          color: { dark: "#000", light: "#fff" },
        });
        const qrKey = `${session.user.tenantId}/qrcodes/${slug}.png`;
        await uploadToS3(qrBuffer, qrKey, "image/png");

        const qr = await prisma.qRCode.create({
          data: {
            shortLinkId: shortLink.id,
            format: "PNG",
            imageUrl: `/${qrKey}`,
          },
        });

        return { ...flyer, shortLink, qr };
      })
    );

    return NextResponse.json(createdFlyers, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// ---------------- GET: fetch all flyers with signed URLs ----------------
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
        const flyerKey = f.cdnUrl?.replace(/^\//, "");
        const cdnUrl = flyerKey ? await getSignedUrlForKey(flyerKey) : null;

        const coverKey = f.coverUrl?.replace(/^\//, "");
        const coverSignedUrl = coverKey ? await getSignedUrlForKey(coverKey) : null;

        const qr = f.links[0]?.qr;
        const qrKey = qr?.imageUrl?.replace(/^\//, "");
        const qrUrl = qrKey ? await getSignedUrlForKey(qrKey) : null;

        const shortcode = f.links[0]?.slug
          ? `${process.env.APP_BASE_URL}/flyer/${f.id}`
          : null;

        // ✅ unified isPaid: true if campaign OR flyer is paid
        const isPaid = (f.campaign?.isPaid ?? false) || !f.isFree;

        return {
          ...f,
          cdnUrl,
          coverUrl: coverSignedUrl,
          qrCodeUrl: qrUrl,
          shortcode,
          isPaid,
          priceCents: isPaid ? (f.priceCents ?? f.campaign?.priceCents) : null,
          currency: isPaid ? (f.currency ?? f.campaign?.currency) : null,
          buyLink: f.buyLink ?? f.campaign?.buyLink,
        };
      })
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch flyers" }, { status: 500 });
  }
}
