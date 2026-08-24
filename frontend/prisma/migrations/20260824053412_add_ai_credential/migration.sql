-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('ANTHROPIC', 'OPENAI', 'GOOGLE');

-- CreateTable
CREATE TABLE "ai_credential" (
    "id" TEXT NOT NULL,
    "owner_sub" TEXT NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "api_key_encrypted" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_credential_owner_sub_key" ON "ai_credential"("owner_sub");
