import "server-only";
import { prisma } from "@/lib/prisma";

export async function audit({
  tenantId, userId, action, meta,
}: { tenantId?: string | null; userId?: string | null; action: string; meta?: unknown; }) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: tenantId ?? "system",
        userId: userId ?? undefined,
        action,
        metaJson: meta ? JSON.stringify(meta) : undefined,
      },
    });
  } catch (e) {
    // keep non-blocking
    console.warn("Audit failed:", e);
  }
}
