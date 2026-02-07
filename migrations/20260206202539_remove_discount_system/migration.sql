/*
  Warnings:

  - You are about to drop the `discount_conditions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `discount_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `discounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `receipt_discounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `receipt_item_discounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "discount_conditions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "discount_items";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "discounts";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "receipt_discounts";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "receipt_item_discounts";
PRAGMA foreign_keys=on;
