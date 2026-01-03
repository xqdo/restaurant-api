-- CreateEnum
CREATE TYPE "status_t" AS ENUM ('pending', 'preparing', 'ready', 'done');

-- CreateEnum
CREATE TYPE "type_t" AS ENUM ('amount', 'percentage', 'combo');

-- CreateEnum
CREATE TYPE "condition_type_t" AS ENUM ('min_amount', 'day_of_week');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED');

-- CreateTable
CREATE TABLE "base_entity" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP NOT NULL,
    "created_by" INTEGER,
    "upadated_at" TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMP,
    "deleted_by" INTEGER,
    "isdeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "base_entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "fullname" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "path" VARCHAR(255) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "section_id" INTEGER NOT NULL,
    "price" DECIMAL NOT NULL,
    "image_id" INTEGER,
    "description" TEXT,
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "is_delivery" BOOLEAN NOT NULL DEFAULT false,
    "phone_number" VARCHAR(255),
    "location" VARCHAR(255),
    "notes" TEXT,
    "table_id" INTEGER,
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_items" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "status" "status_t" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_guys" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(255) NOT NULL,
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "delivery_guys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_receipts" (
    "id" SERIAL NOT NULL,
    "dilvery_guy_id" INTEGER NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "receipt_id" INTEGER NOT NULL,

    CONSTRAINT "delivery_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "type" "type_t" NOT NULL,
    "max_receipts" INTEGER,
    "amount" DECIMAL,
    "persentage" DECIMAL,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_items" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "min_quantity" DECIMAL NOT NULL DEFAULT 1,
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "discount_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_conditions" (
    "id" SERIAL NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "condition_type" "condition_type_t" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "base_entity_id" INTEGER NOT NULL,

    CONSTRAINT "discount_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_discounts" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,

    CONSTRAINT "receipt_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_item_discounts" (
    "id" SERIAL NOT NULL,
    "receipt_item_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "applied_amount" DECIMAL NOT NULL,

    CONSTRAINT "receipt_item_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "event" VARCHAR(255) NOT NULL,
    "occurred_at" TIMESTAMP NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tables_number_key" ON "tables"("number");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");

-- AddForeignKey
ALTER TABLE "base_entity" ADD CONSTRAINT "base_entity_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "base_entity" ADD CONSTRAINT "base_entity_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "base_entity" ADD CONSTRAINT "base_entity_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_guys" ADD CONSTRAINT "delivery_guys_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_receipts" ADD CONSTRAINT "delivery_receipts_dilvery_guy_id_fkey" FOREIGN KEY ("dilvery_guy_id") REFERENCES "delivery_guys"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_receipts" ADD CONSTRAINT "delivery_receipts_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discount_items" ADD CONSTRAINT "discount_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discount_items" ADD CONSTRAINT "discount_items_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discount_items" ADD CONSTRAINT "discount_items_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discount_conditions" ADD CONSTRAINT "discount_conditions_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discount_conditions" ADD CONSTRAINT "discount_conditions_base_entity_id_fkey" FOREIGN KEY ("base_entity_id") REFERENCES "base_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_discounts" ADD CONSTRAINT "receipt_discounts_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_discounts" ADD CONSTRAINT "receipt_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_item_discounts" ADD CONSTRAINT "receipt_item_discounts_receipt_item_id_fkey" FOREIGN KEY ("receipt_item_id") REFERENCES "receipt_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_item_discounts" ADD CONSTRAINT "receipt_item_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
