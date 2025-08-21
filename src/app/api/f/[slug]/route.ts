import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { ShortLinkEventKind } from "@prisma/client";

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

  // Track event
  const rawIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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

  // 🚀 Instead of redirecting to signed S3 URL, send user to flyer viewer
  const redirectUrl = `${process.env.APP_BASE_URL}/flyers/${shortLink.flyer.id}`;
  return NextResponse.redirect(redirectUrl);
}
