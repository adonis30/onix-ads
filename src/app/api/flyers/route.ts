// src/app/api/flyers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuthOptions } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sizeOf from "image-size";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

export const config = { api: { bodyParser: false } };

// GET: fetch all flyers for the tenant
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const flyers = await prisma.flyer.findMany({
      where: { tenantId: session.user.tenantId },
      include: { campaign: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(flyers, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch flyers" }, { status: 500 });
  }
}

// POST: create new flyers
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as AuthOptions);
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

        // Save file under tenant folder
        const tenantDir = path.join(process.cwd(), "public", "uploads", session.user.tenantId);
        if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir, { recursive: true });
        const filePath = path.join(tenantDir, file.name);
        fs.writeFileSync(filePath, buffer);

        // Image dimensions
        let width: number | null = null;
        let height: number | null = null;
        if (assetType === "IMAGE") {
          const dimensions = sizeOf(buffer);
          width = dimensions.width ?? null;
          height = dimensions.height ?? null;
        }

        const checksum = crypto.createHash("md5").update(buffer).digest("hex");
        const originalUrl = `/uploads/${session.user.tenantId}/${file.name}`;

        const flyer = await prisma.flyer.create({
          data: {
            tenantId: session.user.tenantId,
            campaignId,
            title,
            description,
            assetType: assetType as any,
            originalUrl,
            cdnUrl: originalUrl,
            sizeBytes: buffer.length,
            width,
            height,
            checksum,
          },
        });

        // Generate ShortLink
        const slug = uuidv4().split("-")[0];
        const targetPath = `/flyers/${flyer.id}`;
        const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL || " http://10.35.47.151:30"}/f/${slug}`;
        const shortLink = await prisma.shortLink.create({
          data: {
            tenantId: session.user.tenantId,
            flyerId: flyer.id,
            slug,
            targetPath,
          },
        });

        // Generate QR code image
        const qrDir = path.join(process.cwd(), "public", "qrcodes");
        if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
        const qrPath = path.join(qrDir, `${slug}.png`);
        await QRCode.toFile(qrPath, shortUrl, { color: { dark: "#000", light: "#fff" }, width: 300 });

        const qr = await prisma.qRCode.create({
          data: { shortLinkId: shortLink.id, format: "PNG", imageUrl: `/qrcodes/${slug}.png` },
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

// DELETE: delete flyer by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const flyerId = params.id;

    // Ensure flyer belongs to tenant
    const flyer = await prisma.flyer.findUnique({ where: { id: flyerId } });
    if (!flyer || flyer.tenantId !== session.user.tenantId)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    await prisma.flyer.delete({ where: { id: flyerId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
