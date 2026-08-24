-- CreateEnum
CREATE TYPE "DiscoveryKind" AS ENUM ('NEWS', 'LITERATURE');

-- CreateEnum
CREATE TYPE "DiscoveryStatus" AS ENUM ('CANDIDATE', 'CONFIRMED');

-- CreateTable
CREATE TABLE "discovery_candidate" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "quick_note_id" TEXT NOT NULL,
    "kind" "DiscoveryKind" NOT NULL,
    "status" "DiscoveryStatus" NOT NULL DEFAULT 'CANDIDATE',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "source_label" TEXT NOT NULL,
    "url" TEXT,
    "confidence" INTEGER NOT NULL,
    "literature_memo_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_candidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discovery_candidate_quick_note_id_idx" ON "discovery_candidate"("quick_note_id");

-- CreateIndex
CREATE INDEX "discovery_candidate_owner_sub_status_idx" ON "discovery_candidate"("owner_sub", "status");

-- AddForeignKey
ALTER TABLE "discovery_candidate" ADD CONSTRAINT "discovery_candidate_quick_note_id_fkey" FOREIGN KEY ("quick_note_id") REFERENCES "quick_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_candidate" ADD CONSTRAINT "discovery_candidate_literature_memo_id_fkey" FOREIGN KEY ("literature_memo_id") REFERENCES "literature_memo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
