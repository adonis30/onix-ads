-- AddForeignKey
ALTER TABLE "public"."DynamicForm" ADD CONSTRAINT "DynamicForm_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
