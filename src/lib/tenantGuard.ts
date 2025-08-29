// src/lib/tenantGuard.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function ensureTenantOwnsResource(tenantId: string | undefined, flyerId: string) {
  if (!tenantId) return false;
  const f = await prisma.flyer.findUnique({ where: { id: flyerId }});
  return !!(f && f.tenantId === tenantId);
}
