import { NextRequest, NextResponse } from "next/server";
import { ShortLinkEventKind } from "@prisma/client";
import { trackUniqueEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, context: any) {
  const { id } = await context.params;
  const { rating, comment, email } = await req.json();

  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: "rating 1..5 required" }, { status: 400 });

  const flyer = await prisma.flyer.findUnique({
    where: { id },
    include: { links: true },
  });
  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  await prisma.feedback.create({
    data: {
      tenantId: flyer.tenantId,
      flyerId: flyer.id,
      rating,
      comment,
      email,
    },
  });

  const primary = flyer.links[0];
  if (primary) {
    await trackUniqueEvent({
      tenantId: flyer.tenantId,
      shortLinkId: primary.id,
      kind: ShortLinkEventKind.FEEDBACK,
      req,
    });
  }

  return NextResponse.json({ ok: true });
}
