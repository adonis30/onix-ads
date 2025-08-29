import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import { trackUniqueEvent } from "@/lib/analytics";

export async function POST(req: NextRequest, context: any) {
  const { id } = await context.params;
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const flyer = await prisma.flyer.findUnique({
    where: { id },
    include: { links: true },
  });
  if (!flyer) return NextResponse.json({ error: "Flyer not found" }, { status: 404 });

  await prisma.subscriber.create({
    data: { tenantId: flyer.tenantId, flyerId: flyer.id, email },
  });

  const primary = flyer.links[0];
  if (primary) {
    await trackUniqueEvent({
      tenantId: flyer.tenantId,
      shortLinkId: primary.id,
      kind: ShortLinkEventKind.SUBSCRIBE,
      req,
    });
  }

  return NextResponse.json({ ok: true });
}
