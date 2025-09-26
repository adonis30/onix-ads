import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and dashes are allowed"),
  plan: z.enum(["FREE","STARTUP","PRO","ENTERPRISE"]).default("FREE"),
  planVariantId: z.string().optional().nullable(), // ✅ matches prisma
  domain: z.string().url().optional().nullable()
    .transform(val => (val && val.length > 0 ? val : null)), // ✅ converts "" → null
  primaryColor: z.string().optional().nullable()
    .transform(val => (val && val.length > 0 ? val : null)),
  accentColor: z.string().optional().nullable()
    .transform(val => (val && val.length > 0 ? val : null)),
  logoUrl: z.string().url().optional().nullable()
    .transform(val => (val && val.length > 0 ? val : null)), // ✅ "" → null
});

export const updateTenantSchema = createTenantSchema.partial();

export const upsertSubscriptionSchema = z.object({
  plan: z.enum(["FREE","STARTUP","PRO","ENTERPRISE"]),
  status: z.enum(["ACTIVE","CANCELED","EXPIRED"]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().nullable().optional(),
  providerId: z.string().optional(),
  stripeSubId: z.string().optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["TENANT_ADMIN","EDITOR","VIEWER"]).default("VIEWER"),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(["TENANT_ADMIN","EDITOR","VIEWER"]).optional(),
});
