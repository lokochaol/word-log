-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TEXT', 'CODE', 'MERMAID', 'IMAGE');

-- CreateEnum
CREATE TYPE "QuickNoteSource" AS ENUM ('SCRATCH', 'VOICE');

-- CreateEnum
CREATE TYPE "QuickNoteStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LinkTargetType" AS ENUM ('PERMANENT_NOTE', 'INDEX_ENTRY');

-- DropIndex
DROP INDEX "word_meaning_trgm_idx";

-- DropIndex
DROP INDEX "word_text_trgm_idx";

-- DropIndex
DROP INDEX "word_relation_related_text_trgm_idx";

-- CreateTable
CREATE TABLE "quick_note" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "source" "QuickNoteSource" NOT NULL DEFAULT 'SCRATCH',
    "status" "QuickNoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "literature_citation" TEXT,
    "literature_url" TEXT,
    "literature_zotero_key" TEXT,
    "literature_summary" TEXT,
    "voice_audio_url" TEXT,
    "voice_transcript" TEXT,
    "voice_duration_seconds" INTEGER,
    "encountered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quick_note_block" (
    "id" TEXT NOT NULL,
    "quick_note_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "block_type" "BlockType" NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT,
    "caption" TEXT,

    CONSTRAINT "quick_note_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permanent_note" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permanent_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permanent_note_block" (
    "id" TEXT NOT NULL,
    "permanent_note_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "block_type" "BlockType" NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT,
    "caption" TEXT,

    CONSTRAINT "permanent_note_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permanent_note_link" (
    "id" TEXT NOT NULL,
    "source_note_id" TEXT NOT NULL,
    "target_type" "LinkTargetType" NOT NULL,
    "target_note_id" TEXT,
    "target_index_entry_id" TEXT,
    "relation_label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permanent_note_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "index_entry" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "index_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_batch" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_source_quick_note" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "quick_note_id" TEXT NOT NULL,

    CONSTRAINT "promotion_source_quick_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_output_permanent_note" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "permanent_note_id" TEXT NOT NULL,

    CONSTRAINT "promotion_output_permanent_note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quick_note_owner_sub_status_encountered_at_idx" ON "quick_note"("owner_sub", "status", "encountered_at");

-- CreateIndex
CREATE INDEX "quick_note_block_quick_note_id_position_idx" ON "quick_note_block"("quick_note_id", "position");

-- CreateIndex
CREATE INDEX "permanent_note_owner_sub_order_key_idx" ON "permanent_note"("owner_sub", "order_key");

-- CreateIndex
CREATE UNIQUE INDEX "permanent_note_owner_sub_order_key_key" ON "permanent_note"("owner_sub", "order_key");

-- CreateIndex
CREATE INDEX "permanent_note_block_permanent_note_id_position_idx" ON "permanent_note_block"("permanent_note_id", "position");

-- CreateIndex
CREATE INDEX "permanent_note_link_source_note_id_idx" ON "permanent_note_link"("source_note_id");

-- CreateIndex
CREATE INDEX "permanent_note_link_target_note_id_idx" ON "permanent_note_link"("target_note_id");

-- CreateIndex
CREATE INDEX "permanent_note_link_target_index_entry_id_idx" ON "permanent_note_link"("target_index_entry_id");

-- CreateIndex
CREATE INDEX "index_entry_owner_sub_idx" ON "index_entry"("owner_sub");

-- CreateIndex
CREATE UNIQUE INDEX "index_entry_owner_sub_keyword_key" ON "index_entry"("owner_sub", "keyword");

-- CreateIndex
CREATE INDEX "promotion_batch_owner_sub_created_at_idx" ON "promotion_batch"("owner_sub", "created_at");

-- CreateIndex
CREATE INDEX "promotion_source_quick_note_quick_note_id_idx" ON "promotion_source_quick_note"("quick_note_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_source_quick_note_batch_id_quick_note_id_key" ON "promotion_source_quick_note"("batch_id", "quick_note_id");

-- CreateIndex
CREATE INDEX "promotion_output_permanent_note_permanent_note_id_idx" ON "promotion_output_permanent_note"("permanent_note_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_output_permanent_note_batch_id_permanent_note_id_key" ON "promotion_output_permanent_note"("batch_id", "permanent_note_id");

-- AddForeignKey
ALTER TABLE "quick_note_block" ADD CONSTRAINT "quick_note_block_quick_note_id_fkey" FOREIGN KEY ("quick_note_id") REFERENCES "quick_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanent_note_block" ADD CONSTRAINT "permanent_note_block_permanent_note_id_fkey" FOREIGN KEY ("permanent_note_id") REFERENCES "permanent_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanent_note_link" ADD CONSTRAINT "permanent_note_link_source_note_id_fkey" FOREIGN KEY ("source_note_id") REFERENCES "permanent_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanent_note_link" ADD CONSTRAINT "permanent_note_link_target_note_id_fkey" FOREIGN KEY ("target_note_id") REFERENCES "permanent_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanent_note_link" ADD CONSTRAINT "permanent_note_link_target_index_entry_id_fkey" FOREIGN KEY ("target_index_entry_id") REFERENCES "index_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "index_entry" ADD CONSTRAINT "index_entry_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "permanent_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_source_quick_note" ADD CONSTRAINT "promotion_source_quick_note_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "promotion_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_source_quick_note" ADD CONSTRAINT "promotion_source_quick_note_quick_note_id_fkey" FOREIGN KEY ("quick_note_id") REFERENCES "quick_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_output_permanent_note" ADD CONSTRAINT "promotion_output_permanent_note_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "promotion_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_output_permanent_note" ADD CONSTRAINT "promotion_output_permanent_note_permanent_note_id_fkey" FOREIGN KEY ("permanent_note_id") REFERENCES "permanent_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
