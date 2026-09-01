-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_fixedItemId_fkey";

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_fixedItemId_fkey" FOREIGN KEY ("fixedItemId") REFERENCES "FixedItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
