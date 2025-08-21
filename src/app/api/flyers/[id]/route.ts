import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createHash } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ShortLinkEventKind } from "@prisma/client";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY!,
    secretAccessKey: process.env.S3_SECRET!,
  },
});

async function getSignedUrlForKey(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}


async function deleteFromS3(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    })
  );
}
// -------------------- GET: Fetch Flyer by ID --------------------



export async function GET(req: NextRequest, context: any) {
  const params = await context.params;
  const flyerId = params.id as string;

  try {
    const flyer = await prisma.flyer.findUnique({
      where: { id: flyerId },
      include: { links: { include: { qr: true } } },
    });

    if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

    // Track views
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

    const cdnUrl = flyer.cdnUrl ? await getSignedUrlForKey(flyer.cdnUrl) : flyer.originalUrl;

    const signedLinks = await Promise.all(
      flyer.links.map(async (link) => ({
        ...link,
        qr: link.qr ? { ...link.qr, imageUrl: await getSignedUrlForKey(link.qr.imageUrl) } : null,
      }))
    );

    return NextResponse.json(
      {
        title: flyer.title,
        description: flyer.description,
        assetType: flyer.assetType,
        cdnUrl,
        links: signedLinks,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch flyer" }, { status: 500 });
  }
}

// -------------------- PATCH: Update Flyer --------------------
export async function PATCH(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const flyerId = context.params.id as string;
    const body = await req.json();
    const { title, description, assetType } = body;

    const updated = await prisma.flyer.update({
      where: { id: flyerId },
      data: { title, description, assetType },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update flyer" }, { status: 500 });
  }
}

// -------------------- DELETE: Delete Flyer + S3 Files --------------------
export async function DELETE(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id: flyerId } = context.params;

    const flyer = await prisma.flyer.findUnique({
      where: { id: flyerId },
      include: { links: { include: { qr: true } } },
    });

    if (!flyer || flyer.tenantId !== session.user.tenantId)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    // Delete flyer file from S3
    if (flyer.cdnUrl) await deleteFromS3(flyer.cdnUrl.replace(/^\//, ""));

    // Delete QR code files from S3
    for (const link of flyer.links) {
      if (link.qr?.imageUrl) await deleteFromS3(link.qr.imageUrl.replace(/^\//, ""));
    }

    // Delete flyer record (cascades to shortLink & QR code)
    await prisma.flyer.delete({ where: { id: flyerId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}