-- AlterTable
ALTER TABLE "public"."DynamicForm" ADD COLUMN     "submissions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visits" INTEGER NOT NULL DEFAULT 0;
