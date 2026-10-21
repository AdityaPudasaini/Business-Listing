-- CreateTable
CREATE TABLE "OwnerMessage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OwnerMessage_businessId_recipientId_idx" ON "OwnerMessage"("businessId", "recipientId");

-- AddForeignKey
ALTER TABLE "OwnerMessage" ADD CONSTRAINT "OwnerMessage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
