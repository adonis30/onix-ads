// src/app/api/f/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest, context: any) {
  try {
    // Let Next.js infer the type of params
    const slugArray = context.params.slug as string[]; // cast if it's a catch-all route
    const slug = slugArray.join("/"); // join for DB lookup

    const shortLink = await prisma.shortLink.findUnique({
      where: { slug },
      include: { flyer: true },
    });

    if (!shortLink || !shortLink.flyer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Hash the IP
    const rawIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");

    // Create a short link event
    await prisma.shortLinkEvent.create({
      data: {
        tenantId: shortLink.tenantId,
        shortLinkId: shortLink.id,
        kind: Prisma.ShortLinkEventKind.VIEW, // Use Prisma namespace for safety
        ipHash,
        userAgent: req.headers.get("user-agent") ?? undefined,
        referrer: req.headers.get("referer") ?? undefined,
      },
    });

    // Redirect to flyer URL
    const redirectUrl = shortLink.flyer.cdnUrl || shortLink.flyer.originalUrl;
    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error("Error in GET /f/[slug]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
