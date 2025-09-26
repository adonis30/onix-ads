import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, created, bad, serverError, notFound } from "@/lib/http";
import { requireRoles } from "@/lib/auth-guards";
import { createTenantSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { Plan, Prisma, UserRole } from "@prisma/client";

/**
 * GET /api/super/tenants
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
        _count: { select: { users: true } },
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

    return ok(tenants);
  } catch (e) {
    return serverError(e);
  }
}

/**
 * POST /api/super/tenants
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

    // Auto-generate URL-safe slug if empty
    const slug = data.slug?.trim() ? data.slug : data.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Ensure slug is unique
    const exists = await prisma.tenant.findUnique({ where: { slug } });
    if (exists) return bad("Slug already in use");

    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug,
        plan: data.plan ?? "FREE",
        planVariantId: data.planVariantId != null ? Number(data.planVariantId) : undefined,
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
