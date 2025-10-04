// src/app/api/flyers/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedUrlForKey } from "@/lib/s3Utils";

export async function GET(req: NextRequest, context: any) {
  const { id } = await context.params;

  const flyer = await prisma.flyer.findUnique({ where: { id } });
  if (!flyer || !flyer.cdnUrl) {
    return NextResponse.json({ error: "Flyer not found" }, { status: 404 });
  }

  const url = await getSignedUrlForKey(flyer.cdnUrl, "PDF");
  if (!url) return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });

  return NextResponse.redirect(url, {
    status: 302,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline", // force browser to preview
    },
  });
}
