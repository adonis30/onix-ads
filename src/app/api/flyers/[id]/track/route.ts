import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import { trackUniqueEvent } from "@/lib/analytics";

export async function POST(req: NextRequest, context: any) {
  const { id } = await context.params;
  const { kind = "VIEW" } = await req.json().catch(() => ({}));

  if (!Object.keys(ShortLinkEventKind).includes(kind))
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });

  const flyer = await prisma.flyer.findUnique({
    where: { id },
    include: { links: true },
  });
  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  // use primary link for attribution (first link)
  const primaryLink = flyer.links[0];
  if (!primaryLink) return NextResponse.json({ error: "No short link" }, { status: 400 });

  await trackUniqueEvent({
    tenantId: flyer.tenantId,
    shortLinkId: primaryLink.id,
    kind: ShortLinkEventKind[kind as keyof typeof ShortLinkEventKind],
    req,
  });

  return NextResponse.json({ ok: true });
}
