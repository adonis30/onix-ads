import prisma from "../src/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  const email = "admin@onix-ads.com";
  const password = "SuperSecurePassword123!";

  // Ensure main tenant exists
  const tenant = await prisma.tenant.upsert({
    where: { slug: "root-tenant" },
    update: {},
    create: {
      name: "Root Tenant",
      slug: "root-tenant",
      plan: "FREE",
    },
  });

  const hashedPassword = await hash(password, 10);

  // Check if super user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email,
        password: hashedPassword,
        role: "OWNER",      // use OWNER for top-level superuser
        tenantId: tenant.id, // use actual tenant id
      },
    });
    console.log("Super user created:", admin.email);
  } else {
    console.log("Super user already exists.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
