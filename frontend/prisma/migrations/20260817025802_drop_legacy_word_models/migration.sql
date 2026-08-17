/*
  Warnings:

  - You are about to drop the `word` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `word_meaning_block` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `word_relation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "word_meaning_block" DROP CONSTRAINT "word_meaning_block_word_id_fkey";

-- DropForeignKey
ALTER TABLE "word_relation" DROP CONSTRAINT "word_relation_word_id_fkey";

-- DropTable
DROP TABLE "word";

-- DropTable
DROP TABLE "word_meaning_block";

-- DropTable
DROP TABLE "word_relation";

-- DropEnum
DROP TYPE "MeaningBlockType";
