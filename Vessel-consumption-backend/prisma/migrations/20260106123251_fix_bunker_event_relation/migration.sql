/*
  Warnings:

  - A unique constraint covering the columns `[activityId,category,itemName,scope]` on the table `Consumption` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `robClosing` to the `Consumption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `robOpening` to the `Consumption` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `consumption` ADD COLUMN `note` VARCHAR(191) NULL,
    ADD COLUMN `robClosing` DECIMAL(12, 2) NOT NULL,
    ADD COLUMN `robOpening` DECIMAL(12, 2) NOT NULL;

-- AlterTable
ALTER TABLE `vesselassignment` ADD COLUMN `endedAt` DATETIME(3) NULL,
    ADD COLUMN `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `BunkerEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consumptionId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `liters` DECIMAL(12, 2) NOT NULL,
    `supplier` VARCHAR(191) NULL,
    `documentNo` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BunkerEvent_consumptionId_date_idx`(`consumptionId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Consumption_activityId_category_itemName_scope_key` ON `Consumption`(`activityId`, `category`, `itemName`, `scope`);

-- AddForeignKey
ALTER TABLE `BunkerEvent` ADD CONSTRAINT `BunkerEvent_consumptionId_fkey` FOREIGN KEY (`consumptionId`) REFERENCES `Consumption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
