-- CreateTable
CREATE TABLE "discovery_run_status" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "last_run_at" TIMESTAMP(3) NOT NULL,
    "last_error_code" TEXT,
    "last_error_status" INTEGER,
    "last_error_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_run_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discovery_run_status_owner_sub_key" ON "discovery_run_status"("owner_sub");
