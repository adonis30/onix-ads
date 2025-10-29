/*
  Warnings:

  - A unique constraint covering the columns `[name,tenantId]` on the table `DynamicForm` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DynamicForm_name_tenantId_key" ON "public"."DynamicForm"("name", "tenantId");
