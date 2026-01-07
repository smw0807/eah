-- AlterTable
ALTER TABLE "auctions" ADD COLUMN     "sub_category_id" INTEGER;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
