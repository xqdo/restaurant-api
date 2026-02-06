-- AlterTable
ALTER TABLE "receipt" ADD COLUMN "customer_name" TEXT;
ALTER TABLE "receipt" ADD COLUMN "quick_discount" DECIMAL;

-- AlterTable
ALTER TABLE "receipt_items" ADD COLUMN "unit_price" DECIMAL;

-- CreateTable
CREATE TABLE "storage_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "current_quantity" DECIMAL NOT NULL DEFAULT 0,
    "min_quantity" DECIMAL,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "storage_items_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "storage_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "storage_item_id" INTEGER NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unit_price" DECIMAL,
    "supplier" TEXT,
    "notes" TEXT,
    "entry_date" DATETIME NOT NULL,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "storage_entries_storage_item_id_fkey" FOREIGN KEY ("storage_item_id") REFERENCES "storage_items" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "storage_entries_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "storage_usages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "storage_item_id" INTEGER NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "usage_date" DATETIME NOT NULL,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "storage_usages_storage_item_id_fkey" FOREIGN KEY ("storage_item_id") REFERENCES "storage_items" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "storage_usages_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "item_price_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "item_id" INTEGER NOT NULL,
    "price" DECIMAL NOT NULL,
    "effective_from" DATETIME NOT NULL,
    "effective_to" DATETIME,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "item_price_history_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "item_price_history_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
