-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "email" TEXT,
ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hours" JSONB,
ADD COLUMN     "paymentMethods" TEXT[] DEFAULT ARRAY[]::TEXT[];
