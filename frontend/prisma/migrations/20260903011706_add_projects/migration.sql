-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuickNoteArchiveReason" AS ENUM ('PROMOTED', 'STALE', 'PROJECT_CLOSED');

-- AlterTable
ALTER TABLE "permanent_note" ADD COLUMN     "project_id" TEXT;

-- AlterTable
ALTER TABLE "quick_note" ADD COLUMN     "archive_reason" "QuickNoteArchiveReason",
ADD COLUMN     "project_id" TEXT;

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "goal_ultimate" TEXT,
    "goal_year3" TEXT,
    "goal_year2" TEXT,
    "goal_year1" TEXT,
    "goal_month3" TEXT,
    "goal_month1" TEXT,
    "goal_day" TEXT,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_task_note" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_task_note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_owner_sub_status_idx" ON "project"("owner_sub", "status");

-- CreateIndex
CREATE UNIQUE INDEX "project_task_note_project_id_date_key" ON "project_task_note"("project_id", "date");

-- CreateIndex
CREATE INDEX "permanent_note_project_id_idx" ON "permanent_note"("project_id");

-- CreateIndex
CREATE INDEX "quick_note_project_id_idx" ON "quick_note"("project_id");

-- AddForeignKey
ALTER TABLE "quick_note" ADD CONSTRAINT "quick_note_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanent_note" ADD CONSTRAINT "permanent_note_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_note" ADD CONSTRAINT "project_task_note_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
