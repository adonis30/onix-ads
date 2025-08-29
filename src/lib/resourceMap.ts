// src/lib/resourceMap.ts
import { prisma } from "./prisma";

export const resourceMap = {
  campaign: prisma.campaign,
  flyer: prisma.flyer,
} as const;

export type ResourceName = keyof typeof resourceMap;
export type ResourceDelegate<R extends ResourceName> = typeof resourceMap[R];
