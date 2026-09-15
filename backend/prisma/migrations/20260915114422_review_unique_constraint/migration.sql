/*
  Warnings:

  - A unique constraint covering the columns `[businessId,userId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_businessId_userId_key" ON "Review"("businessId", "userId");
