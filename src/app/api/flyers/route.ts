import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import sizeOf from "image-size";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const config = { api: { bodyParser: false } };

// ----------------- S3 Setup -----------------
const s3 = new S3Client({
  region: process.env.S3_REGION!,
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
      ACL: "public-read",
    })
  );

  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

async function deleteFromS3(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    })
  );
}

// ----------------- GET: fetch all flyers -----------------
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

    const flyersWithQr = flyers.map((f) => {
      const qr = f.links[0]?.qr;
      const shortLink = f.links[0]?.slug;
      return {
        ...f,
        qrCodeUrl: qr?.imageUrl ?? null,
        shortcode: shortLink ?? null,
      };
    });

    return NextResponse.json(flyersWithQr, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch flyers" }, { status: 500 });
  }
}

// ----------------- POST: upload new flyers -----------------
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
    if (files.length === 0)
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

    const createdFlyers = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload flyer to S3
        const fileKey = `${session.user.tenantId}/flyers/${uuidv4()}-${file.name}`;
        const fileUrl = await uploadToS3(buffer, fileKey, file.type);

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
            originalUrl: fileUrl,
            cdnUrl: fileUrl,
            sizeBytes: buffer.length,
            width,
            height,
            checksum,
          },
        });

        // ShortLink
        const slug = uuidv4().split("-")[0];
        const targetPath = `/flyers/${flyer.id}`;
        const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/f/${slug}`;
        const shortLink = await prisma.shortLink.create({
          data: {
            tenantId: session.user.tenantId,
            flyerId: flyer.id,
            slug,
            targetPath,
          },
        });

        // QR Code → upload to S3
        const qrBuffer = await QRCode.toBuffer(shortUrl, {
          color: { dark: "#000", light: "#fff" },
          width: 300,
        });
        const qrKey = `${session.user.tenantId}/qrcodes/${slug}.png`;
        const qrUrl = await uploadToS3(qrBuffer, qrKey, "image/png");

        const qr = await prisma.qRCode.create({
          data: {
            shortLinkId: shortLink.id,
            format: "PNG",
            imageUrl: qrUrl,
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

// ----------------- DELETE: delete flyer -----------------
export async function DELETE(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const flyerId = context.params.id as string;

    const flyer = await prisma.flyer.findUnique({
      where: { id: flyerId },
      include: { links: { include: { qr: true } } },
    });

    if (!flyer || flyer.tenantId !== session.user.tenantId)
      return NextResponse.json(
        { error: "Not found or unauthorized" },
        { status: 404 }
      );

    // Delete flyer file from S3
    if (flyer.originalUrl) {
      const key = flyer.originalUrl.split(".amazonaws.com/")[1];
      if (key) await deleteFromS3(key);
    }

    // Delete QR code file(s) from S3
    for (const link of flyer.links) {
      if (link.qr?.imageUrl) {
        const qrKey = link.qr.imageUrl.split(".amazonaws.com/")[1];
        if (qrKey) await deleteFromS3(qrKey);
      }
    }

    await prisma.flyer.delete({ where: { id: flyerId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
