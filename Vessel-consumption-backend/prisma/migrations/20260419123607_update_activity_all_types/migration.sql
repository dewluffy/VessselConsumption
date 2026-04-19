/*
  Warnings:

  - You are about to drop the column `mainEngineCount` on the `activity` table. All the data in the column will be lost.
  - You are about to drop the column `mainEngineHours` on the `activity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `activity` DROP COLUMN `mainEngineCount`,
    DROP COLUMN `mainEngineHours`,
    ADD COLUMN `anchorLocation` VARCHAR(200) NULL,
    ADD COLUMN `currentDirection` VARCHAR(20) NULL,
    ADD COLUMN `mainEngine1Count` INTEGER NULL,
    ADD COLUMN `mainEngine1Hours` DECIMAL(10, 2) NULL,
    ADD COLUMN `mainEngine2Count` INTEGER NULL,
    ADD COLUMN `mainEngine2Hours` DECIMAL(10, 2) NULL,
    ADD COLUMN `windDirection` VARCHAR(10) NULL;
