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

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY!,
    secretAccessKey: process.env.S3_SECRET!,
  },
});

// Helper to upload buffer to S3
async function uploadToS3(buffer: Buffer, key: string, mimeType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: undefined, // ensure no ACLs if your bucket blocks ACLs
    })
  );
  return key;
}

// Helper to generate signed URL
async function getSignedUrlForKey(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}

// GET: fetch all flyers for tenant with signed URLs
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
        const qr = f.links[0]?.qr;
        const shortLink = f.links[0]?.slug;
        const cdnUrl = f.cdnUrl ? await getSignedUrlForKey(f.cdnUrl.replace(/^\//, "")) : null;
        const qrUrl = qr?.imageUrl ? await getSignedUrlForKey(qr.imageUrl.replace(/^\//, "")) : null;

        return {
          ...f,
          cdnUrl,
          qrCodeUrl: qrUrl,
          shortcode: shortLink ?? null,
        };
      })
    );

    return NextResponse.json(flyersWithSignedUrls, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch flyers" }, { status: 500 });
  }
}

// POST: upload flyers to S3
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const assetType = formData.get("assetType")?.toString() || "";
    const campaignId = formData.get("campaignId")?.toString() || "";

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: session.user.tenantId },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const files: File[] = [];
    for (const entry of formData.entries()) {
      if (entry[1] instanceof File && entry[0] === "file") files.push(entry[1]);
    }
    if (!files.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

    const createdFlyers = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || "application/octet-stream";
        const key = `${session.user.tenantId}/flyers/${uuidv4()}-${file.name}`;

        // Upload to S3
        await uploadToS3(buffer, key, mimeType);

        // Image dimensions
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

        // Generate ShortLink & QR code (optional)
        const slug = uuidv4().split("-")[0];
        const targetPath = `/flyers/${flyer.id}`;
        const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/f/${slug}`;
        const shortLink = await prisma.shortLink.create({
          data: { tenantId: session.user.tenantId, flyerId: flyer.id, slug, targetPath },
        });

        return { ...flyer, shortLink };
      })
    );

    return NextResponse.json(createdFlyers, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
