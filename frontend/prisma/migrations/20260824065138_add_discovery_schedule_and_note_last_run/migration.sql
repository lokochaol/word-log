-- AlterTable
ALTER TABLE "quick_note" ADD COLUMN     "discovery_last_run_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "discovery_schedule" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "times_per_day" INTEGER NOT NULL DEFAULT 2,
    "hour1" INTEGER NOT NULL DEFAULT 7,
    "hour2" INTEGER NOT NULL DEFAULT 19,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discovery_schedule_owner_sub_key" ON "discovery_schedule"("owner_sub");
