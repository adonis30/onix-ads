import "server-only";
import { prisma } from "@/lib/prisma";
import { ok, created, bad, serverError } from "@/lib/http";
import { requireTenantRoles } from "@/lib/auth-guards";
import { inviteUserSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    const user = await requireTenantRoles([UserRole.TENANT_ADMIN, UserRole.EDITOR]);
    const users = await prisma.user.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(users);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireTenantRoles([UserRole.TENANT_ADMIN]);
    const body = await req.json();
    const parsed = inviteUserSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.flatten().formErrors.join(", "));
    const data = parsed.data;

    // In a real system, you'd send an invite email with a token instead.
    const password = await hash(Math.random().toString(36).slice(2, 12), 10);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        password,
        tenantId: user.tenantId,
      },
      select: { id: true, email: true, name: true, role: true, tenantId: true },
    });

    await audit({ userId: user.id, tenantId: user.tenantId, action: "TENANT_USER_INVITE", meta: { newUser }});
    return created(newUser);
  } catch (e) {
    if ((e as any)?.code === "P2002") return bad("User email already exists");
    return serverError(e);
  }
}
