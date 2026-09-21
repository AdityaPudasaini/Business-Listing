-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "service" TEXT;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "title" TEXT;
