/*
  Warnings:

  - Added the required column `published` to the `DynamicForm` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DynamicForm" ADD COLUMN     "published" BOOLEAN NOT NULL;
