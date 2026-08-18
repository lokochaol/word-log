-- DropForeignKey
ALTER TABLE "permanent_note" DROP CONSTRAINT "permanent_note_literature_memo_id_fkey";

-- DropIndex
DROP INDEX "permanent_note_literature_memo_id_idx";

-- CreateTable
CREATE TABLE "permanent_note_literature_memo" (
    "id" TEXT NOT NULL,
    "permanent_note_id" TEXT NOT NULL,
    "literature_memo_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permanent_note_literature_memo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permanent_note_literature_memo_literature_memo_id_idx" ON "permanent_note_literature_memo"("literature_memo_id");

-- CreateIndex
CREATE UNIQUE INDEX "permanent_note_literature_memo_permanent_note_id_literature_key" ON "permanent_note_literature_memo"("permanent_note_id", "literature_memo_id");

-- AddForeignKey
ALTER TABLE "permanent_note_literature_memo" ADD CONSTRAINT "permanent_note_literature_memo_permanent_note_id_fkey" FOREIGN KEY ("permanent_note_id") REFERENCES "permanent_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanent_note_literature_memo" ADD CONSTRAINT "permanent_note_literature_memo_literature_memo_id_fkey" FOREIGN KEY ("literature_memo_id") REFERENCES "literature_memo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
