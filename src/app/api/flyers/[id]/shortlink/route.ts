// src/app/api/flyers/[id]/shortlink/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";

const APP_DOMAIN = "http://localhost:3000"; // replace when deployed

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const flyerId = params.id;

  try {
    // Generate a unique slug
    const slug = Math.random().toString(36).substring(2, 8);

    const targetPath = `/f/${slug}`;

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(`${APP_DOMAIN}${targetPath}`);

    // Create shortlink and QR in DB
    const shortLink = await prisma.shortLink.create({
      data: {
        flyerId,
        tenantId: "tenant_placeholder", // replace with session user.tenantId if needed
        slug,
        targetPath,
        qr: {
          create: {
            imageUrl: qrDataUrl,
          },
        },
      },
      include: { qr: true },
    });

    return NextResponse.json(shortLink, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Shortlink creation failed" }, { status: 500 });
  }
}
