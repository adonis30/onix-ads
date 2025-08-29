import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  plan: z.enum(["FREE","STARTUP","PRO","ENTERPRISE"]).optional(),
  planVariantId: z.number().int().optional(),
  domain: z.string().url().optional().or(z.literal("")).optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  logoUrl: z.string().url().optional(),
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
  // if you want to set password here, add: password: z.string().min(8).optional()
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(["TENANT_ADMIN","EDITOR","VIEWER"]).optional(),
});
