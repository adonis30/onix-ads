// src/app/api/super/tenants/route.ts
import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, created, bad, serverError } from "@/lib/http";
import { requireRoles } from "@/lib/auth-guards";
import { createTenantSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { Prisma, UserRole } from "@prisma/client";

/**
 * GET /api/super/tenants
 * Optional query: ?q=<search>
 * Returns tenants (ordered desc) with _count.users (safe for DataGrid)
 */
export async function GET(req: Request) {
  try {
    await requireRoles([UserRole.SUPER_ADMIN]);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    const where: Prisma.TenantWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { domain: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const tenants = await prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        // If you only need a count for the grid, use _count (cheaper than including full users)
        _count: { select: { users: true } },
        // Keep subscriptions if you need them in UI; otherwise remove to reduce payload
        subscriptions: {
          select: {
            id: true,
            status: true,
            plan: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // Return as-is: client accesses count via row._count.users (or you can flatten here if you prefer)
    return ok(tenants);
  } catch (e) {
    return serverError(e);
  }
}

/**
 * POST /api/super/tenants
 * Body validated by createTenantSchema (zod)
 */
export async function POST(req: Request) {
  try {
    const user = await requireRoles([UserRole.SUPER_ADMIN]);

    const body = await req.json();
    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.flatten().formErrors?.join(", ") ||
        parsed.error.issues.map(i => i.message).join(", ");
      return bad(message || "Invalid request body");
    }
    const data = parsed.data;

    // Ensure slug is unique
    const exists = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (exists) return bad("Slug already in use");

    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        plan: data.plan ?? "FREE",
        planVariantId: data.planVariantId ?? null,
        domain: data.domain || null,
        primaryColor: data.primaryColor ?? null,
        accentColor: data.accentColor ?? null,
        logoUrl: data.logoUrl ?? null,
      },
    });

    await audit({
      userId: user.id,
      tenantId: tenant.id,
      action: "SUPER_TENANT_CREATE",
      meta: { slug: tenant.slug },
    });

    return created(tenant);
  } catch (e) {
    return serverError(e);
  }
}
