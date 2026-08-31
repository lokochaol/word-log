/*
  Warnings:

  - You are about to drop the `permanent_note_block` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quick_note_block` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "permanent_note_block" DROP CONSTRAINT "permanent_note_block_permanent_note_id_fkey";

-- DropForeignKey
ALTER TABLE "quick_note_block" DROP CONSTRAINT "quick_note_block_quick_note_id_fkey";

-- DropTable
DROP TABLE "permanent_note_block";

-- DropTable
DROP TABLE "quick_note_block";

-- DropEnum
DROP TYPE "BlockType";
