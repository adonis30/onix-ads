-- DropForeignKey
ALTER TABLE "public"."ShortLink" DROP CONSTRAINT "ShortLink_flyerId_fkey";

-- AlterTable
ALTER TABLE "public"."ShortLink" ADD COLUMN     "formId" TEXT,
ALTER COLUMN "flyerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."ShortLink" ADD CONSTRAINT "ShortLink_flyerId_fkey" FOREIGN KEY ("flyerId") REFERENCES "public"."Flyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShortLink" ADD CONSTRAINT "ShortLink_formId_fkey" FOREIGN KEY ("formId") REFERENCES "public"."DynamicForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
