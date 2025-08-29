/*
  Warnings:

  - A unique constraint covering the columns `[shortLinkId,kind,ipHash,userAgent]` on the table `ShortLinkEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceCents" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ShortLinkEvent_shortLinkId_kind_ipHash_userAgent_key" ON "public"."ShortLinkEvent"("shortLinkId", "kind", "ipHash", "userAgent");
