import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

const APP_DOMAIN = process.env.APP_BASE_URL!;

export async function POST(req: NextRequest, context: any) {
  const flyerId = context.params.id as string;
    const session = await getServerSession(authOptions);

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
        tenantId: session.user.tenantId , // replace with session user.tenantId if needed
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
