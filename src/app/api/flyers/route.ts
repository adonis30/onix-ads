import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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



async function uploadToS3(buffer: Buffer, key: string, mimeType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: undefined, // no ACLs needed
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

// POST: upload flyers and generate QR code pointing to flyer
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) 
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const assetType = formData.get("assetType")?.toString() || "";
    const campaignId = formData.get("campaignId")?.toString() || "";

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: session.user.tenantId },
    });
    if (!campaign)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const files: File[] = [];
    for (const entry of formData.entries()) {
      if (entry[1] instanceof File && entry[0] === "file") files.push(entry[1]);
    }
    if (!files.length) 
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

    const baseUrl = process.env.APP_BASE_URL;
    if (!baseUrl) throw new Error("APP_BASE_URL is not defined");

    const createdFlyers = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || "application/octet-stream";
        const key = `${session.user.tenantId}/flyers/${uuidv4()}-${file.name}`;

        // Upload flyer to S3
        await uploadToS3(buffer, key, mimeType);

        let width: number | null = null;
        let height: number | null = null;
        if (assetType === "IMAGE") {
          const dimensions = sizeOf(buffer);
          width = dimensions.width ?? null;
          height = dimensions.height ?? null;
        }

        const checksum = crypto.createHash("md5").update(buffer).digest("hex");

        const flyer = await prisma.flyer.create({
          data: {
            tenantId: session.user.tenantId,
            campaignId,
            title,
            description,
            assetType: assetType as any,
            originalUrl: `/${key}`,
            cdnUrl: `/${key}`,
            sizeBytes: buffer.length,
            width,
            height,
            checksum,
          },
        });

        // Generate ShortLink pointing to flyer
        const targetPath = `/flyers/${flyer.id}`;
        const slug = uuidv4().split("-")[0];
        const shortUrl = `${baseUrl}${targetPath}`; // <- points correctly

        const shortLink = await prisma.shortLink.create({
          data: { tenantId: session.user.tenantId, flyerId: flyer.id, slug, targetPath },
        });

        // Generate QR code buffer
        const qrBuffer = await QRCode.toBuffer(shortUrl, { 
          width: 300, 
          color: { dark: "#000", light: "#fff" } 
        });
        const qrKey = `${session.user.tenantId}/qrcodes/${slug}.png`;

        // Upload QR code to S3
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

// GET: fetch all flyers for tenant with signed URLs for flyer and QR code
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const flyers = await prisma.flyer.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        campaign: true,
        links: { include: { qr: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const flyersWithSignedUrls = await Promise.all(
      flyers.map(async (f) => {
        // Signed URL for flyer
        const flyerKey = f.cdnUrl?.replace(/^\//, "");
        const cdnUrl = flyerKey ? await getSignedUrlForKey(flyerKey) : null;

        // Signed URL for QR code
        const qr = f.links[0]?.qr;
        const qrKey = qr?.imageUrl?.replace(/^\//, "");
        const qrUrl = qrKey ? await getSignedUrlForKey(qrKey) : null;

        // Shortcode points to /f/:slug using APP_BASE_URL
        const slug = f.links[0]?.slug ?? null;
        const shortcode = slug ? `${process.env.APP_BASE_URL}/f/${slug}` : null;

        return {
          ...f,
          cdnUrl,
          qrCodeUrl: qrUrl,
          shortcode,
        };
      })
    );

    return NextResponse.json(flyersWithSignedUrls, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch flyers" }, { status: 500 });
  }
}