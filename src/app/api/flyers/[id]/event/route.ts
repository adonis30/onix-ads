import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import crypto from "node:crypto";

type Body = { kind: "VIEW" | "DOWNLOAD"; source?: string };

export async function POST(req: NextRequest, context: any) {
  const { id } = await context.params as { id: string };

  try {
    const body = (await req.json()) as Body;
    const kind =
      body.kind === "DOWNLOAD" ? ShortLinkEventKind.DOWNLOAD : ShortLinkEventKind.VIEW;

    const flyer = await prisma.flyer.findUnique({
      where: { id },
      include: { links: { select: { id: true, tenantId: true } } },
    });
    if (!flyer || flyer.links.length === 0)
      return NextResponse.json({ error: "Flyer/links not found" }, { status: 404 });

    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");

    // Record once against the first link (or all links if you prefer)
    const link = flyer.links[0];
    await prisma.shortLinkEvent.create({
      data: {
        tenantId: link.tenantId,
        shortLinkId: link.id,
        kind,
        ipHash,
        userAgent: req.headers.get("user-agent") ?? undefined,
        referrer: body.source ?? req.headers.get("referer") ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
