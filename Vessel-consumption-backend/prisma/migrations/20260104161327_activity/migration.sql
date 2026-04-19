/*
  Warnings:

  - You are about to drop the column `activityAt` on the `activity` table. All the data in the column will be lost.
  - The values [SAILING,PORT,BUNKERING,MAINTENANCE] on the enum `Activity_type` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `endAt` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startAt` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `activity` DROP COLUMN `activityAt`,
    ADD COLUMN `avgSpeed` DECIMAL(10, 2) NULL,
    ADD COLUMN `containerCount` INTEGER NULL,
    ADD COLUMN `endAt` DATETIME(3) NOT NULL,
    ADD COLUMN `fuelUsed` DECIMAL(12, 2) NULL,
    ADD COLUMN `generatorCount` INTEGER NULL,
    ADD COLUMN `generatorHours` DECIMAL(10, 2) NULL,
    ADD COLUMN `mainEngineCount` INTEGER NULL,
    ADD COLUMN `mainEngineHours` DECIMAL(10, 2) NULL,
    ADD COLUMN `reeferCount` INTEGER NULL,
    ADD COLUMN `startAt` DATETIME(3) NOT NULL,
    ADD COLUMN `totalContainerWeight` DECIMAL(14, 3) NULL,
    MODIFY `type` ENUM('CARGO_LOAD', 'MANOEUVRING', 'FULL_SPEED_AWAY', 'ANCHORING', 'CARGO_DISCHARGE', 'OTHER') NOT NULL,
    MODIFY `remark` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `voyage` ADD COLUMN `postingMonth` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `postingYear` INTEGER NOT NULL DEFAULT 2026;

-- CreateIndex
CREATE INDEX `Voyage_postingYear_postingMonth_idx` ON `Voyage`(`postingYear`, `postingMonth`);
