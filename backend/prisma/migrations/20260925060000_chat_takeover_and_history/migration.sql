-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "takenOver" BOOLEAN NOT NULL DEFAULT false;

-- DropForeignKey
-- Previously ON DELETE CASCADE: deleting a visitor's account deleted every
-- chat session they took part in, including the owner's copy of the thread.
-- Switched to SET NULL so the session (and the owner's history of it)
-- survives; only the link to the now-deleted account is cleared.
ALTER TABLE "ChatSession" DROP CONSTRAINT "ChatSession_userId_fkey";

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
