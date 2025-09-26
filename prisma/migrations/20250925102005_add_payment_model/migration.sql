-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "flyerId" TEXT,
    "accountId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "recipientId" TEXT,
    "provider" TEXT,
    "webhookRaw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "public"."Payment"("reference");

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_flyerId_fkey" FOREIGN KEY ("flyerId") REFERENCES "public"."Flyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
