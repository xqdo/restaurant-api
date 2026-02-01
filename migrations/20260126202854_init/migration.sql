-- CreateTable
CREATE TABLE "base_entity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL,
    "created_by" INTEGER,
    "upadated_at" DATETIME,
    "updated_by" INTEGER,
    "deleted_at" DATETIME,
    "deleted_by" INTEGER,
    "isdeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "base_entity_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "base_entity_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "base_entity_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullname" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "users_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "tables" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "tables_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "sections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "sections_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "section_id" INTEGER NOT NULL,
    "price" DECIMAL NOT NULL,
    "image_id" INTEGER,
    "description" TEXT,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "items_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "items_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "receipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "is_delivery" BOOLEAN NOT NULL DEFAULT false,
    "phone_number" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "table_id" INTEGER,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "receipt_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "receipt_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "receipt_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receipt_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipt" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "receipt_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "receipt_items_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "delivery_guys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "delivery_guys_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "delivery_receipts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dilvery_guy_id" INTEGER NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "receipt_id" INTEGER NOT NULL,
    CONSTRAINT "delivery_receipts_dilvery_guy_id_fkey" FOREIGN KEY ("dilvery_guy_id") REFERENCES "delivery_guys" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "delivery_receipts_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipt" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "max_receipts" INTEGER,
    "amount" DECIMAL,
    "persentage" DECIMAL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "discounts_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "discount_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "item_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "min_quantity" DECIMAL NOT NULL DEFAULT 1,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "discount_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "discount_items_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "discount_items_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "discount_conditions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discount_id" INTEGER NOT NULL,
    "condition_type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "base_entity_id" INTEGER NOT NULL,
    CONSTRAINT "discount_conditions_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "discount_conditions_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "receipt_discounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receipt_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    CONSTRAINT "receipt_discounts_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipt" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "receipt_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "receipt_item_discounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receipt_item_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "applied_amount" DECIMAL NOT NULL,
    CONSTRAINT "receipt_item_discounts_receipt_item_id_fkey" FOREIGN KEY ("receipt_item_id") REFERENCES "receipt_items" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "receipt_item_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "event" TEXT NOT NULL,
    "occurred_at" DATETIME NOT NULL,
    CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateIndex
CREATE UNIQUE INDEX "tables_number_key" ON "tables"("number");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");
