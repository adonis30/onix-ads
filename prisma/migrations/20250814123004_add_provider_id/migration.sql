/*
  Warnings:

  - A unique constraint covering the columns `[providerId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "providerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_providerId_key" ON "public"."Subscription"("providerId");
