/*
  Warnings:

  - A unique constraint covering the columns `[parent_id,code]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "categories_parent_id_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "categories_parent_id_code_key" ON "categories"("parent_id", "code");
