import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { ShortLinkEventKind } from "@prisma/client";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

export async function GET(req: NextRequest, context: any) {
  const slugArray = context.params.slug as string[];
  const slug = slugArray.join("/");

  const shortLink = await prisma.shortLink.findUnique({
    where: { slug },
    include: { flyer: true },
  });

  if (!shortLink || !shortLink.flyer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");

  await prisma.shortLinkEvent.create({
    data: {
      tenantId: shortLink.tenantId,
      shortLinkId: shortLink.id,
      kind: ShortLinkEventKind.VIEW,
      ipHash,
      userAgent: req.headers.get("user-agent") ?? undefined,
      referrer: req.headers.get("referer") ?? undefined,
    },
  });

  // Build full redirect URL
  let redirectUrl: string;
  if (shortLink.flyer.cdnUrl) {
    const key = shortLink.flyer.cdnUrl.replace(/^\//, "");
    redirectUrl = await getSignedUrlForKey(key);
  } else {
    // fallback to APP_BASE_URL + original flyer path
    redirectUrl = `${process.env.APP_BASE_URL}${shortLink.flyer.originalUrl}`;
  }

  return NextResponse.redirect(redirectUrl);
}
