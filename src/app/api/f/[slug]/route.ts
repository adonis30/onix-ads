// src/app/api/f/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import crypto from "node:crypto";

export async function GET(req: NextRequest, context: any) {
  // Await dynamic params
  const params = await context.params;
  const slugArray = params.slug as string[];
  const slug = slugArray.join("/");

  try {
    // Find short link and flyer
    const shortLink = await prisma.shortLink.findUnique({
      where: { slug },
      include: { flyer: true },
    });

    if (!shortLink || !shortLink.flyer) {
      return NextResponse.json({ error: "Short link or flyer not found" }, { status: 404 });
    }

    // Log SCAN event
    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");

    await prisma.shortLinkEvent.create({
      data: {
        tenantId: shortLink.tenantId,
        shortLinkId: shortLink.id,
        kind: ShortLinkEventKind.SCAN,
        ipHash,
        userAgent: req.headers.get("user-agent") ?? undefined,
        referrer: req.headers.get("referer") ?? undefined,
      },
    });

    // Build redirect URL to flyer GET endpoint
    const redirectUrl = `${process.env.APP_BASE_URL}/api/flyers/${shortLink.flyer.id}`;

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to resolve short link" }, { status: 500 });
  }
}
