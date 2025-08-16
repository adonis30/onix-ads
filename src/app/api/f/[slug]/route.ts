import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { ShortLinkEventKind } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const shortLink = await prisma.shortLink.findUnique({
      where: { slug },
      include: { flyer: true },
    });

    if (!shortLink) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Hash the visitor IP
    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");

    // Log the visit
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

    // Redirect to flyer
    return NextResponse.redirect(shortLink.flyer.cdnUrl || shortLink.flyer.originalUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Redirect failed" }, { status: 500 });
  }
}
