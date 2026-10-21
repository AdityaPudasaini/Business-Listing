/*
  Warnings:

  - Made the column `slug` on table `Business` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Business" ALTER COLUMN "slug" SET NOT NULL;
