// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // --- Create Tenants ---
  const tenant1 = await prisma.tenant.create({
    data: {
      name: "Tenant One",
      slug: "tenant-one",
      plan: "FREE",
      stripeCustomerId: "cus_123",
      stripeSubId: "sub_123",
      primaryColor: "#FF0000",
      accentColor: "#00FF00",
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: "Tenant Two",
      slug: "tenant-two",
      plan: "PRO",
      stripeCustomerId: "cus_456",
      stripeSubId: "sub_456",
      primaryColor: "#0000FF",
      accentColor: "#FFFF00",
    },
  });

  // --- Create Users ---
  const user1 = await prisma.user.create({
    data: {
      email: "admin@tenantone.com",
      name: "Alice Admin",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "editor@tenanttwo.com",
      name: "Bob Editor",
    },
  });

  // --- Create Memberships ---
  await prisma.membership.createMany({
    data: [
      { userId: user1.id, tenantId: tenant1.id, role: "OWNER" },
      { userId: user2.id, tenantId: tenant2.id, role: "EDITOR" },
    ],
  });

  // --- Create Subscriptions separately ---
  await prisma.subscription.createMany({
    data: [
      {
        tenantId: tenant1.id,
        providerId: "ls_sub_123",
        stripeSubId: "stripe_123",
        plan: "FREE",
        status: "ACTIVE",
        startDate: new Date(),
      },
      {
        tenantId: tenant2.id,
        providerId: "ls_sub_456",
        stripeSubId: "stripe_456",
        plan: "PRO",
        status: "ACTIVE",
        startDate: new Date(),
      },
    ],
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
