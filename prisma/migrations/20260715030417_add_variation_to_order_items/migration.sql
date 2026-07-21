-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "color" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "variationId" INTEGER;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "Variation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
