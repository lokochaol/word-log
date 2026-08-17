-- Phase 1 of the literature-memo rearchitecture (additive only — see the
-- follow-up "migrate_literature_memo_data" and
-- "drop_legacy_quick_note_literature_columns" migrations). The 4 legacy
-- literature_* columns on quick_note are intentionally left in place here so
-- existing data survives untouched until it has been copied into
-- literature_memo and verified.

-- CreateTable
CREATE TABLE "literature_memo" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "zotero_key" TEXT,
    "citation" TEXT NOT NULL,
    "url" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "literature_memo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "literature_memo_owner_sub_idx" ON "literature_memo"("owner_sub");

-- CreateIndex
CREATE UNIQUE INDEX "literature_memo_owner_sub_zotero_key_key" ON "literature_memo"("owner_sub", "zotero_key");

-- AlterTable: add the new nullable FK columns alongside the old inline columns.
ALTER TABLE "quick_note" ADD COLUMN "literature_memo_id" TEXT;
ALTER TABLE "permanent_note" ADD COLUMN "literature_memo_id" TEXT;

-- CreateIndex
CREATE INDEX "quick_note_literature_memo_id_idx" ON "quick_note"("literature_memo_id");
CREATE INDEX "permanent_note_literature_memo_id_idx" ON "permanent_note"("literature_memo_id");

-- AddForeignKey
ALTER TABLE "quick_note" ADD CONSTRAINT "quick_note_literature_memo_id_fkey" FOREIGN KEY ("literature_memo_id") REFERENCES "literature_memo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "permanent_note" ADD CONSTRAINT "permanent_note_literature_memo_id_fkey" FOREIGN KEY ("literature_memo_id") REFERENCES "literature_memo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
