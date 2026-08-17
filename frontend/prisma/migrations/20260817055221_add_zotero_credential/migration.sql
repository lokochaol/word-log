-- CreateTable
CREATE TABLE "zotero_credential" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "api_key_encrypted" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "library_type" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zotero_credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zotero_credential_owner_sub_key" ON "zotero_credential"("owner_sub");
