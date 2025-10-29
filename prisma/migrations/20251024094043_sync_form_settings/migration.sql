-- AlterTable
ALTER TABLE "public"."DynamicForm" ADD COLUMN     "settingsId" TEXT;

-- CreateTable
CREATE TABLE "public"."FormSettings" (
    "id" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."DynamicForm" ADD CONSTRAINT "DynamicForm_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "public"."FormSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
