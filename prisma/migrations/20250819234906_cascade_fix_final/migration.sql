-- DropForeignKey
ALTER TABLE "public"."QRCode" DROP CONSTRAINT "QRCode_shortLinkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShortLink" DROP CONSTRAINT "ShortLink_flyerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShortLinkEvent" DROP CONSTRAINT "ShortLinkEvent_shortLinkId_fkey";

-- DropIndex
DROP INDEX "public"."ShortLinkEvent_shortLinkId_kind_createdAt_idx";

-- AddForeignKey
ALTER TABLE "public"."ShortLink" ADD CONSTRAINT "ShortLink_flyerId_fkey" FOREIGN KEY ("flyerId") REFERENCES "public"."Flyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRCode" ADD CONSTRAINT "QRCode_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "public"."ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShortLinkEvent" ADD CONSTRAINT "ShortLinkEvent_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "public"."ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
