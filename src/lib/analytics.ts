import { prisma } from "@/lib/prisma";
import { ShortLinkEventKind } from "@prisma/client";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
export function ua(req: NextRequest) {
  return req.headers.get("user-agent") || "unknown";
}
export function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

/**
 * Dedup: one event per (shortLinkId, kind, ipHash, userAgent) per 24h
 */
export async function trackUniqueEvent(opts: {
  tenantId: string;
  shortLinkId: string;
  kind: ShortLinkEventKind;
  req: NextRequest;
}) {
  const ip = getClientIp(opts.req);
  const ipHash = hashIp(ip);
  const userAgent = ua(opts.req);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const exists = await prisma.shortLinkEvent.findFirst({
    where: {
      tenantId: opts.tenantId,
      shortLinkId: opts.shortLinkId,
      kind: opts.kind,
      ipHash,
      userAgent,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (exists) return { deduped: true };

  await prisma.shortLinkEvent.create({
    data: {
      tenantId: opts.tenantId,
      shortLinkId: opts.shortLinkId,
      kind: opts.kind,
      ipHash,
      userAgent,
    },
  });
  return { deduped: false };
}
