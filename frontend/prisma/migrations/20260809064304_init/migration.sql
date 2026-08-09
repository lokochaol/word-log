-- Enables trigram similarity/fuzzy matching used by search and related-word suggestions.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "MeaningBlockType" AS ENUM ('TEXT', 'CODE', 'MERMAID', 'IMAGE');

-- CreateTable
CREATE TABLE "word" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "meaning" TEXT,
    "encountered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_relation" (
    "id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "related_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "word_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_meaning_block" (
    "id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "block_type" "MeaningBlockType" NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT,
    "caption" TEXT,

    CONSTRAINT "word_meaning_block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "word_owner_sub_encountered_at_idx" ON "word"("owner_sub", "encountered_at");

-- CreateIndex
CREATE UNIQUE INDEX "word_owner_sub_text_key" ON "word"("owner_sub", "text");

-- CreateIndex
CREATE UNIQUE INDEX "word_relation_word_id_related_text_key" ON "word_relation"("word_id", "related_text");

-- CreateIndex
CREATE INDEX "word_meaning_block_word_id_position_idx" ON "word_meaning_block"("word_id", "position");

-- CreateIndex (trigram, for fuzzy/prefix matching in search and suggestions)
CREATE INDEX "word_text_trgm_idx" ON "word" USING GIN ("text" gin_trgm_ops);
CREATE INDEX "word_meaning_trgm_idx" ON "word" USING GIN ("meaning" gin_trgm_ops);
CREATE INDEX "word_relation_related_text_trgm_idx" ON "word_relation" USING GIN ("related_text" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "word_relation" ADD CONSTRAINT "word_relation_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_meaning_block" ADD CONSTRAINT "word_meaning_block_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
