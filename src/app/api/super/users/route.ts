// src/app/api/super/users/route.ts
import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, created, bad, serverError } from "@/lib/http";
import { requireRoles } from "@/lib/auth-guards";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * GET /api/super/users
 * Returns users WITHOUT password, with tenant { id, name }
 */
export async function GET() {
  try {
    await requireRoles([UserRole.SUPER_ADMIN]);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        tenant: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok(users);
  } catch (e) {
    return serverError(e);
  }
}

/**
 * POST /api/super/users
 * Body: { name?, email, password, role, tenantId? }
 * - Ensures unique email
 * - Hashes password
 * - Returns new user WITHOUT password
 */
export async function POST(req: Request) {
  try {
    await requireRoles([UserRole.SUPER_ADMIN]);
    const body = await req.json();

    const { name, email, password, role, tenantId } = body ?? {};

    if (!email || !password || !role) {
      return bad("Email, password, and role are required");
    }

    // Validate role against enum
    if (!Object.values(UserRole).includes(role)) {
      return bad("Invalid role");
    }

    // Uniqueness check
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return bad("User with this email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create
    const newUser = await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        password: hashedPassword,
        role,
        tenantId: tenantId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        tenant: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return created(newUser);
  } catch (e) {
    return serverError(e);
  }
}
