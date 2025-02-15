-- CreateTable
CREATE TABLE "SearchedCoin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchedCoin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchedCoin_name_key" ON "SearchedCoin"("name");

-- CreateIndex
CREATE INDEX "SearchedCoin_count_idx" ON "SearchedCoin"("count");

