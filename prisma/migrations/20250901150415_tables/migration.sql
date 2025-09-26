-- CreateTable
CREATE TABLE "public"."DynamicForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Response" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DynamicForm_slug_key" ON "public"."DynamicForm"("slug");

-- AddForeignKey
ALTER TABLE "public"."Response" ADD CONSTRAINT "Response_formId_fkey" FOREIGN KEY ("formId") REFERENCES "public"."DynamicForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
