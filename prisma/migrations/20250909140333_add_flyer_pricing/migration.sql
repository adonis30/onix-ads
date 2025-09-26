-- AlterTable
ALTER TABLE "public"."Flyer" ADD COLUMN     "buyLink" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priceCents" INTEGER;
