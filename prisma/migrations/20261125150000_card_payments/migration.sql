-- AlterTable
ALTER TABLE "wallet_transaction" ADD COLUMN "providerReference" TEXT,
ADD COLUMN "fee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "chargedAmount" INTEGER,
ADD COLUMN "chargedCurrency" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transaction_providerReference_key" ON "wallet_transaction"("providerReference");
