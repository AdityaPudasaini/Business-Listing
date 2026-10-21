-- CreateTable
CREATE TABLE "PopupAd" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "href" TEXT,
    "alt" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopupAd_pkey" PRIMARY KEY ("id")
);
