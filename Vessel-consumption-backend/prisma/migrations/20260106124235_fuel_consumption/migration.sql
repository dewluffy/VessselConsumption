/*
  Warnings:

  - You are about to drop the column `note` on the `consumption` table. All the data in the column will be lost.
  - You are about to drop the column `robClosing` on the `consumption` table. All the data in the column will be lost.
  - You are about to drop the column `robOpening` on the `consumption` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `vesselassignment` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `vesselassignment` table. All the data in the column will be lost.
  - You are about to drop the `bunkerevent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `bunkerevent` DROP FOREIGN KEY `BunkerEvent_consumptionId_fkey`;

-- DropForeignKey
ALTER TABLE `consumption` DROP FOREIGN KEY `Consumption_activityId_fkey`;

-- DropIndex
DROP INDEX `Consumption_activityId_category_itemName_scope_key` ON `consumption`;

-- AlterTable
ALTER TABLE `consumption` DROP COLUMN `note`,
    DROP COLUMN `robClosing`,
    DROP COLUMN `robOpening`;

-- AlterTable
ALTER TABLE `vesselassignment` DROP COLUMN `endedAt`,
    DROP COLUMN `startedAt`;

-- DropTable
DROP TABLE `bunkerevent`;

-- CreateTable
CREATE TABLE `FuelRob` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voyageId` INTEGER NOT NULL,
    `openingRob` DOUBLE NOT NULL DEFAULT 0,
    `closingRob` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'L',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FuelRob_voyageId_key`(`voyageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FuelBunkerEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voyageId` INTEGER NOT NULL,
    `at` DATETIME(3) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'L',
    `remark` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FuelBunkerEvent_voyageId_at_idx`(`voyageId`, `at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FuelRob` ADD CONSTRAINT `FuelRob_voyageId_fkey` FOREIGN KEY (`voyageId`) REFERENCES `Voyage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FuelBunkerEvent` ADD CONSTRAINT `FuelBunkerEvent_voyageId_fkey` FOREIGN KEY (`voyageId`) REFERENCES `Voyage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
